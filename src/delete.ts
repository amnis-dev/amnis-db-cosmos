import type { DataDeleter, DatabaseDeleteMethod, UID } from '@amnis/state';
import { GrantScope } from '@amnis/state';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';

export const cosmosDeleteInitializer: CosmosDatabaseMethodInitalizer<DatabaseDeleteMethod> = ({
  database,
}) => async (state, controls = {}) => {
  const { scope, subject } = controls;
  const result: DataDeleter = {};

  const containerPromises = Object.entries(state).map<Promise<[string, UID[]]>>(
    async ([sliceKey, deletes]) => {
      const scopeSlice = scope?.[sliceKey];
      if (scope && !scopeSlice) {
        return [sliceKey, []];
      }

      const deletePromises = deletes.map<Promise<UID | undefined>>(async ($id) => {
        const conditions: string[] = ['FROM c WHERE c.delete = false'];

        if (scopeSlice === GrantScope.Owned) {
          conditions.push(`c.d_owner = "${subject}"`);
        }

        try {
          const { resource } = await database.container(sliceKey).item($id, $id).patch({
            operations: [{
              op: 'replace',
              path: '/delete',
              value: true,
            }],
            condition: conditions.join(' AND '),
          });

          if (resource) {
            return $id;
          }
          return undefined;
        } catch (error) {
          return undefined;
        }
      });

      const deleteResults = await Promise.all(deletePromises);
      const deleted = deleteResults.filter((id) => !!id) as UID[];

      return [sliceKey, deleted];
    },
  );

  const containerResults = await Promise.all(containerPromises);
  containerResults.forEach(([sliceKey, ids]) => {
    if (ids.length > 0) {
      result[sliceKey] = ids;
    }
  });

  return result;
};

export default cosmosDeleteInitializer;
