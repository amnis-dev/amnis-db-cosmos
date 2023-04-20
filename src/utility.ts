import type { Entity } from '@amnis/state';
import type { CosmosItem } from './cosmos.types.js';

/**
 * Converts the keys of an object that start with the "$" character to start
 * with "d_" (d standing for dollar and the underscore as a separator).
 */
export const convertDollarKeys = <T extends Record<string, any>>(obj: T): T => {
  const newObj: T = Object.entries(obj).reduce<T>((acc, [key, value]) => {
    if (key.startsWith('$')) {
      if (key === '$id') {
        acc['id' as keyof T] = value;
        return acc;
      }
      acc[`d_${key.slice(1)}` as keyof T] = value;
    } else {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as T);

  return newObj;
};

/**
 * Converts an Entity to a Cosmos Item
 */
export const entityToItem = (entity: Entity): CosmosItem => {
  const { $id, ...rest } = entity;

  /**
   * Because of CosmosDB requires object keys to follow the C# identifier naming
   * conventions, we need to convert all keys that start with the "$" character
   * to start with "d_" (d standing for dollar and the underscore as a separator).
   */
  const item: CosmosItem = Object.entries(rest).reduce<CosmosItem>(
    (acc, [key, value]) => {
      if (key.startsWith('$')) {
        acc[`d_${key.slice(1)}`] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    },
    { id: $id } as CosmosItem,
  );

  return item;
};

/**
 * Converts an array of Entities to an array of Cosmos Items.
 */
export const entitiesToItems = (entities: Entity[]): CosmosItem[] => entities.map(entityToItem);

export const itemToEntity = (item: CosmosItem): Entity => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id, _rid, _etag, _self, _ts, _attachments, ...rest
  } = item;

  /**
   * Because of CosmosDB requires object keys to follow the C# identifier naming
   * conventions, we need to convert all keys that start with the "d_" character
   * to start with "$" (d standing for dollar and the underscore as a separator).
   */
  const entity: Entity = Object.entries(rest).reduce<Entity & Record<string, any>>(
    (acc, [key, value]) => {
      if (key.startsWith('d_')) {
        acc[`$${key.slice(2)}`] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    },
    { $id: id } as Entity,
  );

  return entity;
};

/**
 * Converts an array of Cosmos Items to an array of Entities.
 */
export const itemsToEntities = (items: CosmosItem[]): Entity[] => items.map(itemToEntity);
