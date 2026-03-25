import { env } from "@npanel/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// Re-export all drizzle-orm operators so consumers import from "@npanel/db"
// instead of "drizzle-orm" directly. This ensures TypeScript resolves both the
// db/schema types and the query operators through the same module-resolution
// path, eliminating the dual-instance "separate declarations of 'shouldInlineParams'"
// error that occurs with moduleResolution: "bundler" + workspace packages.
export * from "drizzle-orm";
// Re-export pg-core types (e.g. AnyPgColumn, PgColumn) so consumers don't need
// to import from "drizzle-orm/pg-core" directly — which causes a second drizzle
// module instance and the same dual-resolution identity errors.
export * from "drizzle-orm/pg-core";
