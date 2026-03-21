import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// --- Notification ------------------------------------------------------------
// Parity: previous_codebase/

export const notification = pgTable(
  "notification",
  {
    id: text("_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, {
      onDelete: "set null",
    }),
    type: text("type").default("GENERAL").notNull(),
    priority: text("priority").default("NORMAL").notNull(),

    title: text("title"),
    message: text("message").notNull(),

    link: text("link"),
    metadata: jsonb("metadata"),

    seen: boolean("seen").default(false).notNull(),
    readAt: timestamp("read_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_teamId_idx").on(table.teamId),
    index("notification_type_idx").on(table.type),
    index("notification_seen_idx").on(table.seen),
    index("notification_priority_idx").on(table.priority),
    index("notification_createdAt_idx").on(table.createdAt),
    index("notification_userId_seen_idx").on(table.userId, table.seen),
    index("notification_teamId_seen_idx").on(table.teamId, table.seen),
  ],
);

// --- NotificationActivityLog -------------------------------------------------
// Parity: NotificationActivityLog — userId has no User relation in Prisma (no FK).

export const notificationActivityLog = pgTable(
  "notification_activity_log",
  {
    id: text("_id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notification.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("notification_activity_log_notificationId_idx").on(
      table.notificationId,
    ),
    index("notification_activity_log_userId_idx").on(table.userId),
    index("notification_activity_log_action_idx").on(table.action),
    index("notification_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

export const notificationRelations = relations(notification, ({ one, many }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [notification.teamId],
    references: [team.id],
  }),
  activityLogs: many(notificationActivityLog),
}));

export const notificationActivityLogRelations = relations(
  notificationActivityLog,
  ({ one }) => ({
    notification: one(notification, {
      fields: [notificationActivityLog.notificationId],
      references: [notification.id],
    }),
  }),
);
