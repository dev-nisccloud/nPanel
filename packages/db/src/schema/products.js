import { relations, sql } from "drizzle-orm";
import { boolean, decimal, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./auth";
/** Prisma `Json[]` / `String[]` @default([]) → jsonb (project convention). */
const emptyJsonbArray = sql `'[]'::jsonb`;
// --- NiscProduct -------------------------------------------------------------
export const niscProduct = pgTable("nisc_product", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    serviceType: text("service_type").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    features: jsonb("features").notNull().default(emptyJsonbArray),
    highlights: jsonb("highlights").notNull().default(emptyJsonbArray),
    isAddOn: boolean("is_add_on").default(false).notNull(),
    metadata: jsonb("metadata"),
    /** Optional KRA eTIMS fields  service-level catalog for sale itemList / saveItem. */
    etimsItemCd: text("etims_item_cd"),
    etimsItemClsCd: text("etims_item_cls_cd"),
    etimsTaxTyCd: text("etims_tax_ty_cd"),
    etimsDefaultPrice: text("etims_default_price"),
    etimsPkgUnitCd: text("etims_pkg_unit_cd"),
    etimsQtyUnitCd: text("etims_qty_unit_cd"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_product_category_idx").on(table.category),
    index("nisc_product_serviceType_idx").on(table.serviceType),
    index("nisc_product_isActive_idx").on(table.isActive),
    index("nisc_product_isAddOn_idx").on(table.isAddOn),
    uniqueIndex("nisc_product_etimsItemCd_unique").on(table.etimsItemCd),
]);
// --- NiscProductAddOn --------------------------------------------------------
export const niscProductAddOn = pgTable("nisc_product_add_on", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "cascade" }),
    baseProductId: text("base_product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("nisc_product_add_on_productId_baseProductId_unique").on(table.productId, table.baseProductId),
    index("nisc_product_add_on_productId_idx").on(table.productId),
    index("nisc_product_add_on_baseProductId_idx").on(table.baseProductId),
]);
// --- NiscProductPlan ---------------------------------------------------------
export const niscProductPlan = pgTable("nisc_product_plan", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    pricingModel: text("pricing_model").notNull(),
    billingCycle: text("billing_cycle"),
    price: text("price"),
    currency: text("currency").default("KES"),
    setupFee: text("setup_fee"),
    cost: text("cost"),
    costCurrency: text("cost_currency").default("KES"),
    commissionRate: decimal("commission_rate", { precision: 10, scale: 4 }),
    commissionBase: text("commission_base"),
    commissionBaseDescription: text("commission_base_description"),
    planFeatures: jsonb("plan_features").notNull().default(emptyJsonbArray),
    highlights: jsonb("highlights").notNull().default(emptyJsonbArray),
    isPopular: boolean("is_popular").default(false).notNull(),
    isRecommended: boolean("is_recommended").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    pleskServicePlanId: text("plesk_service_plan_id"),
    pleskFilterId: text("plesk_filter_id"),
    pleskIpAddress: text("plesk_ip_address"),
    hostingType: text("hosting_type"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_product_plan_productId_idx").on(table.productId),
    index("nisc_product_plan_pricingModel_idx").on(table.pricingModel),
    index("nisc_product_plan_isActive_idx").on(table.isActive),
    index("nisc_product_plan_isDefault_idx").on(table.isDefault),
]);
// --- NiscProductPlanUsage ----------------------------------------------------
export const niscProductPlanUsage = pgTable("nisc_product_plan_usage", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "cascade" }),
    productPlanId: text("product_plan_id")
        .notNull()
        .references(() => niscProductPlan.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    usageKind: text("usage_kind").notNull(),
    limitValue: text("limit_value").notNull(),
    overuse: text("overuse").notNull(),
    period: text("period"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_product_plan_usage_productId_idx").on(table.productId),
    index("nisc_product_plan_usage_productPlanId_idx").on(table.productPlanId),
    index("nisc_product_plan_usage_usageKind_idx").on(table.usageKind),
    index("nisc_product_plan_usage_userId_idx").on(table.userId),
    index("nisc_product_plan_usage_teamId_idx").on(table.teamId),
]);
// --- NiscClientSubscription --------------------------------------------------
export const niscClientSubscription = pgTable("nisc_client_subscription", {
    id: text("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    userId: text("user_id"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    productId: text("product_id")
        .notNull()
        .references(() => niscProduct.id, { onDelete: "restrict" }),
    productPlanId: text("product_plan_id").references(() => niscProductPlan.id, {
        onDelete: "set null",
    }),
    // `nisc_order` is in `./nisc-orders`; no FK here to avoid `products` ↔ `nisc-orders` import cycle.
    orderId: text("order_id"),
    niscOrderId: text("nisc_order_id"),
    subscribedBy: text("subscribed_by"),
    recordedBy: text("recorded_by"),
    status: text("status").default("PENDING").notNull(),
    subscriptionDate: timestamp("subscription_date"),
    billingCycle: text("billing_cycle"),
    nextRenewalDate: timestamp("next_renewal_date"),
    expiryDate: timestamp("expiry_date"),
    autoRenew: boolean("auto_renew").default(false).notNull(),
    upgradedToSubscriptionId: text("upgraded_to_subscription_id").unique(),
    upgradedAt: timestamp("upgraded_at"),
    downgradedToSubscriptionId: text("downgraded_to_subscription_id").unique(),
    downgradedAt: timestamp("downgraded_at"),
    pricingModel: text("pricing_model").notNull(),
    agreedPrice: text("agreed_price"),
    agreedCurrency: text("agreed_currency").default("KES"),
    agreedCost: text("agreed_cost"),
    agreedCostCurrency: text("agreed_cost_currency").default("KES"),
    providerCost: text("provider_cost"),
    providerCostCurrency: text("provider_cost_currency").default("KES"),
    agreedCommissionRate: decimal("agreed_commission_rate", {
        precision: 10,
        scale: 4,
    }),
    agreedCommissionBase: text("agreed_commission_base"),
    primaryDomain: text("primary_domain"),
    pleskFilterId: text("plesk_filter_id"),
    pleskOwnerId: text("plesk_owner_id"),
    pleskFtpLogin: text("plesk_ftp_login"),
    pleskFtpPassword: text("plesk_ftp_password"),
    hostingType: text("hosting_type"),
    openProviderId: integer("open_provider_id"),
    domainAuthCode: text("domain_auth_code"),
    nameserverGroupId: text("nameserver_group_id"),
    wpInstallationId: integer("wp_installation_id"),
    serviceRefs: jsonb("service_refs"),
    // Intentionally no FK   Prisma keeps this as a plain @unique string.
    hostingSubscriptionId: text("hosting_subscription_id").unique(),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    foreignKey({
        columns: [table.upgradedToSubscriptionId],
        foreignColumns: [table.id],
    }).onDelete("set null"),
    foreignKey({
        columns: [table.downgradedToSubscriptionId],
        foreignColumns: [table.id],
    }).onDelete("set null"),
    index("nisc_client_subscription_userId_idx").on(table.userId),
    index("nisc_client_subscription_teamId_idx").on(table.teamId),
    index("nisc_client_subscription_productId_idx").on(table.productId),
    index("nisc_client_subscription_productPlanId_idx").on(table.productPlanId),
    index("nisc_client_subscription_orderId_idx").on(table.orderId),
    index("nisc_client_subscription_niscOrderId_idx").on(table.niscOrderId),
    index("nisc_client_subscription_status_idx").on(table.status),
    index("nisc_client_subscription_upgradedToSubscriptionId_idx").on(table.upgradedToSubscriptionId),
    index("nisc_client_subscription_downgradedToSubscriptionId_idx").on(table.downgradedToSubscriptionId),
    index("nisc_client_subscription_pricingModel_idx").on(table.pricingModel),
    index("nisc_client_subscription_pleskFilterId_idx").on(table.pleskFilterId),
    index("nisc_client_subscription_openProviderId_idx").on(table.openProviderId),
    index("nisc_client_subscription_primaryDomain_idx").on(table.primaryDomain),
    index("nisc_client_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
    index("nisc_client_subscription_expiryDate_idx").on(table.expiryDate),
    index("nisc_client_subscription_subscriptionDate_idx").on(table.subscriptionDate),
]);
// --- NiscClientSubscriptionUsage ---------------------------------------------
export const niscClientSubscriptionUsage = pgTable("nisc_client_subscription_usage", {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
        .notNull()
        .references(() => niscClientSubscription.id, { onDelete: "cascade" }),
    usageKind: text("usage_kind").notNull(),
    credits: text("credits").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("nisc_client_subscription_usage_subscriptionId_usageKind_unique").on(table.subscriptionId, table.usageKind),
    index("nisc_client_subscription_usage_subscriptionId_idx").on(table.subscriptionId),
    index("nisc_client_subscription_usage_usageKind_idx").on(table.usageKind),
]);
// --- NiscClientSubscriptionUsageActivityLog ----------------------------------
export const niscClientSubscriptionUsageActivityLog = pgTable("nisc_client_subscription_usage_activity_log", {
    id: text("id").primaryKey(),
    subscriptionUsageId: text("subscription_usage_id")
        .notNull()
        .references(() => niscClientSubscriptionUsage.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("nisc_client_sub_usage_activity_subscriptionUsageId_idx").on(table.subscriptionUsageId),
    index("nisc_client_sub_usage_activity_userId_idx").on(table.userId),
    index("nisc_client_sub_usage_activity_action_idx").on(table.action),
    index("nisc_client_sub_usage_activity_createdAt_idx").on(table.createdAt),
]);
// --- NiscClientSubscriptionRenewal -------------------------------------------
export const niscClientSubscriptionRenewal = pgTable("nisc_client_subscription_renewal", {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
        .notNull()
        .references(() => niscClientSubscription.id, { onDelete: "cascade" }),
    renewalType: text("renewal_type").notNull(),
    renewedBy: text("renewed_by"),
    renewalDate: timestamp("renewal_date").notNull(),
    newExpiryDate: timestamp("new_expiry_date"),
    newNextRenewalDate: timestamp("new_next_renewal_date"),
    billingCycle: text("billing_cycle"),
    status: text("status").default("ACTIVE").notNull(),
    renewalPrice: text("renewal_price"),
    renewalCurrency: text("renewal_currency").default("KES"),
    providerRenewalPrice: text("provider_renewal_price"),
    providerRenewalCurrency: text("provider_renewal_currency").default("KES"),
    orderId: text("order_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_client_subscription_renewal_subscriptionId_idx").on(table.subscriptionId),
    index("nisc_client_subscription_renewal_renewalType_idx").on(table.renewalType),
    index("nisc_client_subscription_renewal_renewalDate_idx").on(table.renewalDate),
    index("nisc_client_subscription_renewal_newExpiryDate_idx").on(table.newExpiryDate),
    index("nisc_client_subscription_renewal_status_idx").on(table.status),
]);
// --- Activity logs -----------------------------------------------------------
export const niscClientSubscriptionActivityLog = pgTable("nisc_client_subscription_activity_log", {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
        .notNull()
        .references(() => niscClientSubscription.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("nisc_client_sub_activity_subscriptionId_idx").on(table.subscriptionId),
    index("nisc_client_sub_activity_userId_idx").on(table.userId),
    index("nisc_client_sub_activity_action_idx").on(table.action),
    index("nisc_client_sub_activity_createdAt_idx").on(table.createdAt),
]);
export const niscClientSubscriptionRenewalActivityLog = pgTable("nisc_client_subscription_renewal_activity_log", {
    id: text("id").primaryKey(),
    renewalId: text("renewal_id")
        .notNull()
        .references(() => niscClientSubscriptionRenewal.id, {
        onDelete: "cascade",
    }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("nisc_client_sub_renewal_activity_renewalId_idx").on(table.renewalId),
    index("nisc_client_sub_renewal_activity_userId_idx").on(table.userId),
    index("nisc_client_sub_renewal_activity_action_idx").on(table.action),
    index("nisc_client_sub_renewal_activity_createdAt_idx").on(table.createdAt),
]);
/** Commission billing rows for COMMISSION-priced Nisc client subscriptions (legacy Prisma: NiscCommissionEntry). */
export const niscCommissionEntry = pgTable("nisc_commission_entry", {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
        .notNull()
        .references(() => niscClientSubscription.id, { onDelete: "cascade" }),
    productPlanId: text("product_plan_id")
        .notNull()
        .references(() => niscProductPlan.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    period: text("period").notNull(),
    baseAmount: decimal("base_amount", { precision: 18, scale: 4 }).notNull(),
    baseAmountDescription: text("base_amount_description"),
    commissionRate: decimal("commission_rate", { precision: 10, scale: 4 }).notNull(),
    commissionAmount: decimal("commission_amount", { precision: 18, scale: 4 }).notNull(),
    currency: text("currency").default("KES").notNull(),
    status: text("status").default("DRAFT").notNull(),
    invoiceId: text("invoice_id"),
    notes: text("notes"),
    createdBy: text("created_by")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_commission_entry_subscriptionId_idx").on(table.subscriptionId),
    index("nisc_commission_entry_teamId_idx").on(table.teamId),
    index("nisc_commission_entry_period_idx").on(table.period),
    index("nisc_commission_entry_status_idx").on(table.status),
]);
// --- NiscProductPromo --------------------------------------------------------
export const niscProductPromo = pgTable("nisc_product_promo", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    discountType: text("discount_type").notNull(),
    discountValue: text("discount_value"),
    discountCurrency: text("discount_currency").default("KES"),
    productId: text("product_id").references(() => niscProduct.id, {
        onDelete: "set null",
    }),
    productPlanId: text("product_plan_id").references(() => niscProductPlan.id, {
        onDelete: "set null",
    }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    minOrderValue: text("min_order_value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("nisc_product_promo_code_idx").on(table.code),
    index("nisc_product_promo_productId_idx").on(table.productId),
    index("nisc_product_promo_productPlanId_idx").on(table.productPlanId),
    index("nisc_product_promo_isActive_idx").on(table.isActive),
    index("nisc_product_promo_startDate_idx").on(table.startDate),
    index("nisc_product_promo_endDate_idx").on(table.endDate),
]);
// --- NiscProductPromoRedeem --------------------------------------------------
export const niscProductPromoRedeem = pgTable("nisc_product_promo_redeem", {
    id: text("id").primaryKey(),
    promoId: text("promo_id")
        .notNull()
        .references(() => niscProductPromo.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
    userId: text("user_id"),
    teamId: text("team_id"),
    orderId: text("order_id"),
    subscriptionId: text("subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
    renewalId: text("renewal_id").references(() => niscClientSubscriptionRenewal.id, { onDelete: "set null" }),
    discountApplied: text("discount_applied"),
    orderValue: text("order_value"),
    currency: text("currency").default("KES"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("nisc_product_promo_redeem_promoId_idx").on(table.promoId),
    index("nisc_product_promo_redeem_redeemedAt_idx").on(table.redeemedAt),
    index("nisc_product_promo_redeem_userId_idx").on(table.userId),
    index("nisc_product_promo_redeem_teamId_idx").on(table.teamId),
    index("nisc_product_promo_redeem_orderId_idx").on(table.orderId),
    index("nisc_product_promo_redeem_subscriptionId_idx").on(table.subscriptionId),
    index("nisc_product_promo_redeem_renewalId_idx").on(table.renewalId),
]);
// --- Relations (optional, for relational queries) --------------------------
export const niscProductRelations = relations(niscProduct, ({ many }) => ({
    plans: many(niscProductPlan),
    planUsages: many(niscProductPlanUsage),
    subscriptions: many(niscClientSubscription),
    addOnAsProduct: many(niscProductAddOn, { relationName: "addOnProduct" }),
    addOnAsBase: many(niscProductAddOn, { relationName: "baseProduct" }),
    promos: many(niscProductPromo),
}));
export const niscProductAddOnRelations = relations(niscProductAddOn, ({ one }) => ({
    addOnProduct: one(niscProduct, {
        fields: [niscProductAddOn.productId],
        references: [niscProduct.id],
        relationName: "addOnProduct",
    }),
    baseProduct: one(niscProduct, {
        fields: [niscProductAddOn.baseProductId],
        references: [niscProduct.id],
        relationName: "baseProduct",
    }),
}));
export const niscProductPlanRelations = relations(niscProductPlan, ({ one, many }) => ({
    product: one(niscProduct, {
        fields: [niscProductPlan.productId],
        references: [niscProduct.id],
    }),
    planUsages: many(niscProductPlanUsage),
    subscriptions: many(niscClientSubscription),
    promos: many(niscProductPromo),
}));
export const niscProductPlanUsageRelations = relations(niscProductPlanUsage, ({ one }) => ({
    product: one(niscProduct, {
        fields: [niscProductPlanUsage.productId],
        references: [niscProduct.id],
    }),
    productPlan: one(niscProductPlan, {
        fields: [niscProductPlanUsage.productPlanId],
        references: [niscProductPlan.id],
    }),
    user: one(user, {
        fields: [niscProductPlanUsage.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [niscProductPlanUsage.teamId],
        references: [team.id],
    }),
}));
export const niscClientSubscriptionRelations = relations(niscClientSubscription, ({ one, many }) => ({
    team: one(team, {
        fields: [niscClientSubscription.teamId],
        references: [team.id],
    }),
    product: one(niscProduct, {
        fields: [niscClientSubscription.productId],
        references: [niscProduct.id],
    }),
    productPlan: one(niscProductPlan, {
        fields: [niscClientSubscription.productPlanId],
        references: [niscProductPlan.id],
    }),
    upgradedTo: one(niscClientSubscription, {
        fields: [niscClientSubscription.upgradedToSubscriptionId],
        references: [niscClientSubscription.id],
        relationName: "subscriptionUpgrade",
    }),
    upgradedFrom: many(niscClientSubscription, {
        relationName: "subscriptionUpgrade",
    }),
    downgradedTo: one(niscClientSubscription, {
        fields: [niscClientSubscription.downgradedToSubscriptionId],
        references: [niscClientSubscription.id],
        relationName: "subscriptionDowngrade",
    }),
    downgradedFrom: many(niscClientSubscription, {
        relationName: "subscriptionDowngrade",
    }),
    usageRecords: many(niscClientSubscriptionUsage),
    renewals: many(niscClientSubscriptionRenewal),
    activityLogs: many(niscClientSubscriptionActivityLog),
    promoRedeems: many(niscProductPromoRedeem),
    commissionEntries: many(niscCommissionEntry),
}));
export const niscClientSubscriptionUsageRelations = relations(niscClientSubscriptionUsage, ({ one, many }) => ({
    subscription: one(niscClientSubscription, {
        fields: [niscClientSubscriptionUsage.subscriptionId],
        references: [niscClientSubscription.id],
    }),
    activityLogs: many(niscClientSubscriptionUsageActivityLog),
}));
export const niscClientSubscriptionUsageActivityLogRelations = relations(niscClientSubscriptionUsageActivityLog, ({ one }) => ({
    subscriptionUsage: one(niscClientSubscriptionUsage, {
        fields: [niscClientSubscriptionUsageActivityLog.subscriptionUsageId],
        references: [niscClientSubscriptionUsage.id],
    }),
}));
export const niscClientSubscriptionRenewalRelations = relations(niscClientSubscriptionRenewal, ({ one, many }) => ({
    subscription: one(niscClientSubscription, {
        fields: [niscClientSubscriptionRenewal.subscriptionId],
        references: [niscClientSubscription.id],
    }),
    activityLogs: many(niscClientSubscriptionRenewalActivityLog),
    promoRedeems: many(niscProductPromoRedeem),
}));
export const niscClientSubscriptionActivityLogRelations = relations(niscClientSubscriptionActivityLog, ({ one }) => ({
    subscription: one(niscClientSubscription, {
        fields: [niscClientSubscriptionActivityLog.subscriptionId],
        references: [niscClientSubscription.id],
    }),
}));
export const niscClientSubscriptionRenewalActivityLogRelations = relations(niscClientSubscriptionRenewalActivityLog, ({ one }) => ({
    renewal: one(niscClientSubscriptionRenewal, {
        fields: [niscClientSubscriptionRenewalActivityLog.renewalId],
        references: [niscClientSubscriptionRenewal.id],
    }),
}));
export const niscCommissionEntryRelations = relations(niscCommissionEntry, ({ one }) => ({
    subscription: one(niscClientSubscription, {
        fields: [niscCommissionEntry.subscriptionId],
        references: [niscClientSubscription.id],
    }),
    productPlan: one(niscProductPlan, {
        fields: [niscCommissionEntry.productPlanId],
        references: [niscProductPlan.id],
    }),
    team: one(team, {
        fields: [niscCommissionEntry.teamId],
        references: [team.id],
    }),
    creator: one(user, {
        fields: [niscCommissionEntry.createdBy],
        references: [user.id],
    }),
}));
export const niscProductPromoRelations = relations(niscProductPromo, ({ one, many }) => ({
    product: one(niscProduct, {
        fields: [niscProductPromo.productId],
        references: [niscProduct.id],
    }),
    productPlan: one(niscProductPlan, {
        fields: [niscProductPromo.productPlanId],
        references: [niscProductPlan.id],
    }),
    redeems: many(niscProductPromoRedeem),
}));
export const niscProductPromoRedeemRelations = relations(niscProductPromoRedeem, ({ one }) => ({
    promo: one(niscProductPromo, {
        fields: [niscProductPromoRedeem.promoId],
        references: [niscProductPromo.id],
    }),
    subscription: one(niscClientSubscription, {
        fields: [niscProductPromoRedeem.subscriptionId],
        references: [niscClientSubscription.id],
    }),
    renewal: one(niscClientSubscriptionRenewal, {
        fields: [niscProductPromoRedeem.renewalId],
        references: [niscClientSubscriptionRenewal.id],
    }),
}));
