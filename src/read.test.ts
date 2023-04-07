import type { DataQuery, DatabaseCreateMethod, DatabaseReadMethod } from '@amnis/state';
import {
  databaseMemory,
  databaseMemoryClear,
} from '@amnis/state';
import type {
  CosmosClient,
  Database as CosmosDatabase,
} from '@azure/cosmos';
import { initialize, initializeClean } from './initialize.js';
import { testData, testOptions } from './test/test.js';
import { cosmosCreateInitializer } from './create.js';
import { cosmosReadInitializer } from './read.js';

let client: CosmosClient;
let database: CosmosDatabase;
let createMethod: DatabaseCreateMethod;
let readMethod: DatabaseReadMethod;

beforeAll(async () => {
  databaseMemoryClear();
  await initializeClean(testOptions);
  const [clientInit, databaseInit] = await initialize(testOptions);
  client = clientInit;
  database = databaseInit;

  /**
   * Create test data for the read tests.
   */
  databaseMemory.create(testData);
  createMethod = cosmosCreateInitializer({ client, database });
  await createMethod(testData);

  /**
   * Initialize the read method.
   */
  readMethod = cosmosReadInitializer({ client, database });
});

test('should query and receive entities', async () => {
  const query: DataQuery = {
    user: {},
    todo: {},
  };

  const result = await readMethod(query);

  expect(Object.keys(result)).toHaveLength(2);
});
