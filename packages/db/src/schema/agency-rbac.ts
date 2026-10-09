import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const agencyRole = pgTable(
  "agency_role",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    menus: jsonb("menus").$type<string[]>().default([]).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
);

export const agencyPermission = pgTable(
  "agency_permission",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
);

export const agencyRolePermission = pgTable(
  "agency_role_permission",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => agencyRole.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => agencyPermission.id, { onDelete: "cascade" }),
    /** read | write. Write includes read. Missing row means no access. */
    access: text("access").default("write").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("agency_role_permission_roleId_permissionId_unique").on(
      table.roleId,
      table.permissionId,
    ),
    index("agency_role_permission_permission_id_lookup_idx").on(
      table.permissionId,
    ),
  ],
);

export const agencyRoleRelations = relations(agencyRole, ({ many }) => ({
  permissions: many(agencyRolePermission),
  users: many(user),
}));

export const agencyPermissionRelations = relations(
  agencyPermission,
  ({ many }) => ({
    roles: many(agencyRolePermission),
  }),
);

/** Denied agency permission checks. Written when a restricted role calls an API it cannot use. */
export const agencyPermissionDenialLog = pgTable(
  "agency_permission_denial_log",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
    userEmail: text("user_email"),
    agencyRoleId: text("agency_role_id"),
    agencyRoleName: text("agency_role_name"),
    procedurePath: text("procedure_path").notNull(),
    procedureType: text("procedure_type").notNull(),
    permissionKey: text("permission_key").notNull(),
    requiredAccess: text("required_access").notNull(),
    grantedAccess: text("granted_access"),
    ipAddress: text("ip_address"),
    input: jsonb("input"),
  },
  (table) => [
    index("agency_permission_denial_log_created_at_idx").on(table.createdAt),
    index("agency_permission_denial_log_user_id_idx").on(table.userId),
    index("agency_permission_denial_log_permission_key_idx").on(table.permissionKey),
  ],
);

export const agencyRolePermissionRelations = relations(
  agencyRolePermission,
  ({ one }) => ({
    role: one(agencyRole, {
      fields: [agencyRolePermission.roleId],
      references: [agencyRole.id],
    }),
    permission: one(agencyPermission, {
      fields: [agencyRolePermission.permissionId],
      references: [agencyPermission.id],
    }),
  }),
);

