import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { resolve } from "node:path";

// Load local .env only when DATABASE_URL is not already set (CI / explicit env wins).
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(import.meta.dir, "../../../../apps/server/.env") });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set. In CI, set it as an env var. Locally, ensure apps/server/.env exists.",
  );
  process.exit(1);
}

// Log host only (never credentials) for CI debugging.
try {
  const { hostname, port } = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
  console.log(`Running migrations against ${hostname}:${port || "5432"}`);
} catch {
  console.log("Running migrations (could not parse DATABASE_URL host)");
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);
const migrationsFolder = resolve(import.meta.dir, "../migrations");

try {
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
} catch (error) {
  console.error("Migration failed:");
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}
