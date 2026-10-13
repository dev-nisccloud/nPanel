import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";

import * as schema from "../schema";
import { crmPipeline, crmPipelineStage } from "../schema/crm";

export const WEBSITE_LEADS_PIPELINE_NAME = "Website Leads";

export const WEBSITE_LEADS_STAGES = [
  { name: "New", probability: 10, color: "#6B7280" },
  { name: "Contacted", probability: 25, color: "#3B82F6" },
  { name: "Qualified", probability: 50, color: "#F59E0B" },
  { name: "Proposal", probability: 75, color: "#8B5CF6" },
  { name: "Closed Won", probability: 100, color: "#10B981" },
  { name: "Closed Lost", probability: 0, color: "#EF4444" },
] as const;

type Schema = typeof schema;
type Database = NodePgDatabase<Schema>;
type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

export type WebsiteLeadsPipeline = {
  pipelineId: string;
  stageId: string;
  probability: number;
  created: boolean;
};

function newId() {
  return randomUUID();
}

export async function ensureWebsiteLeadsPipeline(
  database: Database | Transaction,
  createdById: string,
): Promise<WebsiteLeadsPipeline> {
  const [existing] = await database
    .select({ id: crmPipeline.id })
    .from(crmPipeline)
    .where(sql`lower(${crmPipeline.name}) = ${WEBSITE_LEADS_PIPELINE_NAME.toLowerCase()}`)
    .limit(1);

  let pipelineId = existing?.id;
  let created = false;

  if (!pipelineId) {
    pipelineId = newId();
    created = true;
    await database
      .update(crmPipeline)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(crmPipeline.isDefault, true));
    await database.insert(crmPipeline).values({
      id: pipelineId,
      name: WEBSITE_LEADS_PIPELINE_NAME,
      description: "Enquiries submitted from the Nisc Cloud website.",
      isDefault: true,
      isActive: true,
      displayOrder: 0,
      createdById,
    });
  }

  const stages = await database
    .select({
      id: crmPipelineStage.id,
      name: crmPipelineStage.name,
      probability: crmPipelineStage.probability,
      displayOrder: crmPipelineStage.displayOrder,
    })
    .from(crmPipelineStage)
    .where(eq(crmPipelineStage.pipelineId, pipelineId));

  for (let index = 0; index < WEBSITE_LEADS_STAGES.length; index++) {
    const definition = WEBSITE_LEADS_STAGES[index];
    if (!definition) continue;
    if (stages.some((stage) => stage.name.toLowerCase() === definition.name.toLowerCase())) {
      continue;
    }
    const id = newId();
    stages.push({
      id,
      name: definition.name,
      probability: definition.probability,
      displayOrder: index,
    });
    await database.insert(crmPipelineStage).values({
      id,
      pipelineId,
      name: definition.name,
      description: definition.name,
      probability: definition.probability,
      displayOrder: index,
      color: definition.color,
      isActive: true,
    });
  }

  const entry =
    stages.find((stage) => stage.name.toLowerCase() === "new") ??
    [...stages].sort((a, b) => a.displayOrder - b.displayOrder)[0];

  if (!entry) {
    throw new Error("Website Leads pipeline has no stages.");
  }

  return {
    pipelineId,
    stageId: entry.id,
    probability: entry.probability,
    created,
  };
}
