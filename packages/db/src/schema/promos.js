import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { hostingPlan } from "./hosting";
export const promo = pgTable("promo", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    scope: text("scope").notNull(),
    target: text("target").notNull(),
    discountValue: text("discount_value").notNull(),
    currency: text("currency").default("KES"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").default(0).notNull(),
    minOrderValue: text("min_order_value"),
    hostingPlanId: text("hosting_plan_id").references(() => hostingPlan.id, {
        onDelete: "set null",
    }),
    userId: text("user_id"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("promo_code_idx").on(table.code),
    index("promo_target_idx").on(table.target),
    index("promo_scope_idx").on(table.scope),
    index("promo_isActive_idx").on(table.isActive),
    index("promo_startDate_idx").on(table.startDate),
    index("promo_endDate_idx").on(table.endDate),
    index("promo_hostingPlanId_idx").on(table.hostingPlanId),
    index("promo_userId_idx").on(table.userId),
]);
export const promoActivityLog = pgTable("promo_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    promoId: text("promo_id")
        .notNull()
        .references(() => promo.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("promo_activity_log_userId_idx").on(table.userId),
    index("promo_activity_log_promoId_idx").on(table.promoId),
    index("promo_activity_log_action_idx").on(table.action),
    index("promo_activity_log_createdAt_idx").on(table.createdAt),
]);
export const promoRelations = relations(promo, ({ one, many }) => ({
    hostingPlan: one(hostingPlan, { fields: [promo.hostingPlanId], references: [hostingPlan.id] }),
    team: one(team, { fields: [promo.teamId], references: [team.id] }),
    activityLogs: many(promoActivityLog),
}));
export const promoActivityLogRelations = relations(promoActivityLog, ({ one }) => ({
    promo: one(promo, { fields: [promoActivityLog.promoId], references: [promo.id] }),
}));
