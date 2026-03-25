import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { team } from "./teams";
import { customerIntegration } from "./auth-extras";
import { domain } from "./domains";

export const hostingPlan = pgTable(
  "hosting_plan",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    hostingType: text("hosting_type").notNull(),

    pleskServicePlanId: text("plesk_service_plan_id"),
    pleskFilterId: text("plesk_filter_id"),
    pleskIpAddress: text("plesk_ip_address"),

    features: jsonb("features").notNull(),
    highlights: jsonb("highlights").notNull(),
    isPopular: boolean("is_popular").default(false).notNull(),
    isRecommended: boolean("is_recommended").default(false).notNull(),

    niscPrice: text("nisc_price"),
    niscCurrency: text("nisc_currency").default("KES"),

    billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
    setupFee: text("setup_fee"),

    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("hosting_plan_hostingType_idx").on(table.hostingType),
    index("hosting_plan_isActive_idx").on(table.isActive),
  ],
);

export const niscServicePlan = pgTable(
  "nisc_service_plan",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    planType: text("plan_type").notNull(),
    hostingSubType: text("hosting_sub_type"),

    pleskServicePlanId: text("plesk_service_plan_id"),
    pleskFilterId: text("plesk_filter_id"),
    pleskIpAddress: text("plesk_ip_address"),

    features: jsonb("features").notNull(),
    highlights: jsonb("highlights").notNull(),
    isPopular: boolean("is_popular").default(false).notNull(),
    isRecommended: boolean("is_recommended").default(false).notNull(),

    niscPrice: text("nisc_price"),
    niscCurrency: text("nisc_currency").default("KES"),

    billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
    setupFee: text("setup_fee"),

    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nisc_service_plan_planType_idx").on(table.planType),
    index("nisc_service_plan_hostingSubType_idx").on(table.hostingSubType),
    index("nisc_service_plan_isActive_idx").on(table.isActive),
    index("nisc_service_plan_isDefault_idx").on(table.isDefault),
  ],
);

