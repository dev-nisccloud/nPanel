import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const ipRecords = pgTable("ip_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ipAddress: text("ip_address").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
