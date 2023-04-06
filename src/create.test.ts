import type { CosmosClient, Database as CosmosDatabase } from '@azure/cosmos';
import type { DatabaseCreateMethod } from '@amnis/state';
import { stateEntitiesCreate, uid } from '@amnis/state';
import { initialize, initializeClean } from './initialize.js';
import { cosmosCreateInitializer } from './create.js';

let client: CosmosClient;
let database: CosmosDatabase;
let createMethod: DatabaseCreateMethod;

const options = {
  databaseId: 'Test',
  endpoint: process.env.COSMOS_ENDPOINT ?? '',
  key: process.env.COSMOS_KEY ?? '',
  userAgentSuffix: 'CosmosDBTests',
};

beforeAll(async () => {
  await initializeClean(options);
  await initialize(options);
  const [clientInit, databaseInit] = await initialize(options);
  client = clientInit;
  database = databaseInit;
  createMethod = cosmosCreateInitializer({ client, database });
});

test('should create new entities', async () => {
  const stateEntities = stateEntitiesCreate({
    todo: [
      {
        $id: uid('test'),
        title: 'Code Interface',
        completed: false,
      },
      {
        $id: uid('test'),
        title: 'Unit Test',
        completed: false,
      },
    ],
    people: [
      {
        $id: uid('people'),
        name: 'John',
        age: 30,
      },
    ],
  });

  const result = await createMethod(stateEntities);

  expect(result.todo).toBeDefined();
  expect(result.todo).toHaveLength(2);
  expect(result.todo[0].$id).toBeDefined();
  expect(result.todo[1].$id).toBeDefined();

  expect(result.people).toBeDefined();
  expect(result.people).toHaveLength(1);
  expect(result.people[0].$id).toBeDefined();
});
