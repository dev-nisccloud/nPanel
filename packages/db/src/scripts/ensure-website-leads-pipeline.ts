import { resolve } from "node:path";
import dotenv from "dotenv";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { ensureWebsiteLeadsPipeline } from "../crm/website-leads";
import { user } from "../schema/auth";
import * as schema from "../schema";

const envPath =
  process.env.DOTENV_PATH ?? resolve(import.meta.dir, "../../../../apps/server/.env.staging");
dotenv.config({ path: envPath, override: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const database = drizzle(pool, { schema });

try {
  const agencyUsers = await database
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(inArray(user.role, ["AGENCY_SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_USER"]));

  const owner =
    agencyUsers.find((row) => row.role === "AGENCY_SUPER_ADMIN") ??
    agencyUsers.find((row) => row.role === "AGENCY_ADMIN") ??
    agencyUsers[0];

  if (!owner) {
    console.error("No agency user found. Sign in as an agency user before creating the pipeline.");
    process.exitCode = 1;
  } else {
    const pipeline = await ensureWebsiteLeadsPipeline(database, owner.id);
    console.log(
      pipeline.created
        ? `Created Website Leads pipeline ${pipeline.pipelineId}`
        : `Website Leads pipeline already exists ${pipeline.pipelineId}`,
    );
  }
} finally {
  await pool.end();
}
