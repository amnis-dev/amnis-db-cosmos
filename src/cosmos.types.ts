import type { Entity, UID } from '@amnis/state';
import type { CosmosClient, CosmosClientOptions, Database as CosmosDatabase } from '@azure/cosmos';

export type CosmosPartitions = Record<string, string | undefined>;
export interface CosmosClientDatabaseOptions extends CosmosClientOptions {
  databaseId: string;
  partitions?: CosmosPartitions;
}

export interface CosmosDatabaseMethodContext {
  client: CosmosClient;
  database: CosmosDatabase;
  partitions: CosmosPartitions;
}

export type CosmosDatabaseMethodInitalizer<T extends (...args: any) => any = () => void> = (
  params: CosmosDatabaseMethodContext
) => T;

export type CosmosItem = Omit<Entity, '$id'> & { id: UID; [key: string]: any };
