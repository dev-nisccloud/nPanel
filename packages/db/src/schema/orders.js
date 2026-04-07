import { relations } from "drizzle-orm";
import { boolean, doublePrecision, index, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { domain, domainRenewal, domainTransfer } from "./domains";
import { hostingRenewal, hostingSubscription, niscServicePlan } from "./hosting";
import { promo } from "./promos";
import { niscProductPromo } from "./products";
import { invoice } from "./invoicing";
// --- Order -------------------------------------------------------------------
export const order = pgTable("order", {
    id: text("_id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdBy: text("created_by"),
    type: text("type").default("CUSTOM_SERVICE").notNull(),
    status: text("status").default("PENDING").notNull(),
    description: text("description"),
    domainId: text("domain_id").references(() => domain.id, { onDelete: "set null" }),
    domainRenewalId: text("domain_renewal_id").references(() => domainRenewal.id, {
        onDelete: "set null",
    }),
    domainTransferId: text("domain_transfer_id").references(() => domainTransfer.id, {
        onDelete: "set null",
    }),
    hostingSubscriptionId: text("hosting_subscription_id").references(() => hostingSubscription.id, { onDelete: "set null" }),
    hostingRenewalId: text("hosting_renewal_id").references(() => hostingRenewal.id, { onDelete: "set null" }),
    subtotal: text("subtotal"),
    discount: text("discount"),
    isTaxable: boolean("is_taxable"),
    taxPercentage: doublePrecision("tax_percentage"),
    taxAmount: text("tax_amount"),
    total: text("total"),
    currency: text("currency").default("KES").notNull(),
    promoCode: text("promo_code"),
    promoId: text("promo_id").references(() => promo.id, { onDelete: "set null" }),
    niscProductPromoId: text("nisc_product_promo_id").references(() => niscProductPromo.id, { onDelete: "set null" }),
    invoiceNumber: text("invoice_number"),
    invoiceId: text("invoice_id").references(() => invoice.id, { onDelete: "set null" }),
    processedBy: text("processed_by"),
    processedAt: timestamp("processed_at"),
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("order_orderNumber_idx").on(table.orderNumber),
    index("order_teamId_idx").on(table.teamId),
    index("order_type_idx").on(table.type),
    index("order_status_idx").on(table.status),
    index("order_createdAt_idx").on(table.createdAt),
    index("order_processedAt_idx").on(table.processedAt),
    index("order_completedAt_idx").on(table.completedAt),
    index("order_invoiceId_idx").on(table.invoiceId),
    index("order_niscProductPromoId_idx").on(table.niscProductPromoId),
]);
// --- OrderItem ---------------------------------------------------------------
export const orderItem = pgTable("order_item", {
    id: text("_id").primaryKey(),
    orderId: text("order_id")
        .notNull()
        .references(() => order.id, { onDelete: "cascade" }),
    niscServicePlanId: text("nisc_service_plan_id")
        .notNull()
        .references(() => niscServicePlan.id, { onDelete: "restrict" }),
    billingCycle: text("billing_cycle").notNull(),
    itemPrice: text("item_price").notNull(),
    itemSubtotal: text("item_subtotal").notNull(),
    itemCurrency: text("item_currency").default("KES").notNull(),
    domainName: text("domain_name"),
    description: text("description"),
    adminDescription: text("admin_description"),
    notes: text("notes"),
    status: text("status").default("PENDING").notNull(),
    isProvisioned: boolean("is_provisioned").default(false).notNull(),
    provisioningError: text("provisioning_error"),
    hostingSubscriptionId: text("hosting_subscription_id").references(() => hostingSubscription.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("order_item_orderId_idx").on(table.orderId),
    index("order_item_niscServicePlanId_idx").on(table.niscServicePlanId),
    index("order_item_status_idx").on(table.status),
    index("order_item_isProvisioned_idx").on(table.isProvisioned),
    index("order_item_hostingSubscriptionId_idx").on(table.hostingSubscriptionId),
]);
// --- OrderItemActivityLog ----------------------------------------------------
export const orderItemActivityLog = pgTable("order_item_activity_log", {
    id: text("_id").primaryKey(),
    orderItemId: text("order_item_id")
        .notNull()
        .references(() => orderItem.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("order_item_activity_log_orderItemId_idx").on(table.orderItemId),
    index("order_item_activity_log_userId_idx").on(table.userId),
    index("order_item_activity_log_action_idx").on(table.action),
    index("order_item_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- OrderActivityLog --------------------------------------------------------
export const orderActivityLog = pgTable("order_activity_log", {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    orderId: text("order_id")
        .notNull()
        .references(() => order.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("order_activity_log_userId_idx").on(table.userId),
    index("order_activity_log_orderId_idx").on(table.orderId),
    index("order_activity_log_action_idx").on(table.action),
    index("order_activity_log_createdAt_idx").on(table.createdAt),
]);
export const orderRelations = relations(order, ({ one, many }) => ({
    team: one(team, {
        fields: [order.teamId],
        references: [team.id],
    }),
    domain: one(domain, {
        fields: [order.domainId],
        references: [domain.id],
    }),
    domainRenewal: one(domainRenewal, {
        fields: [order.domainRenewalId],
        references: [domainRenewal.id],
    }),
    domainTransfer: one(domainTransfer, {
        fields: [order.domainTransferId],
        references: [domainTransfer.id],
    }),
    hostingSubscription: one(hostingSubscription, {
        fields: [order.hostingSubscriptionId],
        references: [hostingSubscription.id],
    }),
    hostingRenewal: one(hostingRenewal, {
        fields: [order.hostingRenewalId],
        references: [hostingRenewal.id],
    }),
    promo: one(promo, {
        fields: [order.promoId],
        references: [promo.id],
    }),
    niscProductPromo: one(niscProductPromo, {
        fields: [order.niscProductPromoId],
        references: [niscProductPromo.id],
    }),
    invoice: one(invoice, {
        fields: [order.invoiceId],
        references: [invoice.id],
    }),
    orderItems: many(orderItem),
    activityLogs: many(orderActivityLog),
}));
export const orderItemRelations = relations(orderItem, ({ one, many }) => ({
    order: one(order, {
        fields: [orderItem.orderId],
        references: [order.id],
    }),
    niscServicePlan: one(niscServicePlan, {
        fields: [orderItem.niscServicePlanId],
        references: [niscServicePlan.id],
    }),
    hostingSubscription: one(hostingSubscription, {
        fields: [orderItem.hostingSubscriptionId],
        references: [hostingSubscription.id],
    }),
    activityLogs: many(orderItemActivityLog),
}));
export const orderItemActivityLogRelations = relations(orderItemActivityLog, ({ one }) => ({
    orderItem: one(orderItem, {
        fields: [orderItemActivityLog.orderItemId],
        references: [orderItem.id],
    }),
}));
export const orderActivityLogRelations = relations(orderActivityLog, ({ one }) => ({
    order: one(order, {
        fields: [orderActivityLog.orderId],
        references: [order.id],
    }),
}));
