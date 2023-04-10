import type { DatabaseUpdateMethod, Entity, EntityObjects } from '@amnis/state';
import { GrantScope } from '@amnis/state';
import type { PatchOperation } from '@azure/cosmos';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';
import { convertDollarKeys, itemToEntity } from './utility.js';

export const cosmosUpdateInitializer: CosmosDatabaseMethodInitalizer<DatabaseUpdateMethod> = ({
  database,
  partitions,
}) => async (state, controls = {}) => {
  const { scope, subject } = controls;
  const result: EntityObjects = {};

  const containerPromises = Object.entries(state).map<Promise<[string, Entity[]]>>(
    async ([sliceKey, updates]) => {
      const scopeSlice = scope?.[sliceKey];
      if (scope && !scopeSlice) {
        return [sliceKey, []];
      }

      const partition = partitions[sliceKey];

      const updatePromises = updates.map<Promise<Entity | undefined>>(async (update) => {
        const { $id, ...rest } = update;
        const partitionValue = partition && rest[partition];

        /**
         * Remove the partition key from the update object.
         */
        if (partitionValue) {
          delete rest[partition];
        }

        const partial = convertDollarKeys(rest);

        const operations = Object.entries(partial).map<PatchOperation>(
          ([key, value]) => ({
            op: 'replace',
            path: `/${key}`,
            value,
          }),
        );

        const conditions: string[] = ['FROM c WHERE c.delete = false'];

        if (scopeSlice === GrantScope.Owned) {
          conditions.push(`c.d_owner = "${subject}"`);
        }

        try {
          const { resource } = await database.container(sliceKey).item(
            $id,
            partitionValue ?? $id,
          ).patch({
            operations,
            condition: conditions.join(' AND '),
          });

          if (resource) {
            return itemToEntity(resource);
          }
          return undefined;
        } catch (error) {
          return undefined;
        }
      });

      const updateResults = await Promise.all(updatePromises);
      const updated = updateResults.filter((entity) => !!entity) as Entity[];

      return [sliceKey, updated];
    },
  );

  const containerResults = await Promise.all(containerPromises);

  containerResults.forEach(([sliceKey, entities]) => {
    if (entities.length > 0) {
      result[sliceKey] = entities;
    }
  });

  return result;
};

export default cosmosUpdateInitializer;
