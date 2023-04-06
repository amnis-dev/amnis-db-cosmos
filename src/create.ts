import type { DatabaseCreateMethod, Entity, EntityObjects } from '@amnis/state';
import { initializeCheck, initializeContainer } from './initialize.js';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';

export const cosmosCreateInitializer: CosmosDatabaseMethodInitalizer<DatabaseCreateMethod> = ({
  client,
  database,
}) => async (state) => {
  initializeCheck(client, database);

  const result: EntityObjects = {};

  /**
   * Insert the entities into the database.
   */
  const containerPromises = Object.entries(state).map<
  Promise<[string, Entity[]]>
  >(
    async ([sliceKey, entities]) => {
      await initializeContainer(database, sliceKey);

      const createPromises = entities.map<Promise<Entity | undefined>>(async (entity) => {
        const { $id, ...rest } = entity;
        const { resource } = await database.container(sliceKey).items.create({
          ...rest,
          id: $id,
        });
        if (resource) {
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            id, _rid, _etag, _self, _ts, ...resourceRest
          } = resource;
          return { ...resourceRest, $id: id };
        }
        return undefined;
      });

      const createResults = await Promise.all(createPromises);
      const created = createResults.filter((entity) => !!entity) as Entity[];

      return [sliceKey, created];
    },
  );

  // /**
  //  * Update the result with the entities that were successfully created.
  //  */
  const containerResults = await Promise.all(containerPromises);
  containerResults.forEach(([sliceKey, entities]) => {
    result[sliceKey] = entities;
  });

  return result;
};

export default cosmosCreateInitializer;
