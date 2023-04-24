import type {
  DataFilter,
  DatabaseReadMethod,
  Entity,
  EntityObjects,
  History,
} from '@amnis/state';
import {
  regexJsonKey,
  GrantScope,
  historySlice,
} from '@amnis/state';
import type { JSONValue, SqlParameter, SqlQuerySpec } from '@azure/cosmos';
import type { CosmosDatabaseMethodInitalizer } from './cosmos.types.js';
import { convertDollarKeys, itemsToEntities } from './utility.js';

type SqlScoping = { offset: number, limit: number, orderBy: string, orderDir: 'ASC' | 'DESC'};

type SqlFilters = Record<keyof DataFilter, Partial<Entity> & { [key: string]: JSONValue }>;

type SqlOperatorMap = Record<keyof DataFilter, string>;

const sqlOperatorMap: SqlOperatorMap = {
  $eq: '=',
  $neq: '!=',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
  $in: 'IN',
  $nin: 'NOT IN',
};

/**
 * Ensures a number is within the given range and is a whole number
 */
const clamp = (value: number, min: number, max: number): number => {
  const rounded = parseInt(`${Math.round(value)}`, 10);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
};

/**
 * Builds an SQL query string and parameters object from the given scoping and filters.
 */
const buildSqlQuerySpec = (
  scoping: SqlScoping,
  filters: SqlFilters,
): SqlQuerySpec => {
  const queryParts: string[] = [];
  queryParts.push('SELECT * FROM c');
  const sqlScopingString = `ORDER BY c.${scoping.orderBy} ${scoping.orderDir} OFFSET ${scoping.offset} LIMIT ${scoping.limit}`;

  const parameters: SqlParameter[] = [];

  if (Object.keys(filters).length === 0) {
    queryParts.push(sqlScopingString);
    return { query: queryParts.join(' '), parameters };
  }

  queryParts.push('WHERE');

  const filterParts: string[] = [];
  Object.entries(filters).forEach(([operator, filter]) => {
    const sqlOperator = sqlOperatorMap[operator as keyof DataFilter];
    if (!sqlOperator) {
      return;
    }

    Object.entries(filter).forEach(([key, value]) => {
      const parameterName = `@${key}`;

      switch (sqlOperator) {
        case sqlOperatorMap.$in:
          filterParts.push(`ARRAY_CONTAINS(${parameterName}, c.${key})`);
          break;

        case sqlOperatorMap.$nin:
          filterParts.push(`NOT ARRAY_CONTAINS(${parameterName}, c.${key})`);
          break;

        default:
          filterParts.push(`c.${key} ${sqlOperator} ${parameterName}`);
      }

      parameters.push({ name: parameterName, value });
    });
  });

  queryParts.push(filterParts.join(' AND '));
  queryParts.push(sqlScopingString);

  const query = queryParts.join(' ');

  return { query, parameters };
};

/**
 * Read method initializer for CosmosDB.
 */
export const cosmosReadInitializer: CosmosDatabaseMethodInitalizer<DatabaseReadMethod> = ({
  database,
}) => async (state, controls = {}) => {
  const { scope, subject } = controls;
  const result: EntityObjects = {};

  const readPromises = Object.entries(state).map<
  Promise<[
    string,
    Entity[] | undefined,
    Entity<History>[] | undefined
  ]>
  >(async ([sliceKey, options]) => {
    const scopeSlice = scope?.[sliceKey];
    if (scope && !scopeSlice) {
      return [sliceKey, undefined, undefined];
    }

    const sqlScoping: SqlScoping = {
      offset: 0,
      limit: 20,
      orderBy: 'id',
      orderDir: 'ASC',
    };
    const sqlFilters: SqlFilters = {
      $eq: {},
      $neq: {},
      $gt: {},
      $gte: {},
      $lt: {},
      $lte: {},
      $in: {},
      $nin: {},
    };

    const {
      $query: $queryRaw = {},
      $range = {},
      $order = ['id', 'asc'],
      $history,
    } = options;
    const $query = convertDollarKeys($queryRaw);

    const {
      start = 0,
      limit = 20,
    } = $range;

    const [
      by,
      direction,
    ] = $order;

    const byConverted = by === '$id' ? 'id' : by.replace('$', 'd_');

    /**
     * Set the SQL offset limit parameters.
     */
    sqlScoping.offset = clamp(start, 0, 1024);
    sqlScoping.limit = clamp(limit, 0, 128);
    sqlScoping.orderBy = regexJsonKey.test(byConverted) ? byConverted : 'id';
    sqlScoping.orderDir = direction === 'asc' ? 'ASC' : 'DESC';

    /**
     * Always filter out items marked for deletion.
     */
    sqlFilters.$eq.delete = false;

    /**
     * Filter by subject if the scope is set to OWNED.
     */
    if (scopeSlice === GrantScope.Owned) {
      if (typeof subject !== 'string') {
        return [sliceKey, undefined, undefined];
      }
      sqlFilters.$eq.d_owner = subject;
    }

    /**
     * Apply the query filters.
     */
    Object.entries($query).forEach(([property, filter]) => {
      /**
       * Properties must be valid variable names.
       */
      if (!regexJsonKey.test(property)) {
        return;
      }

      Object.entries(filter).forEach(([operator, value]) => {
        const sqlFilter = sqlFilters[operator as keyof SqlFilters];
        if (sqlFilter) {
          sqlFilter[property] = value;
        }
      });
    });

    try {
      /**
       * Build the SQL query spec.
       */
      const querySpec = buildSqlQuerySpec(sqlScoping, sqlFilters);

      /**
       * Execute the query against CosmosDB.
       */
      const { resources } = await database.container(sliceKey).items.query(
        querySpec,
      ).fetchAll();

      /**
       * Map the CosmosDB resources to the Amnis Entity format.
       */
      const entities = itemsToEntities(resources);

      /**
       * If the history flag is set, fetch the history for each entity.
       */
      if ($history) {
        const subjectIds = resources.map((resource) => resource.id);
        const { resources: resourcesHistory } = await database.container(
          historySlice.key,
        ).items.query({
          query: `SELECT * FROM c WHERE c.d_subject IN (${subjectIds.map((subjectId) => `"${subjectId}"`).join(',')})`,
        }).fetchAll();

        const histories = itemsToEntities(resourcesHistory) as Entity<History>[];

        /**
         * Return with history.
         */
        return [sliceKey, entities, histories];
      }

      /**
       * Return the slice key and the entities.
       */
      return [sliceKey, entities, undefined];
    } catch (e) {
      return [sliceKey, undefined, undefined];
    }
  });

  /**
   * Wait for all read promises to resolve and return the result.
   */
  const readResults = await Promise.all(readPromises);
  readResults.forEach(([sliceKey, entities, histories]) => {
    result[sliceKey] = entities ?? [];
    if (entities && histories) {
      result[historySlice.key] = histories;
    }
  });

  return result;
};

export default cosmosReadInitializer;
