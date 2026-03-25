/**
 * Connection Pool Monitoring Utilities
 * 
 * Provides utilities for monitoring database connection pool usage and health.
 */

import prisma from "./index";
import { getConnectionPoolStatus, parseDatabaseUrl } from "./connection-pool";

export interface ConnectionPoolMetrics {
	activeConnections: number;
	maxConnections: number | null;
	connectionLimit: number | null;
	utilizationPercent: number | null;
	isHealthy: boolean;
	timestamp: Date;
}

/**
 * Get current connection pool metrics
 * @returns Connection pool metrics including utilization
 */
export async function getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
	const status = await getConnectionPoolStatus(prisma);
	const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
	const connectionLimit = status.connectionLimit || parsed?.config.connectionLimit || 10;

	// Calculate utilization based on connection_limit (Prisma pool size)
	// Not max_connections (database limit)
	const utilizationPercent =
		connectionLimit > 0 ? (status.activeConnections / connectionLimit) * 100 : null;

	// Consider unhealthy if utilization is > 80%
	const isHealthy = utilizationPercent === null || utilizationPercent < 80;

	return {
		activeConnections: status.activeConnections,
		maxConnections: status.maxConnections,
		connectionLimit,
		utilizationPercent,
		isHealthy,
		timestamp: new Date(),
	};
}

/**
 * Log connection pool metrics to console
 * Useful for debugging and monitoring
 */
export async function logConnectionPoolMetrics(): Promise<void> {
	try {
		const metrics = await getConnectionPoolMetrics();

		console.log("[Connection Pool Metrics]");
		console.log(`  Active Connections: ${metrics.activeConnections}`);
		if (metrics.connectionLimit) {
			console.log(`  Connection Limit: ${metrics.connectionLimit}`);
		}
		if (metrics.maxConnections) {
			console.log(`  Database Max Connections: ${metrics.maxConnections}`);
		}
		if (metrics.utilizationPercent !== null) {
			const status = metrics.isHealthy ? "✅" : "⚠️";
			console.log(
				`  Pool Utilization: ${metrics.utilizationPercent.toFixed(1)}% ${status}`
			);
		}
		console.log(`  Timestamp: ${metrics.timestamp.toISOString()}`);
	} catch (error) {
		console.error("[Connection Pool Metrics] Error getting metrics:", error);
	}
}

/**
 * Check if connection pool is healthy
 * @param threshold - Utilization threshold (default: 80%)
 * @returns true if pool is healthy, false otherwise
 */
export async function isConnectionPoolHealthy(
	threshold: number = 80
): Promise<boolean> {
	const metrics = await getConnectionPoolMetrics();
	if (metrics.utilizationPercent === null) {
		return true; // Can't determine, assume healthy
	}
	return metrics.utilizationPercent < threshold;
}
