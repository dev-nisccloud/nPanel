import { relations } from "drizzle-orm";
import { doublePrecision, index, jsonb, integer, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { team } from "./teams";
// NOTE: We intentionally do not add relations to `user` here because the
// Prisma schema stores `createdBy`/`updatedBy` as plain strings.
export const invoice = pgTable("invoice", {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    customerId: text("customer_id"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    invoiceNumber: text("invoice_number"),
    token: text("token").notNull().unique(),
    status: text("status").default("DRAFT").notNull(),
    amount: text("amount"),
    subtotal: text("subtotal"),
    tax: text("tax"),
    taxPercentage: doublePrecision("tax_percentage"),
    vat: text("vat"),
    discount: text("discount"),
    currency: text("currency").default("KES").notNull(),
    creditedAmount: text("credited_amount"),
    creditBalance: text("credit_balance"),
    issueDate: timestamp("issue_date"),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    sentAt: timestamp("sent_at"),
    reminderSentAt: timestamp("reminder_sent_at"),
    viewedAt: timestamp("viewed_at"),
    note: text("note"),
    internalNote: text("internal_note"),
    fromDetails: jsonb("from_details"),
    customerDetails: jsonb("customer_details"),
    paymentDetails: jsonb("payment_details"),
    noteDetails: jsonb("note_details"),
    template: jsonb("template"),
    topBlock: jsonb("top_block"),
    bottomBlock: jsonb("bottom_block"),
    metadata: jsonb("metadata"),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    // Prisma: `DateTime` without @default / @updatedAt   app-managed.
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    kraInvoiceNumber: text("kra_invoice_number"),
    kraReceiptNumber: text("kra_receipt_number"),
    kraSignature: text("kra_signature"),
    kraQrCode: text("kra_qr_code"),
    kraVerifiedDate: timestamp("kra_verified_date"),
    kraStatus: text("kra_status"),
    kraError: text("kra_error"),
}, (table) => [
    uniqueIndex("invoice_teamId_invoiceNumber_unique").on(table.teamId, table.invoiceNumber),
    index("invoice_teamId_idx").on(table.teamId),
    index("invoice_status_idx").on(table.status),
    index("invoice_dueDate_idx").on(table.dueDate),
    index("invoice_sentAt_idx").on(table.sentAt),
    index("invoice_invoiceNumber_idx").on(table.invoiceNumber),
]);
export const invoiceLineItem = pgTable("invoice_line_item", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
        .notNull()
        .references(() => invoice.id, { onDelete: "cascade" }),
    position: integer("position").default(0).notNull(),
    name: text("name"),
    description: text("description"),
    quantity: doublePrecision("quantity"),
    unit: text("unit"),
    price: text("price"),
    discount: text("discount"),
    total: text("total"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("invoice_line_item_invoiceId_idx").on(table.invoiceId),
    index("invoice_line_item_position_idx").on(table.position),
]);
export const invoiceTransaction = pgTable("invoice_transaction", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
        .notNull()
        .references(() => invoice.id, { onDelete: "cascade" }),
    reference: text("reference"),
    providerReference: text("provider_reference"),
    status: text("status").default("PENDING").notNull(),
    method: text("method").notNull(),
    amount: text("amount").notNull(),
    currency: text("currency").default("KES").notNull(),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    recordedBy: text("recorded_by"),
    balanceBefore: text("balance_before"),
    balanceAfter: text("balance_after"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("invoice_transaction_invoiceId_idx").on(table.invoiceId),
    index("invoice_transaction_status_idx").on(table.status),
    index("invoice_transaction_paidAt_idx").on(table.paidAt),
]);
export const creditNote = pgTable("invoice_credit_note", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
        .notNull()
        .unique()
        .references(() => invoice.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    creditNumber: text("credit_number"),
    status: text("status").default("DRAFT").notNull(),
    amount: text("amount").notNull(),
    currency: text("currency").default("KES").notNull(),
    reason: text("reason"),
    note: text("note"),
    metadata: jsonb("metadata"),
    issuedAt: timestamp("issued_at"),
    appliedAt: timestamp("applied_at"),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("credit_note_teamId_idx").on(table.teamId),
    index("credit_note_status_idx").on(table.status),
    index("credit_note_issuedAt_idx").on(table.issuedAt),
]);
export const invoiceActivityLog = pgTable("invoice_activity_log", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
        .notNull()
        .references(() => invoice.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("invoice_activity_log_invoiceId_idx").on(table.invoiceId),
    index("invoice_activity_log_userId_idx").on(table.userId),
    index("invoice_activity_log_action_idx").on(table.action),
    index("invoice_activity_log_createdAt_idx").on(table.createdAt),
]);
export const invoiceTransactionActivityLog = pgTable("invoice_transaction_activity_log", {
    id: text("id").primaryKey(),
    invoiceTransactionId: text("invoice_transaction_id")
        .notNull()
        .references(() => invoiceTransaction.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("invoice_transaction_activity_log_invoiceTransactionId_idx").on(table.invoiceTransactionId),
    index("invoice_transaction_activity_log_userId_idx").on(table.userId),
    index("invoice_transaction_activity_log_action_idx").on(table.action),
    index("invoice_transaction_activity_log_createdAt_idx").on(table.createdAt),
]);
export const creditNoteActivityLog = pgTable("invoice_credit_note_activity_log", {
    id: text("id").primaryKey(),
    creditNoteId: text("credit_note_id")
        .notNull()
        .references(() => creditNote.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("credit_note_activity_log_creditNoteId_idx").on(table.creditNoteId),
    index("credit_note_activity_log_userId_idx").on(table.userId),
    index("credit_note_activity_log_action_idx").on(table.action),
    index("credit_note_activity_log_createdAt_idx").on(table.createdAt),
]);
export const invoiceCounter = pgTable("invoice_counter", {
    id: text("id").primaryKey().default("invoice-counter"),
    lastNumber: integer("last_number").default(0).notNull(),
    // Prisma: `@updatedAt` only   auto-maintained on writes.
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull()
        .$onUpdate(() => /* @__PURE__ */ new Date()),
}, () => []);
export const invoiceRelations = relations(invoice, ({ one, many }) => ({
    team: one(team, {
        fields: [invoice.teamId],
        references: [team.id],
    }),
    lineItems: many(invoiceLineItem),
    transactions: many(invoiceTransaction),
    // Prisma: `creditNote CreditNote?`   FK + unique on `credit_note.invoice_id`
    creditNote: one(creditNote, {
        fields: [invoice.id],
        references: [creditNote.invoiceId],
    }),
    activityLogs: many(invoiceActivityLog),
}));
export const invoiceLineItemRelations = relations(invoiceLineItem, ({ one }) => ({
    invoice: one(invoice, {
        fields: [invoiceLineItem.invoiceId],
        references: [invoice.id],
    }),
}));
export const invoiceTransactionRelations = relations(invoiceTransaction, ({ one, many }) => ({
    invoice: one(invoice, {
        fields: [invoiceTransaction.invoiceId],
        references: [invoice.id],
    }),
    activityLogs: many(invoiceTransactionActivityLog),
}));
export const creditNoteRelations = relations(creditNote, ({ one, many }) => ({
    invoice: one(invoice, {
        fields: [creditNote.invoiceId],
        references: [invoice.id],
    }),
    team: one(team, {
        fields: [creditNote.teamId],
        references: [team.id],
    }),
    activityLogs: many(creditNoteActivityLog),
}));
export const invoiceActivityLogRelations = relations(invoiceActivityLog, ({ one }) => ({
    invoice: one(invoice, {
        fields: [invoiceActivityLog.invoiceId],
        references: [invoice.id],
    }),
}));
export const invoiceTransactionActivityLogRelations = relations(invoiceTransactionActivityLog, ({ one }) => ({
    invoiceTransaction: one(invoiceTransaction, {
        fields: [invoiceTransactionActivityLog.invoiceTransactionId],
        references: [invoiceTransaction.id],
    }),
}));
export const creditNoteActivityLogRelations = relations(creditNoteActivityLog, ({ one }) => ({
    creditNote: one(creditNote, {
        fields: [creditNoteActivityLog.creditNoteId],
        references: [creditNote.id],
    }),
}));
