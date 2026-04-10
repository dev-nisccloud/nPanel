import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  // Single TS entry — avoid loading compiled `*.js` siblings in `src/schema`, which
  // duplicates tables/indexes and breaks `drizzle-kit generate` (e.g. agency_role_permission).
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
