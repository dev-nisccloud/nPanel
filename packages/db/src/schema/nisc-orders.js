import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
import { invoice } from "./invoicing";
import { niscClientSubscription, niscProduct, niscProductPlan, niscProductPromo, } from "./products";
// --- NiscOrder ---------------------------------------------------------------
export const niscOrder = pgTable("nisc_order", {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdBy: text("created_by"),
    status: text("status").default("PENDING").notNull(),
    subtotal: text("subtotal").notNull(),
    total: text("total").notNull(),
    currency: text("currency").default("KES").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    niscProductPromoId: text("nisc_product_promo_id").references(() => niscProductPromo.id, { onDelete: "set null" }),
    invoiceId: text("invoice_id").references(() => invoice.id, {
        onDelete: "set null",
    }),
    invoiceNumber: text("invoice_number"),
    processedAt: timestamp("processed_at"),
    completedAt: timestamp("completed_at"),
    failureReason: text("failure_reason"),
    qstashMessageId: text("qstash_message_id"),
    // `PaymentTransaction` not ported — plain id
    paymentTransactionId: text("payment_transaction_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_order_userId_idx").on(table.userId),
    index("nisc_order_teamId_idx").on(table.teamId),
    index("nisc_order_status_idx").on(table.status),
    index("nisc_order_createdAt_idx").on(table.createdAt),
    index("nisc_order_qstashMessageId_idx").on(table.qstashMessageId),
    index("nisc_order_paymentTransactionId_idx").on(table.paymentTransactionId),
]);
// --- NiscOrderProcessingLog -------------------------------------------------
export const niscOrderProcessingLog = pgTable("nisc_order_processing_log", {
    id: text("id").primaryKey(),
    niscOrderId: text("nisc_order_id")
        .notNull()
        .references(() => niscOrder.id, { onDelete: "cascade" }),
    step: text("step").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("nisc_order_processing_log_niscOrderId_idx").on(table.niscOrderId),
    index("nisc_order_processing_log_niscOrderId_createdAt_idx").on(table.niscOrderId, table.createdAt),
]);
// --- NiscOrderItem -----------------------------------------------------------
export const niscOrderItem = pgTable("nisc_order_item", {
    id: text("id").primaryKey(),
    niscOrderId: text("nisc_order_id")
        .notNull()
        .references(() => niscOrder.id, { onDelete: "cascade" }),
    productId: text("product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "restrict" }),
    productPlanId: text("product_plan_id").references(() => niscProductPlan.id, {
        onDelete: "set null",
    }),
    billingCycle: text("billing_cycle"),
    itemPrice: text("item_price").notNull(),
    itemSubtotal: text("item_subtotal").notNull(),
    itemCurrency: text("item_currency").default("KES").notNull(),
    status: text("status").default("PENDING").notNull(),
    provisioningError: text("provisioning_error"),
    provisioningErrorDetails: jsonb("provisioning_error_details"),
    niscClientSubscriptionId: text("nisc_client_subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
    primaryDomain: text("primary_domain"),
    domainSubscriptionId: text("domain_subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_order_item_niscOrderId_idx").on(table.niscOrderId),
    index("nisc_order_item_productId_idx").on(table.productId),
    index("nisc_order_item_productPlanId_idx").on(table.productPlanId),
    index("nisc_order_item_status_idx").on(table.status),
    index("nisc_order_item_niscClientSubscriptionId_idx").on(table.niscClientSubscriptionId),
]);
// --- Relations ---------------------------------------------------------------
export const niscOrderRelations = relations(niscOrder, ({ one, many }) => ({
    user: one(user, {
        fields: [niscOrder.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [niscOrder.teamId],
        references: [team.id],
    }),
    niscProductPromo: one(niscProductPromo, {
        fields: [niscOrder.niscProductPromoId],
        references: [niscProductPromo.id],
    }),
    invoice: one(invoice, {
        fields: [niscOrder.invoiceId],
        references: [invoice.id],
    }),
    orderItems: many(niscOrderItem),
    processingLogs: many(niscOrderProcessingLog),
}));
export const niscOrderProcessingLogRelations = relations(niscOrderProcessingLog, ({ one }) => ({
    niscOrder: one(niscOrder, {
        fields: [niscOrderProcessingLog.niscOrderId],
        references: [niscOrder.id],
    }),
}));
export const niscOrderItemRelations = relations(niscOrderItem, ({ one }) => ({
    niscOrder: one(niscOrder, {
        fields: [niscOrderItem.niscOrderId],
        references: [niscOrder.id],
    }),
    product: one(niscProduct, {
        fields: [niscOrderItem.productId],
        references: [niscProduct.id],
    }),
    productPlan: one(niscProductPlan, {
        fields: [niscOrderItem.productPlanId],
        references: [niscProductPlan.id],
    }),
    niscClientSubscription: one(niscClientSubscription, {
        fields: [niscOrderItem.niscClientSubscriptionId],
        references: [niscClientSubscription.id],
        relationName: "OrderItemSubscription",
    }),
    domainSubscription: one(niscClientSubscription, {
        fields: [niscOrderItem.domainSubscriptionId],
        references: [niscClientSubscription.id],
        relationName: "OrderItemDomainSubscription",
    }),
}));
