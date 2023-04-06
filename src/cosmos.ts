import type {
  DataDeleter,
  EntityObjects,
  Database,
} from '@amnis/state';
import {
  noop,
} from '@amnis/state';
import { cosmosCreateInitializer } from './create.js';
import { initialize } from './initialize.js';
import type { CosmosClientDatabaseOptions } from './cosmos.types.js';

export const databaseCosmosCreate = async (
  options: CosmosClientDatabaseOptions,
): Promise<Database> => {
  const [client, database] = await initialize(options);

  return {
    initialize: noop,
    create: cosmosCreateInitializer({ client, database }),

    read: async () => {
      const result: EntityObjects = {};

      return result;
    },

    update: async () => {
      const result: EntityObjects = {};

      return result;
    },

    delete: async () => {
      const result: DataDeleter = {};

      return result;
    },
  };
};

export default databaseCosmosCreate;
