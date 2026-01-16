/**
 * Connection Pool Configuration Utilities
 * 
 * Provides utilities for validating and monitoring Prisma connection pool configuration.
 * Connection pool settings are configured via DATABASE_URL query parameters.
 */

export interface ConnectionPoolConfig {
	connectionLimit?: number;
	poolTimeout?: number;
	connectTimeout?: number;
}

export interface ParsedDatabaseUrl {
	url: string;
	hasConnectionLimit: boolean;
	hasPoolTimeout: boolean;
	hasConnectTimeout: boolean;
	config: ConnectionPoolConfig;
}

/**
 * Parse DATABASE_URL and extract connection pool configuration
 * @param databaseUrl - The DATABASE_URL environment variable value
 * @returns Parsed configuration with connection pool parameters
 */
export function parseDatabaseUrl(databaseUrl: string | undefined): ParsedDatabaseUrl | null {
	if (!databaseUrl) {
		return null;
	}

	try {
		const url = new URL(databaseUrl);
		const params = url.searchParams;

		const connectionLimit = params.get("connection_limit");
		const poolTimeout = params.get("pool_timeout");
		const connectTimeout = params.get("connect_timeout");

		return {
			url: databaseUrl,
			hasConnectionLimit: connectionLimit !== null,
			hasPoolTimeout: poolTimeout !== null,
			hasConnectTimeout: connectTimeout !== null,
			config: {
				connectionLimit: connectionLimit ? parseInt(connectionLimit, 10) : undefined,
				poolTimeout: poolTimeout ? parseInt(poolTimeout, 10) : undefined,
				connectTimeout: connectTimeout ? parseInt(connectTimeout, 10) : undefined,
			},
		};
	} catch (error) {
		// Invalid URL format
		return null;
	}
}

/**
 * Validate connection pool configuration and return recommendations
 * @param parsed - Parsed database URL configuration
 * @returns Validation result with warnings and recommendations
 */
export function validateConnectionPoolConfig(
	parsed: ParsedDatabaseUrl | null
): {
	isValid: boolean;
	warnings: string[];
	recommendations: string[];
} {
	if (!parsed) {
		return {
			isValid: false,
			warnings: ["DATABASE_URL is not set or invalid"],
			recommendations: ["Set DATABASE_URL environment variable"],
		};
	}

	const warnings: string[] = [];
	const recommendations: string[] = [];

	// Check for missing connection pool parameters
	if (!parsed.hasConnectionLimit) {
		warnings.push("connection_limit not set in DATABASE_URL");
		recommendations.push(
			"Add ?connection_limit=5 to DATABASE_URL (recommended: 5-10 for most applications)"
		);
	}

	if (!parsed.hasPoolTimeout) {
		warnings.push("pool_timeout not set in DATABASE_URL");
		recommendations.push("Add &pool_timeout=20 to DATABASE_URL (recommended: 20 seconds)");
	}

	if (!parsed.hasConnectTimeout) {
		warnings.push("connect_timeout not set in DATABASE_URL");
		recommendations.push("Add &connect_timeout=10 to DATABASE_URL (recommended: 10 seconds)");
	}

	// Validate connection limit value
	if (parsed.config.connectionLimit !== undefined) {
		if (parsed.config.connectionLimit < 1) {
			warnings.push("connection_limit is less than 1");
			recommendations.push("Set connection_limit to at least 1 (recommended: 5-10)");
		} else if (parsed.config.connectionLimit > 50) {
			warnings.push("connection_limit is very high (>50), may exhaust database connections");
			recommendations.push(
				"Consider reducing connection_limit to 10-20 for better connection management"
			);
		} else if (parsed.config.connectionLimit < 5) {
			recommendations.push(
				"connection_limit is low (<5), consider increasing to 5-10 for better concurrency"
			);
		}
	}

	// Validate timeout values
	if (parsed.config.poolTimeout !== undefined && parsed.config.poolTimeout < 5) {
		warnings.push("pool_timeout is very low (<5 seconds)");
		recommendations.push("Increase pool_timeout to at least 10-20 seconds");
	}

	if (parsed.config.connectTimeout !== undefined && parsed.config.connectTimeout < 5) {
		warnings.push("connect_timeout is very low (<5 seconds)");
		recommendations.push("Increase connect_timeout to at least 10 seconds");
	}

	return {
		isValid: warnings.length === 0,
		warnings,
		recommendations,
	};
}

/**
 * Get recommended connection pool configuration based on environment
 * @param environment - Environment (development, staging, production)
 * @returns Recommended configuration
 */
export function getRecommendedConnectionPoolConfig(
	environment: "development" | "staging" | "production" = "development"
): ConnectionPoolConfig {
	switch (environment) {
		case "development":
			return {
				connectionLimit: 5,
				poolTimeout: 20,
				connectTimeout: 10,
			};
		case "staging":
			return {
				connectionLimit: 10,
				poolTimeout: 20,
				connectTimeout: 10,
			};
		case "production":
			return {
				connectionLimit: 10,
				poolTimeout: 20,
				connectTimeout: 10,
			};
		default:
			return {
				connectionLimit: 5,
				poolTimeout: 20,
				connectTimeout: 10,
			};
	}
}

/**
 * Format connection pool configuration as DATABASE_URL query parameters
 * @param config - Connection pool configuration
 * @returns Query string with connection pool parameters
 */
export function formatConnectionPoolParams(config: ConnectionPoolConfig): string {
	const params: string[] = [];

	if (config.connectionLimit !== undefined) {
		params.push(`connection_limit=${config.connectionLimit}`);
	}
	if (config.poolTimeout !== undefined) {
		params.push(`pool_timeout=${config.poolTimeout}`);
	}
	if (config.connectTimeout !== undefined) {
		params.push(`connect_timeout=${config.connectTimeout}`);
	}

	return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Check current database connection pool status (PostgreSQL)
 * Returns the number of active connections for the current database
 * @param prisma - Prisma client instance
 * @returns Connection pool status information
 */
export async function getConnectionPoolStatus(prisma: any): Promise<{
	activeConnections: number;
	maxConnections: number | null;
	connectionLimit: number | null;
}> {
	try {
		const [activeResult, maxResult] = await Promise.all([
			prisma.$queryRaw<Array<{ count: bigint }>>`
				SELECT count(*) as count 
				FROM pg_stat_activity 
				WHERE datname = current_database()
					AND state = 'active'
			`,
			prisma.$queryRaw<Array<{ setting: string }>>`
				SELECT setting 
				FROM pg_settings 
				WHERE name = 'max_connections'
			`,
		]);

		const activeConnections = Number(activeResult[0]?.count || 0);
		const maxConnections = maxResult[0]?.setting
			? parseInt(maxResult[0].setting, 10)
			: null;

		// Try to get connection_limit from DATABASE_URL
		const databaseUrl = process.env.DATABASE_URL;
		const parsed = parseDatabaseUrl(databaseUrl);
		const connectionLimit = parsed?.config.connectionLimit || null;

		return {
			activeConnections,
			maxConnections,
			connectionLimit,
		};
	} catch (error) {
		console.error("[Connection Pool] Error checking connection pool status:", error);
		return {
			activeConnections: 0,
			maxConnections: null,
			connectionLimit: null,
		};
	}
}
