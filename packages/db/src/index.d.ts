import { Pool } from "pg";
import * as schema from "./schema";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export type PoolMetrics = {
    max: number;
    total: number;
    idle: number;
    waiting: number;
    usingPooler: boolean;
    serviceRole: string | null;
};
/** Live connection-pool stats for health checks and monitoring. */
export declare function getPoolMetrics(): PoolMetrics;
export * from "drizzle-orm";
