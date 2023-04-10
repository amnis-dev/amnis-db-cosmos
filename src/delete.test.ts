import type {
  DatabaseCreateMethod,
  DatabaseDeleteMethod,
  DatabaseReadMethod,
  DataDeleter,
  DataQuery,
  StateScope,
} from '@amnis/state';
import {
  GrantScope,
  databaseMemory,
  databaseMemoryClear,
} from '@amnis/state';
import { initialize, initializeClean } from './initialize.js';
import { testData, testOptions } from './test/test.js';
import { cosmosCreateInitializer } from './create.js';
import { cosmosReadInitializer } from './read.js';
import { cosmosDeleteInitializer } from './delete.js';
import type { CosmosDatabaseMethodContext } from './cosmos.types.js';

let cosmosContext: CosmosDatabaseMethodContext;
let createMethod: DatabaseCreateMethod;
let readMethod: DatabaseReadMethod;
let deleteMethod: DatabaseDeleteMethod;

beforeAll(async () => {
  databaseMemoryClear();
  await initializeClean(testOptions);
  cosmosContext = await initialize(testOptions);
  /**
   * Create test data for the read tests.
   */
  databaseMemory.create(testData);
  createMethod = cosmosCreateInitializer(cosmosContext);
  await createMethod(testData);

  /**
   * Initialize the read method.
   */
  readMethod = cosmosReadInitializer(cosmosContext);

  /**
   * Initialize the read method.
   */
  deleteMethod = cosmosDeleteInitializer(cosmosContext);
});

test('should delete the a single todo entity from the database', async () => {
  const deleter: DataDeleter = {
    todo: [testData.todo[0].$id],
  };

  const result = await deleteMethod(deleter);

  expect(Object.keys(result)).toHaveLength(1);
  expect(result.todo).toHaveLength(1);

  /**
   * Check that the entity was deleted.
   */
  const query: DataQuery = {
    todo: {
      $query: {
        $id: {
          $eq: testData.todo[0].$id,
        },
      },
    },
  };
  const resultRead = await readMethod(query);
  expect(resultRead.todo).toHaveLength(0);

  /**
   * Compare the result against the memory database.
   */
  const resultMemory = await databaseMemory.delete(deleter);
  expect(resultMemory).toEqual(result);

  /**
   * Check that the entity was deleted from the memory database.
   */
  const resultMemoryRead = await databaseMemory.read(query);
  expect(resultMemoryRead.todo).toHaveLength(0);
});

test('should not delete a todo entity that requires scope', async () => {
  const deleter: DataDeleter = {
    todo: [testData.todo[2].$id],
  };

  const scope: StateScope = {
    todo: GrantScope.Owned,
  };

  const result = await deleteMethod(deleter, { scope });

  expect(Object.keys(result)).toHaveLength(0);
  expect(result.todo).toBeUndefined();

  /**
   * Compare the result against the memory database.
   */
  const resultMemory = await databaseMemory.delete(deleter, { scope });
  expect(resultMemory).toEqual(result);
});

test('should delete the a single todo entity that is scoped', async () => {
  const deleter: DataDeleter = {
    todo: [testData.todo[2].$id],
  };

  const scope: StateScope = {
    todo: GrantScope.Owned,
  };

  const subject = testData.todo[2].$owner;

  const result = await deleteMethod(deleter, { scope, subject });

  expect(Object.keys(result)).toHaveLength(1);
  expect(result.todo).toHaveLength(1);

  /**
   * Compare the result against the memory database.
   */
  const resultMemory = await databaseMemory.delete(deleter, { scope, subject });
  expect(resultMemory).toEqual(result);
});
