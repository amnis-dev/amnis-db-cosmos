import type { DataDeleter, DatabaseDeleteMethod } from '@amnis/state';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';

export const cosmosDeleteInitializer: CosmosDatabaseMethodInitalizer<DatabaseDeleteMethod> = ({
  client,
  database,
}) => async (state, controls = {}) => {
  const result: DataDeleter = {};

  return result;
};

export default cosmosDeleteInitializer;
