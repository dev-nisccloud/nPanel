import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
import { customerIntegration } from "./auth-extras";
import { nameserverGroup } from "./nameservers";
export const domain = pgTable("domain", {
    id: text("id").primaryKey(),
    domainName: text("domain_name").notNull().unique(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    openProviderId: integer("open_provider_id").notNull(),
    activationDate: timestamp("activation_date"),
    expirationDate: timestamp("expiration_date"),
    renewalDate: timestamp("renewal_date"),
    registrationDate: timestamp("registration_date").notNull(),
    openProviderPrice: text("open_provider_price"),
    niscPrice: text("nisc_price"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    customerIntegrationId: text("customer_integration_id").references(() => customerIntegration.id, { onDelete: "set null" }),
    nameserverGroupId: text("nameserver_group_id").references(() => nameserverGroup.id, { onDelete: "set null" }),
}, (table) => [
    index("domain_domainName_idx").on(table.domainName),
    index("domain_userId_idx").on(table.userId),
    index("domain_teamId_idx").on(table.teamId),
    index("domain_openProviderId_idx").on(table.openProviderId),
    index("domain_registrationDate_idx").on(table.registrationDate),
    index("domain_expirationDate_idx").on(table.expirationDate),
]);
export const domainRenewal = pgTable("domain_renewal", {
    id: text("id").primaryKey(),
    domainId: text("domain_id")
        .notNull()
        .unique()
        .references(() => domain.id, { onDelete: "cascade" }),
    renewedBy: text("renewed_by").notNull(),
    renewalDate: timestamp("renewal_date").notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    openProviderPrice: text("open_provider_price"),
    niscPrice: text("nisc_price"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("domain_renewal_domainId_idx").on(table.domainId),
    index("domain_renewal_renewalDate_idx").on(table.renewalDate),
    index("domain_renewal_renewedBy_idx").on(table.renewedBy),
    index("domain_renewal_teamId_idx").on(table.teamId),
]);
export const domainTransfer = pgTable("domain_transfer", {
    id: text("id").primaryKey(),
    domainId: text("domain_id")
        .notNull()
        .references(() => domain.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").notNull(),
    transferredBy: text("transferred_by"),
    authCode: text("auth_code").notNull(),
    status: text("status").default("PENDING_TRANSFER").notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    transferRequestedAt: timestamp("transfer_requested_at").notNull(),
    transferCompletedAt: timestamp("transfer_completed_at"),
    openProviderPrice: text("open_provider_price"),
    niscPrice: text("nisc_price"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    nameserverGroupId: text("nameserver_group_id").references(() => nameserverGroup.id, { onDelete: "set null" }),
}, (table) => [
    index("domain_transfer_domainId_idx").on(table.domainId),
    index("domain_transfer_status_idx").on(table.status),
    index("domain_transfer_transferRequestedAt_idx").on(table.transferRequestedAt),
    index("domain_transfer_transferredBy_idx").on(table.transferredBy),
    index("domain_transfer_createdById_idx").on(table.createdById),
    index("domain_transfer_teamId_idx").on(table.teamId),
]);
export const domainActivityLog = pgTable("domain_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    domainId: text("domain_id")
        .notNull()
        .references(() => domain.id, { onDelete: "cascade" }),
    teamId: text("team_id"),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("domain_activity_log_userId_idx").on(table.userId),
    index("domain_activity_log_domainId_idx").on(table.domainId),
    index("domain_activity_log_teamId_idx").on(table.teamId),
    index("domain_activity_log_action_idx").on(table.action),
    index("domain_activity_log_createdAt_idx").on(table.createdAt),
]);
export const domainRenewalActivityLog = pgTable("domain_renewal_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    domainRenewalId: text("domain_renewal_id")
        .notNull()
        .references(() => domainRenewal.id, { onDelete: "cascade" }),
    teamId: text("team_id"),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("domain_renewal_activity_log_userId_idx").on(table.userId),
    index("domain_renewal_activity_log_domainRenewalId_idx").on(table.domainRenewalId),
    index("domain_renewal_activity_log_teamId_idx").on(table.teamId),
    index("domain_renewal_activity_log_action_idx").on(table.action),
    index("domain_renewal_activity_log_createdAt_idx").on(table.createdAt),
]);
export const domainTransferActivityLog = pgTable("domain_transfer_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    domainTransferId: text("domain_transfer_id")
        .notNull()
        .references(() => domainTransfer.id, { onDelete: "cascade" }),
    teamId: text("team_id"),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("domain_transfer_activity_log_userId_idx").on(table.userId),
    index("domain_transfer_activity_log_domainTransferId_idx").on(table.domainTransferId),
    index("domain_transfer_activity_log_teamId_idx").on(table.teamId),
    index("domain_transfer_activity_log_action_idx").on(table.action),
    index("domain_transfer_activity_log_createdAt_idx").on(table.createdAt),
]);
export const domainRelations = relations(domain, ({ one, many }) => ({
    user: one(user, { fields: [domain.userId], references: [user.id] }),
    team: one(team, { fields: [domain.teamId], references: [team.id] }),
    customerIntegration: one(customerIntegration, {
        fields: [domain.customerIntegrationId],
        references: [customerIntegration.id],
    }),
    nameserverGroup: one(nameserverGroup, {
        fields: [domain.nameserverGroupId],
        references: [nameserverGroup.id],
    }),
    renewals: many(domainRenewal),
    transfers: many(domainTransfer),
    activityLogs: many(domainActivityLog),
}));
export const domainRenewalRelations = relations(domainRenewal, ({ one, many }) => ({
    domain: one(domain, { fields: [domainRenewal.domainId], references: [domain.id] }),
    team: one(team, { fields: [domainRenewal.teamId], references: [team.id] }),
    activityLogs: many(domainRenewalActivityLog),
}));
export const domainTransferRelations = relations(domainTransfer, ({ one, many }) => ({
    domain: one(domain, {
        fields: [domainTransfer.domainId],
        references: [domain.id],
    }),
    team: one(team, { fields: [domainTransfer.teamId], references: [team.id] }),
    nameserverGroup: one(nameserverGroup, {
        fields: [domainTransfer.nameserverGroupId],
        references: [nameserverGroup.id],
    }),
    activityLogs: many(domainTransferActivityLog),
}));
export const domainActivityLogRelations = relations(domainActivityLog, ({ one }) => ({
    domain: one(domain, {
        fields: [domainActivityLog.domainId],
        references: [domain.id],
    }),
}));
export const domainRenewalActivityLogRelations = relations(domainRenewalActivityLog, ({ one }) => ({
    domainRenewal: one(domainRenewal, {
        fields: [domainRenewalActivityLog.domainRenewalId],
        references: [domainRenewal.id],
    }),
}));
export const domainTransferActivityLogRelations = relations(domainTransferActivityLog, ({ one }) => ({
    domainTransfer: one(domainTransfer, {
        fields: [domainTransferActivityLog.domainTransferId],
        references: [domainTransfer.id],
    }),
}));
