import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const nameserverGroup = pgTable(
  "nameserver_group",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nameserver_group_userId_idx").on(table.userId),
    index("nameserver_group_isDefault_idx").on(table.isDefault),
  ],
);

export const nameserver = pgTable(
  "nameserver",
  {
    id: text("id").primaryKey(),
    nameserverGroupId: text("nameserver_group_id")
      .notNull()
      .references(() => nameserverGroup.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ipv4: text("ipv4"),
    ipv6: text("ipv6"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nameserver_nameserverGroupId_idx").on(table.nameserverGroupId),
    index("nameserver_name_idx").on(table.name),
  ],
);

export const tldSettings = pgTable(
  "tld_settings",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").notNull(),
    nameserverGroupId: text("nameserver_group_id").references(
      () => nameserverGroup.id,
      { onDelete: "set null" },
    ),
    marginType: text("margin_type"),
    percentageMargin: text("percentage_margin"),
    fixedMargin: text("fixed_margin"),
    roundOff: text("round_off"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("tld_settings_userId_idx").on(table.userId),
    index("tld_settings_nameserverGroupId_idx").on(table.nameserverGroupId),
    index("tld_settings_marginType_idx").on(table.marginType),
    index("tld_settings_isDefault_idx").on(table.isDefault),
  ],
);

export const tldSettingsActivityLog = pgTable(
  "tld_settings_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    tldSettingId: text("tld_setting_id")
      .notNull()
      .references(() => tldSettings.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("tld_settings_activity_userId_idx").on(table.userId),
    index("tld_settings_activity_tldSettingId_idx").on(table.tldSettingId),
    index("tld_settings_activity_action_idx").on(table.action),
    index("tld_settings_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const nameserverActivityLog = pgTable(
  "nameserver_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    nameserverId: text("nameserver_id")
      .notNull()
      .references(() => nameserver.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("nameserver_activity_userId_idx").on(table.userId),
    index("nameserver_activity_nameserverId_idx").on(table.nameserverId),
    index("nameserver_activity_action_idx").on(table.action),
    index("nameserver_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const nameserverGroupActivityLog = pgTable(
  "nameserver_group_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    nameserverGroupId: text("nameserver_group_id")
      .notNull()
      .references(() => nameserverGroup.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("nameserver_group_activity_userId_idx").on(table.userId),
    index("nameserver_group_activity_nameserverGroupId_idx").on(
      table.nameserverGroupId,
    ),
    index("nameserver_group_activity_action_idx").on(table.action),
    index("nameserver_group_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const nameserverGroupRelations = relations(
  nameserverGroup,
  ({ many }) => ({
    nameservers: many(nameserver),
    tldSettings: many(tldSettings),
    activityLogs: many(nameserverGroupActivityLog),
  }),
);

export const nameserverRelations = relations(nameserver, ({ one, many }) => ({
  nameserverGroup: one(nameserverGroup, {
    fields: [nameserver.nameserverGroupId],
    references: [nameserverGroup.id],
  }),
  activityLogs: many(nameserverActivityLog),
}));

export const tldSettingsRelations = relations(tldSettings, ({ one, many }) => ({
  nameserverGroup: one(nameserverGroup, {
    fields: [tldSettings.nameserverGroupId],
    references: [nameserverGroup.id],
  }),
  activityLogs: many(tldSettingsActivityLog),
}));

export const tldSettingsActivityLogRelations = relations(
  tldSettingsActivityLog,
  ({ one }) => ({
    tldSettings: one(tldSettings, {
      fields: [tldSettingsActivityLog.tldSettingId],
      references: [tldSettings.id],
    }),
  }),
);

export const nameserverActivityLogRelations = relations(
  nameserverActivityLog,
  ({ one }) => ({
    nameserver: one(nameserver, {
      fields: [nameserverActivityLog.nameserverId],
      references: [nameserver.id],
    }),
  }),
);

export const nameserverGroupActivityLogRelations = relations(
  nameserverGroupActivityLog,
  ({ one }) => ({
    nameserverGroup: one(nameserverGroup, {
      fields: [nameserverGroupActivityLog.nameserverGroupId],
      references: [nameserverGroup.id],
    }),
  }),
);

