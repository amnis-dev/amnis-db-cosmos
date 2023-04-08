import type {
  DataQuery,
  DatabaseCreateMethod,
  DatabaseReadMethod,
  StateScope,
} from '@amnis/state';
import {
  GrantScope,
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
  Object.entries(result).forEach(([sliceKey, entities]) => {
    /**
     * Check that the number of entities is correct.
     */
    expect(entities).toHaveLength(testData[sliceKey].length);

    /**
     * Check that the entities have an $id property.
     */
    entities.forEach((entity) => {
      expect(entity.$id).toBeDefined();
    });
  });

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.read(query);
  expect(result).toEqual(resultMemory);
});

test('should query users and todo with a limit', async () => {
  const query: DataQuery = {
    user: {
      $range: {
        limit: 1,
      },
    },
    todo: {
      $range: {
        limit: 1,
      },
    },
  };

  const result = await readMethod(query);
  expect(Object.keys(result)).toHaveLength(2);
  expect(result.user).toHaveLength(1);
  expect(result.todo).toHaveLength(1);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.read(query);
  expect(result).toEqual(resultMemory);
});

test('should query users and todo with a limit and start range', async () => {
  const query: DataQuery = {
    user: {
      $range: {
        limit: 1,
        start: 1,
      },
    },
    todo: {
      $range: {
        limit: 1,
        start: 1,
      },
    },
  };

  const result = await readMethod(query);
  expect(Object.keys(result)).toHaveLength(2);
  expect(result.user).toHaveLength(1);
  expect(result.todo).toHaveLength(1);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.read(query);
  expect(result).toEqual(resultMemory);
});

test('should query users and order them by handle', async () => {
  const query: DataQuery = {
    user: {
      $order: ['handle', 'asc'],
    },
  };

  const result = await readMethod(query);
  expect(Object.keys(result)).toHaveLength(1);
  expect(result.user).toHaveLength(testData.user.length);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.read(query);
  expect(result).toEqual(resultMemory);
});

test('should query todo scoped by owner grant', async () => {
  const query: DataQuery = {
    todo: {},
  };

  const scope: StateScope = {
    todo: GrantScope.Owned,
  };

  const subject = testData.user[0].$id;

  const result = await readMethod(query, { scope, subject });
  expect(Object.keys(result)).toHaveLength(1);
  expect(result.todo).toHaveLength(2);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.read(query, { scope, subject });
  expect(result).toEqual(resultMemory);
});
