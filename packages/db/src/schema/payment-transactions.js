import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { team } from "./teams";
// --- PaymentTransaction ------------------------------------------------------
// Parity: previous_codebase/
export const paymentTransaction = pgTable("payment_transaction", {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    gateway: text("gateway").notNull(),
    gatewayStatus: text("gateway_status"),
    gatewayMessage: text("gateway_message"),
    gatewayTransactionId: text("gateway_transaction_id"),
    merchantRequestId: text("merchant_request_id"),
    checkoutRequestId: text("checkout_request_id"),
    receiptNumber: text("receipt_number"),
    amount: text("amount").notNull(),
    paidAmount: text("paid_amount"),
    currency: text("currency").default("KES").notNull(),
    accountReference: text("account_reference"),
    transactionDesc: text("transaction_desc"),
    phoneNumber: text("phone_number"),
    status: text("status").default("PENDING").notNull(),
    rawResponse: jsonb("raw_response"),
    rawError: jsonb("raw_error"),
    initiatedAt: timestamp("initiated_at").notNull(),
    processedAt: timestamp("processed_at"),
    failedAt: timestamp("failed_at"),
    refundedAt: timestamp("refunded_at"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("payment_transaction_userId_idx").on(table.userId),
    index("payment_transaction_teamId_idx").on(table.teamId),
    index("payment_transaction_gateway_idx").on(table.gateway),
    index("payment_transaction_status_idx").on(table.status),
    index("payment_transaction_gatewayTransactionId_idx").on(table.gatewayTransactionId),
    index("payment_transaction_checkoutRequestId_idx").on(table.checkoutRequestId),
    index("payment_transaction_merchantRequestId_idx").on(table.merchantRequestId),
    index("payment_transaction_receiptNumber_idx").on(table.receiptNumber),
    index("payment_transaction_accountReference_idx").on(table.accountReference),
    index("payment_transaction_initiatedAt_idx").on(table.initiatedAt),
    index("payment_transaction_processedAt_idx").on(table.processedAt),
    index("payment_transaction_createdAt_idx").on(table.createdAt),
]);
// --- PaymentTransactionActivityLog ------------------------------------------
export const paymentTransactionActivityLog = pgTable("payment_transaction_activity_log", {
    id: text("_id").primaryKey(),
    transactionId: text("transaction_id")
        .notNull()
        .references(() => paymentTransaction.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("payment_transaction_activity_log_transactionId_idx").on(table.transactionId),
    index("payment_transaction_activity_log_userId_idx").on(table.userId),
    index("payment_transaction_activity_log_action_idx").on(table.action),
    index("payment_transaction_activity_log_createdAt_idx").on(table.createdAt),
]);
export const paymentTransactionRelations = relations(paymentTransaction, ({ one, many }) => ({
    team: one(team, {
        fields: [paymentTransaction.teamId],
        references: [team.id],
    }),
    activityLogs: many(paymentTransactionActivityLog),
}));
export const paymentTransactionActivityLogRelations = relations(paymentTransactionActivityLog, ({ one }) => ({
    transaction: one(paymentTransaction, {
        fields: [paymentTransactionActivityLog.transactionId],
        references: [paymentTransaction.id],
    }),
}));
