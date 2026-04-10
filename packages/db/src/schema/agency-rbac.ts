import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const agencyRole = pgTable(
  "agency_role",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
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

