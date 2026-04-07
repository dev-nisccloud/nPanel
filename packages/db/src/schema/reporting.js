import { decimal, index, integer, pgTable, real, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
// --- SalesReportSnapshot -----------------------------------------------------
// Parity: previous_codebase/
export const salesReportSnapshot = pgTable("sales_report_snapshot", {
    id: text("id").primaryKey(),
    date: timestamp("date").notNull(),
    period: text("period").notNull(),
    totalRevenue: decimal("total_revenue", { precision: 20, scale: 2 }).default("0").notNull(),
    totalInvoiced: decimal("total_invoiced", { precision: 20, scale: 2 }).default("0").notNull(),
    totalPaid: decimal("total_paid", { precision: 20, scale: 2 }).default("0").notNull(),
    taxableAmount: decimal("taxable_amount", { precision: 20, scale: 2 }).default("0").notNull(),
    taxAmount: decimal("tax_amount", { precision: 20, scale: 2 }).default("0").notNull(),
    pendingAmount: decimal("pending_amount", { precision: 20, scale: 2 }).default("0").notNull(),
    invoiceCount: integer("invoice_count").default(0).notNull(),
    paidInvoiceCount: integer("paid_invoice_count").default(0).notNull(),
    currency: text("currency").default("KES").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("sales_report_snapshot_date_period_currency_unique").on(table.date, table.period, table.currency),
    index("sales_report_snapshot_date_period_idx").on(table.date, table.period),
]);
// --- RevenueByServiceSnapshot ------------------------------------------------
export const revenueByServiceSnapshot = pgTable("revenue_by_service_snapshot", {
    id: text("id").primaryKey(),
    date: timestamp("date").notNull(),
    period: text("period").notNull(),
    serviceType: text("service_type").notNull(),
    amount: decimal("amount", { precision: 20, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("KES").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("revenue_by_service_snapshot_date_period_serviceType_currency_unique").on(table.date, table.period, table.serviceType, table.currency),
    index("revenue_by_service_snapshot_date_period_serviceType_idx").on(table.date, table.period, table.serviceType),
]);
// --- RevenueByTeamSnapshot ---------------------------------------------------
export const revenueByTeamSnapshot = pgTable("revenue_by_team_snapshot", {
    id: text("id").primaryKey(),
    date: timestamp("date").notNull(),
    period: text("period").notNull(),
    teamId: text("team_id").notNull(),
    teamName: text("team_name").notNull(),
    amount: decimal("amount", { precision: 20, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("KES").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("revenue_by_team_snapshot_date_period_teamId_currency_unique").on(table.date, table.period, table.teamId, table.currency),
    index("revenue_by_team_snapshot_date_period_idx").on(table.date, table.period),
]);
// --- CreativeProductionSnapshot ----------------------------------------------
export const creativeProductionSnapshot = pgTable("creative_production_snapshot", {
    id: text("id").primaryKey(),
    date: timestamp("date").notNull(),
    period: text("period").notNull(),
    assetsCreated: integer("assets_created").default(0).notNull(),
    assetsApproved: integer("assets_approved").default(0).notNull(),
    versionsCreated: integer("versions_created").default(0).notNull(),
    avgVelocityDays: real("avg_velocity_days"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("creative_production_snapshot_date_period_unique").on(table.date, table.period),
    index("creative_production_snapshot_date_period_idx").on(table.date, table.period),
]);
