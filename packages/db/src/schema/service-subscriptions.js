import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { order } from "./orders";
import { niscServicePlan, hostingSubscription } from "./hosting";
// --- ServiceSubscription -----------------------------------------------------
// Parity: previous_codebase/
export const serviceSubscription = pgTable("service_subscription", {
    id: text("_id").primaryKey(),
    niscServicePlanId: text("nisc_service_plan_id")
        .notNull()
        .references(() => niscServicePlan.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    subscribedBy: text("subscribed_by"),
    subscriptionDate: timestamp("subscription_date"),
    billingCycle: text("billing_cycle").notNull(),
    nextRenewalDate: timestamp("next_renewal_date"),
    status: text("status").notNull(),
    autoRenew: boolean("auto_renew").default(false).notNull(),
    hostingSubscriptionId: text("hosting_subscription_id")
        .unique()
        .references(() => hostingSubscription.id, { onDelete: "set null" }),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("service_subscription_niscServicePlanId_idx").on(table.niscServicePlanId),
    index("service_subscription_teamId_idx").on(table.teamId),
    index("service_subscription_orderId_idx").on(table.orderId),
    index("service_subscription_status_idx").on(table.status),
    index("service_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
    index("service_subscription_subscriptionDate_idx").on(table.subscriptionDate),
    index("service_subscription_hostingSubscriptionId_idx").on(table.hostingSubscriptionId),
]);
// --- ServiceSubscriptionRenewal ----------------------------------------------
export const serviceSubscriptionRenewal = pgTable("service_subscription_renewal", {
    id: text("_id").primaryKey(),
    serviceSubscriptionId: text("service_subscription_id")
        .notNull()
        .references(() => serviceSubscription.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    renewedBy: text("renewed_by"),
    renewalDate: timestamp("renewal_date").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    nextRenewalDate: timestamp("next_renewal_date"),
    status: text("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("service_subscription_renewal_serviceSubscriptionId_idx").on(table.serviceSubscriptionId),
    index("service_subscription_renewal_orderId_idx").on(table.orderId),
    index("service_subscription_renewal_renewalDate_idx").on(table.renewalDate),
    index("service_subscription_renewal_nextRenewalDate_idx").on(table.nextRenewalDate),
]);
// --- ServiceSubscriptionActivityLog ------------------------------------------
export const serviceSubscriptionActivityLog = pgTable("service_subscription_activity_log", {
    id: text("_id").primaryKey(),
    serviceSubscriptionId: text("service_subscription_id")
        .notNull()
        .references(() => serviceSubscription.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("service_subscription_activity_log_serviceSubscriptionId_idx").on(table.serviceSubscriptionId),
    index("service_subscription_activity_log_userId_idx").on(table.userId),
    index("service_subscription_activity_log_action_idx").on(table.action),
    index("service_subscription_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- ServiceSubscriptionRenewalActivityLog -----------------------------------
export const serviceSubscriptionRenewalActivityLog = pgTable("service_subscription_renewal_activity_log", {
    id: text("_id").primaryKey(),
    serviceSubscriptionRenewalId: text("service_subscription_renewal_id")
        .notNull()
        .references(() => serviceSubscriptionRenewal.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("service_sub_renewal_activity_log_serviceSubscriptionRenewalId_idx").on(table.serviceSubscriptionRenewalId),
    index("service_sub_renewal_activity_log_userId_idx").on(table.userId),
    index("service_sub_renewal_activity_log_action_idx").on(table.action),
    index("service_sub_renewal_activity_log_createdAt_idx").on(table.createdAt),
]);
export const serviceSubscriptionRelations = relations(serviceSubscription, ({ one, many }) => ({
    niscServicePlan: one(niscServicePlan, {
        fields: [serviceSubscription.niscServicePlanId],
        references: [niscServicePlan.id],
    }),
    team: one(team, {
        fields: [serviceSubscription.teamId],
        references: [team.id],
    }),
    order: one(order, {
        fields: [serviceSubscription.orderId],
        references: [order.id],
    }),
    // Prisma has this relation; we keep it as a relation without FK column-level constraint.
    hostingSubscription: one(hostingSubscription, {
        fields: [serviceSubscription.hostingSubscriptionId],
        references: [hostingSubscription.id],
    }),
    renewals: many(serviceSubscriptionRenewal),
    activityLogs: many(serviceSubscriptionActivityLog),
}));
export const serviceSubscriptionRenewalRelations = relations(serviceSubscriptionRenewal, ({ one, many }) => ({
    serviceSubscription: one(serviceSubscription, {
        fields: [serviceSubscriptionRenewal.serviceSubscriptionId],
        references: [serviceSubscription.id],
    }),
    order: one(order, {
        fields: [serviceSubscriptionRenewal.orderId],
        references: [order.id],
    }),
    activityLogs: many(serviceSubscriptionRenewalActivityLog),
}));
export const serviceSubscriptionActivityLogRelations = relations(serviceSubscriptionActivityLog, ({ one }) => ({
    serviceSubscription: one(serviceSubscription, {
        fields: [serviceSubscriptionActivityLog.serviceSubscriptionId],
        references: [serviceSubscription.id],
    }),
}));
export const serviceSubscriptionRenewalActivityLogRelations = relations(serviceSubscriptionRenewalActivityLog, ({ one }) => ({
    serviceSubscriptionRenewal: one(serviceSubscriptionRenewal, {
        fields: [serviceSubscriptionRenewalActivityLog.serviceSubscriptionRenewalId],
        references: [serviceSubscriptionRenewal.id],
    }),
}));
