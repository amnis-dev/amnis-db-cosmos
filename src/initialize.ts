import { CosmosClient } from '@azure/cosmos';
import type { Database as CosmosDatabase } from '@azure/cosmos';
import type { CosmosClientDatabaseOptions } from './cosmos.types.js';

/**
 * Check if the client and database has been initialized.
 */
export const initializeCheck = (
  client: CosmosClient,
  database: CosmosDatabase,
) => {
  if (!client) throw new Error('Database not initialized.');
  if (!database) throw new Error('Database not initialized.');
};

/**
 * Initalize CosmosDB Container (if it does not exist).
 */
export const initializeContainer = async (
  database: CosmosDatabase,
  containerId: string,
  partitionKey = '/id',
) => {
  await database.containers.createIfNotExists({
    id: containerId,
    partitionKey,
  });
};

/**
 * Initialize CosmosDB Database (if it does not exist).
 */
export const initialize = async (
  options: CosmosClientDatabaseOptions,
): Promise<[CosmosClient, CosmosDatabase]> => {
  const client = new CosmosClient(options);

  /**
   * Initialize the database and create it if it doesn't exist.
   */
  const { database } = await client.databases.createIfNotExists({
    id: options.databaseId,
  });

  return [client, database];
};

/**
 * Deletes the database.
 */
export const initializeClean = async (options: CosmosClientDatabaseOptions) => {
  try {
    const client = new CosmosClient(options);
    await client.database(options.databaseId).delete();
  } catch (error) {
    /** Already cleaned */
  }
};
