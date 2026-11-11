import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Durable webhook replay protection. Redis remains an optional fast path, but
 * this table is the authoritative claim and therefore fails closed.
 */
export const webhookEvent = pgTable(
	"webhook_event",
	{
		id: text("_id").primaryKey(),
		namespace: text("namespace").notNull(),
		eventId: text("event_id").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("webhook_event_namespace_eventId_uidx").on(
			table.namespace,
			table.eventId,
		),
		index("webhook_event_createdAt_idx").on(table.createdAt),
	],
);
