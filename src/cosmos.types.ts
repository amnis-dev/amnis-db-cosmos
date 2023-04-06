import type { CosmosClient, CosmosClientOptions, Database as CosmosDatabase } from '@azure/cosmos';

export interface CosmosClientDatabaseOptions extends CosmosClientOptions {
  databaseId: string;
}

export interface CosmosDatabaseMethodInitalizerParams {
  client: CosmosClient;
  database: CosmosDatabase;
}

export type CosmosDatabaseMethodInitalizer<T extends (...args: any) => any = () => void> = (
  params: CosmosDatabaseMethodInitalizerParams
) => T;
