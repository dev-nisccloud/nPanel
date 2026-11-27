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

/**
 * Client-facing service order documents issued from HQ Sales.
 * Separate from fulfilment orders in nisc-orders.
 */
export const salesServiceOrder = pgTable(
	"sales_service_order",
	{
		id: text("_id").primaryKey(),
		orderNumber: text("order_number"),
		customerName: text("customer_name"),
		customerEmail: text("customer_email"),
		billingEmail: text("billing_email"),
		phone: text("phone"),
		contactPerson: text("contact_person"),
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
		validUntil: timestamp("valid_until"),
		paymentTerms: text("payment_terms"),
		preparedBy: text("prepared_by"),
		note: text("note"),
		fromDetails: jsonb("from_details"),
		customerDetails: jsonb("customer_details"),
		authorization: jsonb("authorization"),
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
		index("sales_service_order_orderNumber_idx").on(table.orderNumber),
		index("sales_service_order_status_idx").on(table.status),
		index("sales_service_order_createdBy_idx").on(table.createdBy),
		index("sales_service_order_issueDate_idx").on(table.issueDate),
		index("sales_service_order_customerEmail_idx").on(table.customerEmail),
	],
);

export const salesServiceOrderLineItem = pgTable(
	"sales_service_order_line_item",
	{
		id: text("_id").primaryKey(),
		serviceOrderId: text("service_order_id")
			.notNull()
			.references(() => salesServiceOrder.id, { onDelete: "cascade" }),
		position: integer("position").default(0).notNull(),
		category: text("category"),
		name: text("name"),
		primaryDomain: text("primary_domain"),
		quantity: doublePrecision("quantity"),
		billingCycle: text("billing_cycle"),
		price: text("price"),
		total: text("total"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").notNull(),
		updatedAt: timestamp("updated_at").notNull(),
	},
	(table) => [
		index("sales_service_order_line_item_serviceOrderId_idx").on(table.serviceOrderId),
		index("sales_service_order_line_item_position_idx").on(table.position),
	],
);

export const salesServiceOrderActivityLog = pgTable(
	"sales_service_order_activity_log",
	{
		id: text("_id").primaryKey(),
		serviceOrderId: text("service_order_id")
			.notNull()
			.references(() => salesServiceOrder.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		action: text("action").notNull(),
		description: text("description"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => [
		index("sales_service_order_activity_log_serviceOrderId_idx").on(table.serviceOrderId),
		index("sales_service_order_activity_log_createdAt_idx").on(table.createdAt),
	],
);

export const salesServiceOrderCounter = pgTable("sales_service_order_counter", {
	id: text("id").primaryKey().default("sales-service-order-counter"),
	lastNumber: integer("last_number").default(0).notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const salesServiceOrderRelations = relations(salesServiceOrder, ({ one, many }) => ({
	createdByUser: one(user, {
		fields: [salesServiceOrder.createdBy],
		references: [user.id],
	}),
	lineItems: many(salesServiceOrderLineItem),
	activityLogs: many(salesServiceOrderActivityLog),
}));

export const salesServiceOrderLineItemRelations = relations(
	salesServiceOrderLineItem,
	({ one }) => ({
		serviceOrder: one(salesServiceOrder, {
			fields: [salesServiceOrderLineItem.serviceOrderId],
			references: [salesServiceOrder.id],
		}),
	}),
);

export const salesServiceOrderActivityLogRelations = relations(
	salesServiceOrderActivityLog,
	({ one }) => ({
		serviceOrder: one(salesServiceOrder, {
			fields: [salesServiceOrderActivityLog.serviceOrderId],
			references: [salesServiceOrder.id],
		}),
	}),
);
