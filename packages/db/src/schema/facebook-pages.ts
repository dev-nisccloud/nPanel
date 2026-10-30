import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { customerOAuthConnection } from "./customer-oauth";

/**
 * Facebook Pages imported for Social Media Ads.
 * Separate from ad-account rows in customer_platform_asset.
 */
export const facebookPage = pgTable(
  "facebook_page",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => customerOAuthConnection.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull(),
    name: text("name").notNull(),
    username: text("username"),
    category: text("category"),
    pictureUrl: text("picture_url"),
    pageAccessToken: text("page_access_token").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("facebook_page_connection_page_unique").on(table.connectionId, table.pageId),
    index("facebook_page_userId_idx").on(table.userId),
    index("facebook_page_pageId_idx").on(table.pageId),
  ],
);

export const facebookPageRelations = relations(facebookPage, ({ one }) => ({
  connection: one(customerOAuthConnection, {
    fields: [facebookPage.connectionId],
    references: [customerOAuthConnection.id],
  }),
  user: one(user, {
    fields: [facebookPage.userId],
    references: [user.id],
  }),
}));
