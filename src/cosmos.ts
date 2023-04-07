import type {
  Database,
} from '@amnis/state';
import type { CosmosClientDatabaseOptions } from './cosmos.types.js';
import { initialize } from './initialize.js';
import { cosmosCreateInitializer } from './create.js';
import { cosmosReadInitializer } from './read.js';
import { cosmosUpdateInitializer } from './update.js';
import { cosmosDeleteInitializer } from './delete.js';

export const databaseCosmosCreate = async (
  options: CosmosClientDatabaseOptions,
): Promise<Database> => {
  const [client, database] = await initialize(options);
  const interfaceDb = { client, database };

  return {
    initialize: async () => { /** no operation */ },
    create: cosmosCreateInitializer(interfaceDb),
    read: cosmosReadInitializer(interfaceDb),
    update: cosmosUpdateInitializer(interfaceDb),
    delete: cosmosDeleteInitializer(interfaceDb),
  };
};

export default databaseCosmosCreate;
