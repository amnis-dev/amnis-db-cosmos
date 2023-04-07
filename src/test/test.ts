import type { EntityObjects } from '@amnis/state';
import { uid, stateEntitiesCreate } from '@amnis/state';
import type { CosmosClientDatabaseOptions } from '../cosmos.types.js';

export const testOptions: CosmosClientDatabaseOptions = {
  databaseId: 'Test',
  endpoint: process.env.COSMOS_ENDPOINT ?? '',
  key: process.env.COSMOS_KEY ?? '',
  userAgentSuffix: 'CosmosDBTests',
};

const user = [
  {
    $id: uid('user'),
    handle: 'eric',
    email: 'eric@email.mail',
    password: 'password',
  },
  {
    $id: uid('user'),
    handle: 'sarah',
    email: 'sarah@email.mail',
    password: 'password',
  },
  {
    $id: uid('user'),
    handle: 'finnick',
    email: 'finnick@email.mail',
    password: 'password',
  },
  {
    $id: uid('user'),
    handle: 'sophia',
    email: 'sophia@email.mail',
    password: 'password',
  },
];

const todo = [
  {
    $id: uid('todo'),
    title: 'Code Interface',
    completed: false,
    $owner: user[0].$id,
  },
  {
    $id: uid('todo'),
    title: 'Unit Test',
    completed: false,
    $owner: user[0].$id,
  },
  {
    $id: uid('todo'),
    title: 'Create Blueprint',
    completed: true,
    $owner: user[1].$id,
  },
  {
    $id: uid('todo'),
    title: 'Cut Fabric',
    completed: false,
    $owner: user[1].$id,
  },
  {
    $id: uid('todo'),
    title: 'Order Materials',
    completed: false,
    $owner: user[1].$id,
  },
];

export const testData: EntityObjects = stateEntitiesCreate({
  user,
  todo,
}, { committed: true, new: false });
