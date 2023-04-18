import { CosmosClient } from '@azure/cosmos';
import type { Database as CosmosDatabase } from '@azure/cosmos';
import type { CosmosClientDatabaseOptions, CosmosDatabaseMethodContext } from './cosmos.types.js';

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
  partitionKey = '$id',
): Promise<boolean> => {
  const partitionCosmos = partitionKey === '$id' ? 'id' : partitionKey.replace('$', 'd_');

  try {
    await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: `/${partitionCosmos}`,
      maxThroughput: 1000,
    });

    return true;
  } catch (error) {
    console.error(error);

    return false;
  }
};

/**
 * Initialize CosmosDB Database (if it does not exist).
 */
export const initialize = async (
  options: CosmosClientDatabaseOptions,
): Promise<CosmosDatabaseMethodContext> => {
  try {
    const {
      databaseId,
      partitions: customPartitions = {},
      ...clientOptions
    } = options;
    const client = new CosmosClient(clientOptions);

    /**
   * Set default partition keys.
   */
    const partitions = {
      handle: 'name',
      history: '$subject',
      ...customPartitions,
    };

    /**
   * Initialize the database and create it if it doesn't exist.
   */
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });

    return { client, database, partitions };
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }
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
