import type { PoolMetrics } from "./index";
export type PoolHealthEvaluation = {
    healthy: boolean;
    degraded: boolean;
    warnings: string[];
};
/** Evaluate pool pressure for health checks and monitoring alerts. */
export declare function evaluatePoolHealth(metrics: PoolMetrics): PoolHealthEvaluation;
