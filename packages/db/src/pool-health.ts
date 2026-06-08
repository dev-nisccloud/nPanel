import type { PoolMetrics } from "./index";

export type PoolHealthEvaluation = {
  healthy: boolean;
  degraded: boolean;
  warnings: string[];
};

/** Evaluate pool pressure for health checks and monitoring alerts. */
export function evaluatePoolHealth(metrics: PoolMetrics): PoolHealthEvaluation {
  const warnings: string[] = [];
  const inUse = metrics.total - metrics.idle;

  if (metrics.waiting > 0) {
    warnings.push(`pool_waiting:${metrics.waiting}`);
  }

  if (metrics.max > 0 && inUse >= metrics.max) {
    warnings.push("pool_saturated");
  }

  if (metrics.max > 0 && inUse / metrics.max >= 0.85) {
    warnings.push("pool_utilization_high");
  }

  const degraded = warnings.length > 0;
  return {
    healthy: !degraded,
    degraded,
    warnings,
  };
}
