import type {
  DataUpdater,
  DatabaseCreateMethod,
  DatabaseUpdateMethod,
  StateScope,
} from '@amnis/state';
import {
  uid,

  GrantScope,
  databaseMemory,
  databaseMemoryClear,
} from '@amnis/state';
import { initialize, initializeClean } from './initialize.js';
import { testData, testOptions } from './test/test.js';
import { cosmosUpdateInitializer } from './update.js';
import { cosmosCreateInitializer } from './create.js';
import type { CosmosDatabaseMethodContext } from './cosmos.types.js';

let cosmosContext: CosmosDatabaseMethodContext;
let createMethod: DatabaseCreateMethod;
let updateMethod: DatabaseUpdateMethod;

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
  updateMethod = cosmosUpdateInitializer(cosmosContext);
});

test('should update the name of several test data entities', async () => {
  const update: DataUpdater = {
    user: [
      {
        $id: testData.user[0].$id,
        handle: 'update_user_0_handle',
      },
      {
        $id: testData.user[1].$id,
        handle: 'update_user_1_handle',
      },
    ],
    todo: [
      {
        $id: testData.todo[0].$id,
        completed: true,
      },
      {
        $id: testData.todo[1].$id,
        completed: true,
      },

    ],
  };

  const result = await updateMethod(update);
  expect(Object.keys(result)).toHaveLength(2);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.update(update);
  expect(result).toEqual(resultMemory);
});

test('should not update an item with a subject that is not the owner', async () => {
  const update: DataUpdater = {
    todo: [
      {
        $id: testData.todo[2].$id,
        completed: true,
      },
    ],
  };

  const scope: StateScope = {
    todo: GrantScope.Owned,
  };

  const subject = uid('user');

  const result = await updateMethod(update, { scope, subject });
  expect(Object.keys(result)).toHaveLength(0);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.update(update, { scope, subject });
  expect(result).toEqual(resultMemory);
});

test('should update an item with a subject that is the owner', async () => {
  const update: DataUpdater = {
    todo: [
      {
        $id: testData.todo[2].$id,
        completed: true,
      },
    ],
  };

  const scope: StateScope = {
    todo: GrantScope.Owned,
  };

  const subject = testData.user[1].$id;

  const result = await updateMethod(update, { scope, subject });
  expect(Object.keys(result)).toHaveLength(1);

  /**
   * Compare the result to the memory database.
   */
  const resultMemory = await databaseMemory.update(update, { scope, subject });
  expect(result).toEqual(resultMemory);
});