export const niscServicePlanActivityLog = pgTable(
  "nisc_service_plan_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    niscServicePlanId: text("nisc_service_plan_id")
      .notNull()
      .references(() => niscServicePlan.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("nisc_service_plan_activity_userId_idx").on(table.userId),
    index("nisc_service_plan_activity_niscServicePlanId_idx").on(
      table.niscServicePlanId,
    ),
    index("nisc_service_plan_activity_action_idx").on(table.action),
    index("nisc_service_plan_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const hostingSubscription = pgTable(
  "hosting_subscription",
  {
    id: text("id").primaryKey(),
    hostingPlanId: text("hosting_plan_id")
      .notNull()
      .references(() => hostingPlan.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    provisionedBy: text("provisioned_by"),

    pleskFilterId: text("plesk_filter_id").notNull().unique(),
    pleskOwnerId: text("plesk_owner_id"),
    pleskServiceId: text("plesk_service_id"),

    pleskName: text("plesk_name"),
    pleskStatus: integer("plesk_status"),
    pleskDescription: text("plesk_description"),
    pleskAdminDescription: text("plesk_admin_description"),

    pleskFtpLogin: text("plesk_ftp_login"),
    pleskFtpPassword: text("plesk_ftp_password"),

    primaryDomain: text("primary_domain"),
    domainId: text("domain_id").references(() => domain.id, { onDelete: "set null" }),

    operation: text("operation").default("PROVISION").notNull(),
    provisioningMethod: text("provisioning_method").default("AUTOMATIC").notNull(),
    status: text("status").default("PENDING").notNull(),
    hostingType: text("hosting_type").notNull(),

    billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
    nextRenewalDate: timestamp("next_renewal_date"),
    expiryDate: timestamp("expiry_date"),

    niscPrice: text("nisc_price"),
    niscCurrency: text("nisc_currency").default("KES"),

    invoiceNumber: text("invoice_number"),

    customerIntegrationId: text("customer_integration_id").references(
      () => customerIntegration.id,
      { onDelete: "set null" },
    ),

    notes: text("notes"),
    autoRenew: boolean("auto_renew").default(true).notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("hosting_subscription_hostingPlanId_idx").on(table.hostingPlanId),
    index("hosting_subscription_teamId_idx").on(table.teamId),
    index("hosting_subscription_pleskFilterId_idx").on(table.pleskFilterId),
    index("hosting_subscription_status_idx").on(table.status),
    index("hosting_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
    index("hosting_subscription_expiryDate_idx").on(table.expiryDate),
    index("hosting_subscription_primaryDomain_idx").on(table.primaryDomain),
  ],
);

export const hostingRenewal = pgTable(
  "hosting_renewal",
  {
    id: text("id").primaryKey(),
    hostingSubscriptionId: text("hosting_subscription_id")
      .notNull()
      .references(() => hostingSubscription.id, { onDelete: "cascade" }),
    renewedBy: text("renewed_by"),
    renewalDate: timestamp("renewal_date").notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    status: text("status").default("ACTIVE").notNull(),
    niscPrice: text("nisc_price"),
    niscCurrency: text("nisc_currency").default("KES"),
    invoiceNumber: text("invoice_number"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("hosting_renewal_hostingSubscriptionId_idx").on(table.hostingSubscriptionId),
    index("hosting_renewal_renewalDate_idx").on(table.renewalDate),
    index("hosting_renewal_expiryDate_idx").on(table.expiryDate),
    index("hosting_renewal_renewedBy_idx").on(table.renewedBy),
  ],
);

export const hostingPlanActivityLog = pgTable(
  "hosting_plan_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    hostingPlanId: text("hosting_plan_id")
      .notNull()
      .references(() => hostingPlan.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("hosting_plan_activity_userId_idx").on(table.userId),
    index("hosting_plan_activity_hostingPlanId_idx").on(table.hostingPlanId),
    index("hosting_plan_activity_action_idx").on(table.action),
    index("hosting_plan_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const hostingSubscriptionActivityLog = pgTable(
  "hosting_subscription_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    hostingSubscriptionId: text("hosting_subscription_id")
      .notNull()
      .references(() => hostingSubscription.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("hosting_subscription_activity_userId_idx").on(table.userId),
    index("hosting_subscription_activity_hostingSubscriptionId_idx").on(
      table.hostingSubscriptionId,
    ),
    index("hosting_subscription_activity_action_idx").on(table.action),
    index("hosting_subscription_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const hostingRenewalActivityLog = pgTable(
  "hosting_renewal_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    hostingRenewalId: text("hosting_renewal_id")
      .notNull()
      .references(() => hostingRenewal.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("hosting_renewal_activity_userId_idx").on(table.userId),
    index("hosting_renewal_activity_hostingRenewalId_idx").on(table.hostingRenewalId),
    index("hosting_renewal_activity_action_idx").on(table.action),
    index("hosting_renewal_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const wordPressInstance = pgTable(
  "wordpress_instance",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    hostingSubscriptionId: text("hosting_subscription_id").references(
      () => hostingSubscription.id,
      { onDelete: "set null" },
    ),
    installationId: integer("installation_id").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("wordpress_instance_teamId_idx").on(table.teamId),
    index("wordpress_instance_installationId_idx").on(table.installationId),
  ],
);

export const wordPressInstanceActivityLog = pgTable(
  "wordpress_instance_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    wordpressInstanceId: text("wordpress_instance_id")
      .notNull()
      .references(() => wordPressInstance.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("wordpress_instance_activity_userId_idx").on(table.userId),
    index("wordpress_instance_activity_wordpressInstanceId_idx").on(
      table.wordpressInstanceId,
    ),
    index("wordpress_instance_activity_action_idx").on(table.action),
    index("wordpress_instance_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const hostingPlanRelations = relations(hostingPlan, ({ many }) => ({
  subscriptions: many(hostingSubscription),
  activityLogs: many(hostingPlanActivityLog),
}));

export const niscServicePlanRelations = relations(niscServicePlan, ({ many }) => ({
  activityLogs: many(niscServicePlanActivityLog),
}));

export const niscServicePlanActivityLogRelations = relations(
  niscServicePlanActivityLog,
  ({ one }) => ({
    niscServicePlan: one(niscServicePlan, {
      fields: [niscServicePlanActivityLog.niscServicePlanId],
      references: [niscServicePlan.id],
    }),
  }),
);

export const hostingSubscriptionRelations = relations(
  hostingSubscription,
  ({ one, many }) => ({
    hostingPlan: one(hostingPlan, {
      fields: [hostingSubscription.hostingPlanId],
      references: [hostingPlan.id],
    }),
    team: one(team, {
      fields: [hostingSubscription.teamId],
      references: [team.id],
    }),
    domain: one(domain, {
      fields: [hostingSubscription.domainId],
      references: [domain.id],
    }),
    customerIntegration: one(customerIntegration, {
      fields: [hostingSubscription.customerIntegrationId],
      references: [customerIntegration.id],
    }),
    renewals: many(hostingRenewal),
    wordpressInstances: many(wordPressInstance),
    activityLogs: many(hostingSubscriptionActivityLog),
  }),
);

export const hostingRenewalRelations = relations(hostingRenewal, ({ one, many }) => ({
  hostingSubscription: one(hostingSubscription, {
    fields: [hostingRenewal.hostingSubscriptionId],
    references: [hostingSubscription.id],
  }),
  activityLogs: many(hostingRenewalActivityLog),
}));

export const hostingPlanActivityLogRelations = relations(
  hostingPlanActivityLog,
  ({ one }) => ({
    hostingPlan: one(hostingPlan, {
      fields: [hostingPlanActivityLog.hostingPlanId],
      references: [hostingPlan.id],
    }),
  }),
);

export const hostingSubscriptionActivityLogRelations = relations(
  hostingSubscriptionActivityLog,
  ({ one }) => ({
    hostingSubscription: one(hostingSubscription, {
      fields: [hostingSubscriptionActivityLog.hostingSubscriptionId],
      references: [hostingSubscription.id],
    }),
  }),
);

export const hostingRenewalActivityLogRelations = relations(
  hostingRenewalActivityLog,
  ({ one }) => ({
    hostingRenewal: one(hostingRenewal, {
      fields: [hostingRenewalActivityLog.hostingRenewalId],
      references: [hostingRenewal.id],
    }),
  }),
);

export const wordPressInstanceRelations = relations(
  wordPressInstance,
  ({ one, many }) => ({
    team: one(team, { fields: [wordPressInstance.teamId], references: [team.id] }),
    hostingSubscription: one(hostingSubscription, {
      fields: [wordPressInstance.hostingSubscriptionId],
      references: [hostingSubscription.id],
    }),
    activityLogs: many(wordPressInstanceActivityLog),
  }),
);

export const wordPressInstanceActivityLogRelations = relations(
  wordPressInstanceActivityLog,
  ({ one }) => ({
    wordPressInstance: one(wordPressInstance, {
      fields: [wordPressInstanceActivityLog.wordpressInstanceId],
      references: [wordPressInstance.id],
    }),
  }),
);

