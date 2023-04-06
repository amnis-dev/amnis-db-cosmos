import {
  initialize,
  initializeCheck,
  // initializeClean,
} from './initialize.js';

const options = {
  databaseId: 'Test',
  endpoint: process.env.COSMOS_ENDPOINT ?? '',
  key: process.env.COSMOS_KEY ?? '',
  userAgentSuffix: 'CosmosDBTests',
};

// test('should clean database', async () => {
//   await initializeClean(options);
// });

test('should pass if initialized', async () => {
  const [client, database] = await initialize(options);
  expect(() => initializeCheck(client, database)).not.toThrow();
});
