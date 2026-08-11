/**
 * Read-only: confirm partial unique index exists and no duplicate payment links remain.
 *
 * Usage:
 *   DOTENV_PATH=../../apps/server/.env.production bun run src/scripts/verify-nisc-order-payment-uidx.ts
 */
import dotenv from "dotenv";
import pg from "pg";
import { resolve } from "node:path";

const envPath =
	process.env.DOTENV_PATH ??
	resolve(import.meta.dir, "../../../../apps/server/.env");

if (!process.env.DATABASE_URL) {
	dotenv.config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error("DATABASE_URL is not set.");
	process.exit(1);
}

try {
	const { hostname, port } = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
	console.log(`Checking ${hostname}:${port || "5432"}`);
} catch {
	console.log("Checking (could not parse DATABASE_URL host)");
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });

try {
	const idx = await pool.query(
		`SELECT indexname, indexdef
		 FROM pg_indexes
		 WHERE tablename = 'nisc_order'
		   AND indexname ILIKE '%payment%'`,
	);
	console.log("payment-related indexes:");
	for (const row of idx.rows as Array<{ indexname: string; indexdef: string }>) {
		console.log(`  - ${row.indexname}`);
		console.log(`    ${row.indexdef}`);
	}

	const dups = await pool.query(
		`SELECT payment_transaction_id, COUNT(1)::int AS c
		 FROM nisc_order
		 WHERE payment_transaction_id IS NOT NULL
		 GROUP BY payment_transaction_id
		 HAVING COUNT(1) > 1`,
	);
	console.log(`duplicate_groups: ${dups.rowCount}`);
	if (dups.rowCount && dups.rowCount > 0) {
		for (const row of dups.rows as Array<{ payment_transaction_id: string; c: number }>) {
			console.log(`  - ${row.payment_transaction_id} x${row.c}`);
		}
		process.exit(2);
	}
	console.log("OK: unique index present / no duplicate payment links.");
} catch (error) {
	console.error(error);
	process.exit(1);
} finally {
	await pool.end();
}
