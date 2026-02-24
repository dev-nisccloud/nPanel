import { PrismaClient } from "../prisma/generated/client";
import {
	parseDatabaseUrl,
	validateConnectionPoolConfig,
	getRecommendedConnectionPoolConfig,
} from "./connection-pool";

/**
 * Prisma Client Singleton Pattern for Next.js
 * 
 * Prevents multiple Prisma Client instances in development (HMR) and production.
 * This is critical to avoid database connection exhaustion.
 * 
 * In Next.js:
 * - Development: HMR can create multiple instances if not using singleton
 * - Production: Serverless functions might create separate instances
 * - Each instance creates its own connection pool (default ~10 connections)
 * 
 * This singleton ensures only ONE instance exists across the entire application lifecycle.
 */
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

/**
 * Validate and log connection pool configuration on startup
 * This helps identify missing configuration early
 */
function validateConnectionPoolOnStartup() {
	const databaseUrl = process.env.DATABASE_URL;
	const parsed = parseDatabaseUrl(databaseUrl);
	const validation = validateConnectionPoolConfig(parsed);

	if (!validation.isValid || validation.warnings.length > 0) {
		const env = process.env.NODE_ENV || "development";
		const recommended = getRecommendedConnectionPoolConfig(
			env as "development" | "staging" | "production"
		);

		console.warn("[Prisma Connection Pool] ⚠️  Connection pool configuration issues detected:");
		validation.warnings.forEach((warning) => {
			console.warn(`  - ${warning}`);
		});

		if (validation.recommendations.length > 0) {
			console.warn("\n[Prisma Connection Pool] 💡 Recommendations:");
			validation.recommendations.forEach((rec) => {
				console.warn(`  - ${rec}`);
			});
		}

		console.warn(
			`\n[Prisma Connection Pool] 📝 Example DATABASE_URL for ${env}:`
		);
		console.warn(
			`  DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=${recommended.connectionLimit}&pool_timeout=${recommended.poolTimeout}&connect_timeout=${recommended.connectTimeout}"`
		);
		console.warn(
			"\n[Prisma Connection Pool] 📚 See packages/db/CONNECTION_POOL_CONFIG.md for details.\n"
		);
	} else {
		const config = parsed?.config;
		console.log("[Prisma Connection Pool] ✅ Connection pool configured:");
		console.log(
			`  - connection_limit: ${config?.connectionLimit ?? "default (~10)"}`
		);
		console.log(
			`  - pool_timeout: ${config?.poolTimeout ?? "default (10s)"}s`
		);
		console.log(
			`  - connect_timeout: ${config?.connectTimeout ?? "default (5s)"}s`
		);
	}
}

/**
 * Get or create Prisma Client instance
 * Uses global singleton in development, module-level in production
 */
export const prisma =
	globalForPrisma.prisma ??
	(() => {
		// Validate connection pool configuration on first instance creation
		if (process.env.NODE_ENV !== "test") {
			validateConnectionPoolOnStartup();
		}

		return new PrismaClient({
			log:
				process.env.NODE_ENV === "development"
					? ["query", "error", "warn"]
					: ["error"],
		});
	})();

// Prevent multiple instances in development (Next.js HMR)
if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Disconnects Prisma Client when the process exits
 * This ensures connections are properly closed
 */
if (typeof process !== "undefined") {
	const gracefulShutdown = async () => {
		try {
			await prisma.$disconnect();
			console.log("[Prisma] Disconnected from database");
		} catch (error) {
			console.error("[Prisma] Error disconnecting:", error);
		}
	};

	// Handle various termination signals
	process.on("beforeExit", gracefulShutdown);
	process.on("SIGINT", gracefulShutdown);
	process.on("SIGTERM", gracefulShutdown);
	process.on("SIGUSR2", gracefulShutdown); // Nodemon restart signal

	// Handle uncaught exceptions
	process.on("uncaughtException", async (error) => {
		console.error("[Prisma] Uncaught exception, disconnecting:", error);
		await gracefulShutdown();
		process.exit(1);
	});

	// Handle unhandled promise rejections
	process.on("unhandledRejection", async (reason) => {
		console.error("[Prisma] Unhandled rejection, disconnecting:", reason);
		await gracefulShutdown();
		process.exit(1);
	});
}

// Export connection pool utilities
export * from "./connection-pool";
export * from "./monitor";

// Explicit named re-export for Turbopack (no `export *` from CJS Prisma client)
export { Prisma } from "../prisma/generated/client";

export default prisma;
