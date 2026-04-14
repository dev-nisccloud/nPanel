import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const hivelocityPricingSettings = pgTable(
  "hivelocity_pricing_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** One of: DEDICATED_SERVERS, VPS, VDS */
    productType: text("product_type").notNull(),

    marginType: text("margin_type"), // PERCENTAGE | FIXED
    percentageMargin: text("percentage_margin"),
    fixedMargin: text("fixed_margin"),
    roundOff: text("round_off"),

    /**
     * OS (Operating System) markup: applied to OS license monthly price (USD) before conversion.
     * Stored separately so OS licensing can have different margin than base plan.
     */
    osMarginType: text("os_margin_type"), // PERCENTAGE | FIXED
    osPercentageMargin: text("os_percentage_margin"),
    osFixedMargin: text("os_fixed_margin"),
    osRoundOff: text("os_round_off"),

    /**
     * Add-ons markup: applied to each add-on monthly price (USD) before conversion.
     * Stored separately so add-ons can have different margin than base plan.
     */
    addonsMarginType: text("addons_margin_type"), // PERCENTAGE | FIXED
    addonsPercentageMargin: text("addons_percentage_margin"),
    addonsFixedMargin: text("addons_fixed_margin"),
    addonsRoundOff: text("addons_round_off"),

    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("hivelocity_pricing_settings_userId_idx").on(table.userId),
    index("hivelocity_pricing_settings_productType_idx").on(table.productType),
    index("hivelocity_pricing_settings_isDefault_idx").on(table.isDefault),
  ],
);

export const hivelocityPricingSettingsActivityLog = pgTable(
  "hivelocity_pricing_settings_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    hivelocityPricingSettingsId: text("hivelocity_pricing_settings_id")
      .notNull()
      .references(() => hivelocityPricingSettings.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("hivelocity_pricing_settings_activity_userId_idx").on(table.userId),
    index("hivelocity_pricing_settings_activity_settingsId_idx").on(table.hivelocityPricingSettingsId),
    index("hivelocity_pricing_settings_activity_action_idx").on(table.action),
    index("hivelocity_pricing_settings_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const hivelocityPricingSettingsRelations = relations(hivelocityPricingSettings, ({ one, many }) => ({
  user: one(user, { fields: [hivelocityPricingSettings.userId], references: [user.id] }),
  activityLogs: many(hivelocityPricingSettingsActivityLog),
}));

export const hivelocityPricingSettingsActivityLogRelations = relations(
  hivelocityPricingSettingsActivityLog,
  ({ one }) => ({
    settings: one(hivelocityPricingSettings, {
      fields: [hivelocityPricingSettingsActivityLog.hivelocityPricingSettingsId],
      references: [hivelocityPricingSettings.id],
    }),
  }),
);

