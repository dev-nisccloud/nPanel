import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load local .env for development; in CI the DATABASE_URL is injected directly
// into the environment by the workflow, so this is a no-op there.
dotenv.config({ path: "../../apps/server/.env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. In CI, add it as a GitHub secret. Locally, ensure apps/server/.env exists."
  );
}

export default defineConfig({
  // Single TS entry   avoid loading compiled `*.js` siblings in `src/schema`, which
  // duplicates tables/indexes and breaks `drizzle-kit generate` (e.g. agency_role_permission).
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
