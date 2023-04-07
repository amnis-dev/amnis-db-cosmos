import type { DatabaseUpdateMethod, EntityObjects } from '@amnis/state';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';

export const cosmosUpdateInitializer: CosmosDatabaseMethodInitalizer<DatabaseUpdateMethod> = ({
  client,
  database,
}) => async (state, controls = {}) => {
  const result: EntityObjects = {};

  return result;
};

export default cosmosUpdateInitializer;
