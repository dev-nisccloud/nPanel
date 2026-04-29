import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { invoice } from "./invoicing";
import { team } from "./teams";
/** Saved node-editor workflow run; scoped by creator (user). Optional team for rare team-scoped runs. */
export const cronWorkflowRun = pgTable("cron_workflow_run", {
    id: text("id").primaryKey(),
    jobKey: text("job_key").notNull(),
    name: text("name").notNull(),
    /** running | paused | completed | failed | cancelled */
    status: text("status").notNull().default("running"),
    graphStateJson: jsonb("graph_state_json").$type(),
    version: integer("version").notNull().default(1),
    lastError: text("last_error"),
    createdById: text("created_by_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("cron_workflow_run_jobKey_idx").on(table.jobKey),
    index("cron_workflow_run_createdById_idx").on(table.createdById),
    index("cron_workflow_run_teamId_idx").on(table.teamId),
    index("cron_workflow_run_status_idx").on(table.status),
    index("cron_workflow_run_createdAt_idx").on(table.createdAt),
]);
/** Point-in-time payload when an edge first appears in the graph. */
export const cronWorkflowEdgeSnapshot = pgTable("cron_workflow_edge_snapshot", {
    id: text("id").primaryKey(),
    runId: text("run_id")
        .notNull()
        .references(() => cronWorkflowRun.id, { onDelete: "cascade" }),
    edgeId: text("edge_id").notNull(),
    sourceNodeId: text("source_node_id").notNull(),
    targetNodeId: text("target_node_id").notNull(),
    payloadJson: jsonb("payload_json").notNull().$type(),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
}, (table) => [
    uniqueIndex("cron_workflow_edge_snapshot_run_edge_unique").on(table.runId, table.edgeId),
    index("cron_workflow_edge_snapshot_runId_idx").on(table.runId),
]);
/** Links a workflow run to invoices created from the flow (e.g. per ad platform). */
export const cronWorkflowRunInvoice = pgTable("cron_workflow_run_invoice", {
    id: text("id").primaryKey(),
    runId: text("run_id")
        .notNull()
        .references(() => cronWorkflowRun.id, { onDelete: "cascade" }),
    /** meta | google | linkedin */
    platform: text("platform").notNull(),
    invoiceId: text("invoice_id")
        .notNull()
        .references(() => invoice.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    uniqueIndex("cron_workflow_run_invoice_run_platform_unique").on(table.runId, table.platform),
    index("cron_workflow_run_invoice_runId_idx").on(table.runId),
    index("cron_workflow_run_invoice_invoiceId_idx").on(table.invoiceId),
]);
export const cronWorkflowRunRelations = relations(cronWorkflowRun, ({ many, one }) => ({
    createdBy: one(user, {
        fields: [cronWorkflowRun.createdById],
        references: [user.id],
    }),
    team: one(team, {
        fields: [cronWorkflowRun.teamId],
        references: [team.id],
    }),
    edgeSnapshots: many(cronWorkflowEdgeSnapshot),
    invoices: many(cronWorkflowRunInvoice),
}));
export const cronWorkflowEdgeSnapshotRelations = relations(cronWorkflowEdgeSnapshot, ({ one }) => ({
    run: one(cronWorkflowRun, {
        fields: [cronWorkflowEdgeSnapshot.runId],
        references: [cronWorkflowRun.id],
    }),
}));
export const cronWorkflowRunInvoiceRelations = relations(cronWorkflowRunInvoice, ({ one }) => ({
    run: one(cronWorkflowRun, {
        fields: [cronWorkflowRunInvoice.runId],
        references: [cronWorkflowRun.id],
    }),
    invoice: one(invoice, {
        fields: [cronWorkflowRunInvoice.invoiceId],
        references: [invoice.id],
    }),
}));
