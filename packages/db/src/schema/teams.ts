import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    baseCurrency: text("base_currency").default("KES").notNull(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow()
      .notNull(),
    createdById: text("created_by_id").notNull(),
  },
  (table) => [
    index("team_slug_idx").on(table.slug),
    index("team_createdById_idx").on(table.createdById),
    index("team_isActive_idx").on(table.isActive),
  ],
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    role: text("role").default("MEMBER").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_member_teamId_idx").on(table.teamId),
    index("team_member_userId_idx").on(table.userId),
  ],
);

export const teamMemberPermission = pgTable(
  "team_member_permission",
  {
    id: text("id").primaryKey(),
    teamMemberId: text("team_member_id")
      .notNull()
      .references(() => teamMember.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key").notNull(),
    access: text("access").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_member_permission_memberId_key_unique").on(
      table.teamMemberId,
      table.permissionKey,
    ),
    index("team_member_permission_teamMemberId_idx").on(table.teamMemberId),
    index("team_member_permission_permissionKey_idx").on(table.permissionKey),
  ],
);

export const teamInvite = pgTable(
  "team_invite",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").default("MEMBER").notNull(),
    status: text("status").default("PENDING").notNull(),
    invitedById: text("invited_by_id").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_invite_code_idx").on(table.code),
    index("team_invite_teamId_idx").on(table.teamId),
    index("team_invite_email_idx").on(table.email),
    index("team_invite_status_idx").on(table.status),
    index("team_invite_expiresAt_idx").on(table.expiresAt),
  ],
);

export const teamBillingSettings = pgTable(
  "team_billing_settings",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .unique()
      .references(() => team.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    billingEmail: text("billing_email").notNull(),
    billingPhone: text("billing_phone"),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state"),
    country: text("country").notNull(),
    postalCode: text("postal_code"),
    taxId: text("tax_id"),
    additionalNotes: text("additional_notes"),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_billing_settings_teamId_idx").on(table.teamId),
  ],
);

export const teamBillingSettingsActivityLog = pgTable(
  "team_billing_settings_activity_log",
  {
    id: text("id").primaryKey(),
    teamBillingSettingsId: text("team_billing_settings_id")
      .notNull()
      .references(() => teamBillingSettings.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("team_billing_settings_activity_teamBillingSettingsId_idx").on(
      table.teamBillingSettingsId,
    ),
    index("team_billing_settings_activity_userId_idx").on(table.userId),
    index("team_billing_settings_activity_action_idx").on(table.action),
    index("team_billing_settings_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const teamRelations = relations(team, ({ many }) => ({
  members: many(teamMember),
  invites: many(teamInvite),
  billingSettings: many(teamBillingSettings),
}));

export const teamMemberRelations = relations(teamMember, ({ one, many }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
  permissions: many(teamMemberPermission),
}));

export const teamMemberPermissionRelations = relations(
  teamMemberPermission,
  ({ one }) => ({
    member: one(teamMember, {
      fields: [teamMemberPermission.teamMemberId],
      references: [teamMember.id],
    }),
  }),
);

export const teamInviteRelations = relations(teamInvite, ({ one }) => ({
  team: one(team, {
    fields: [teamInvite.teamId],
    references: [team.id],
  }),
}));

export const teamBillingSettingsRelations = relations(
  teamBillingSettings,
  ({ one }) => ({
    team: one(team, {
      fields: [teamBillingSettings.teamId],
      references: [team.id],
    }),
  }),
);

export const teamBillingSettingsActivityLogRelations = relations(
  teamBillingSettingsActivityLog,
  ({ one }) => ({
    teamBillingSettings: one(teamBillingSettings, {
      fields: [teamBillingSettingsActivityLog.teamBillingSettingsId],
      references: [teamBillingSettings.id],
    }),
  }),
);

