import type { CosmosClient, Database as CosmosDatabase } from '@azure/cosmos';
import { databaseMemoryClear, databaseMemory } from '@amnis/state';
import type { DatabaseCreateMethod } from '@amnis/state';
import { initialize, initializeClean } from './initialize.js';
import { cosmosCreateInitializer } from './create.js';
import { testData, testOptions } from './test/test.js';

let client: CosmosClient;
let database: CosmosDatabase;
let createMethod: DatabaseCreateMethod;

beforeAll(async () => {
  databaseMemoryClear();
  await initializeClean(testOptions);
  const [clientInit, databaseInit] = await initialize(testOptions);
  client = clientInit;
  database = databaseInit;
  createMethod = cosmosCreateInitializer({ client, database });
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
  const { resources: userResources } = await database.container('user').items.query('SELECT * FROM c').fetchAll();
  expect(userResources).toHaveLength(4);

  const { resources: todoResources } = await database.container('todo').items.query('SELECT * FROM c').fetchAll();
  expect(todoResources).toHaveLength(5);
});
