import { databaseMemoryClear, databaseMemory } from '@amnis/state';
import type { DatabaseCreateMethod } from '@amnis/state';
import { initialize, initializeClean } from './initialize.js';
import { cosmosCreateInitializer } from './create.js';
import { testData, testOptions } from './test/test.js';
import type { CosmosDatabaseMethodContext } from './cosmos.types.js';

let cosmosContext: CosmosDatabaseMethodContext;
let createMethod: DatabaseCreateMethod;

beforeAll(async () => {
  databaseMemoryClear();
  await initializeClean(testOptions);
  cosmosContext = await initialize(testOptions);
  createMethod = cosmosCreateInitializer(cosmosContext);
});

test('should create new entities', async () => {
  const result = await createMethod(testData);

  expect(Object.keys(result)).toHaveLength(2);
  Object.entries(result).forEach(([sliceKey, entities]) => {
    expect(entities).toHaveLength(testData[sliceKey].length);
    entities.forEach((entity) => {
      expect(entity.$id).toBeDefined();
    });
  });

  const resultMemory = await databaseMemory.create(testData);
  expect(Object.keys(resultMemory)).toHaveLength(2);
  expect(result).toEqual(resultMemory);
});

test('should query and receive entities', async () => {
  const { resources: userResources } = await cosmosContext.database.container('user').items.query('SELECT * FROM c').fetchAll();
  expect(userResources).toHaveLength(4);

  const { resources: todoResources } = await cosmosContext.database.container('todo').items.query('SELECT * FROM c').fetchAll();
  expect(todoResources).toHaveLength(5);
});
