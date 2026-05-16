import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// --- Quotation ---------------------------------------------------------------
// Parity: previous_codebase/

export const quotation = pgTable(
  "quotation",
  {
    id: text("_id").primaryKey(),
    quotationNumber: text("quotation_number"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    token: text("token").notNull().unique(),
    status: text("status").default("DRAFT").notNull(),
    amount: text("amount"),
    subtotal: text("subtotal"),
    tax: text("tax"),
    taxPercentage: doublePrecision("tax_percentage"),
    vat: text("vat"),
    discount: text("discount"),
    currency: text("currency").default("KES").notNull(),
    issueDate: timestamp("issue_date"),
    note: text("note"),
    internalNote: text("internal_note"),
    fromDetails: jsonb("from_details"),
    customerDetails: jsonb("customer_details"),
    noteDetails: jsonb("note_details"),
    template: jsonb("template"),
    topBlock: jsonb("top_block"),
    bottomBlock: jsonb("bottom_block"),
    metadata: jsonb("metadata"),
    linkedUserId: text("linked_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("quotation_quotationNumber_idx").on(table.quotationNumber),
    index("quotation_status_idx").on(table.status),
    index("quotation_createdBy_idx").on(table.createdBy),
    index("quotation_issueDate_idx").on(table.issueDate),
  ],
);

// --- QuotationLineItem -------------------------------------------------------

export const quotationLineItem = pgTable(
  "quotation_line_item",
  {
    id: text("_id").primaryKey(),
    quotationId: text("quotation_id")
      .notNull()
      .references(() => quotation.id, { onDelete: "cascade" }),
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
  },
  (table) => [
    index("quotation_line_item_quotationId_idx").on(table.quotationId),
    index("quotation_line_item_position_idx").on(table.position),
  ],
);

// --- QuotationActivityLog ----------------------------------------------------

export const quotationActivityLog = pgTable(
  "quotation_activity_log",
  {
    id: text("_id").primaryKey(),
    quotationId: text("quotation_id")
      .notNull()
      .references(() => quotation.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("quotation_activity_log_quotationId_idx").on(table.quotationId),
    index("quotation_activity_log_userId_idx").on(table.userId),
    index("quotation_activity_log_action_idx").on(table.action),
    index("quotation_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- QuotationCounter --------------------------------------------------------

export const quotationCounter = pgTable("quotation_counter", {
  id: text("id").primaryKey().default("quotation-counter"),
  lastNumber: integer("last_number").default(0).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const quotationRelations = relations(quotation, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [quotation.createdBy],
    references: [user.id],
  }),
  lineItems: many(quotationLineItem),
  activityLogs: many(quotationActivityLog),
}));

export const quotationLineItemRelations = relations(quotationLineItem, ({ one }) => ({
  quotation: one(quotation, {
    fields: [quotationLineItem.quotationId],
    references: [quotation.id],
  }),
}));

export const quotationActivityLogRelations = relations(
  quotationActivityLog,
  ({ one }) => ({
    quotation: one(quotation, {
      fields: [quotationActivityLog.quotationId],
      references: [quotation.id],
    }),
  }),
);

