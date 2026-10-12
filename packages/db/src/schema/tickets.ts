import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { team } from "./teams";
import { user } from "./auth";

export const ticket = pgTable(
  "ticket",
  {
    id: text("_id").primaryKey(),
    ticketNumber: text("ticket_number").notNull().unique(),

    subject: text("subject"),
    description: text("description"),

    // Prisma enums stored as text with default values.
    type: text("type").default("GENERAL").notNull(),
    priority: text("priority").default("NORMAL").notNull(),
    status: text("status").default("OPEN").notNull(),
    source: text("source").default("WEB").notNull(),

    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    assignedToId: text("assigned_to_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Customer the ticket is about when agency staff open it internally.
    customerUserId: text("customer_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // CUSTOMER: the customer can see and reply. AGENCY: agency staff only.
    visibility: text("visibility").default("CUSTOMER").notNull(),

    lastMessageId: text("last_message_id"),
    lastMessageAt: timestamp("last_message_at"),
    lastMessagePreview: text("last_message_preview"),

    unreadCount: integer("unread_count").default(0).notNull(),
    customerUnreadCount: integer("customer_unread_count").default(0).notNull(),

    metadata: jsonb("metadata"),
    internalNotes: text("internal_notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),

    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    firstResponseAt: timestamp("first_response_at"),
    lastResponseAt: timestamp("last_response_at"),
    lastCustomerResponseAt: timestamp("last_customer_response_at"),
    lastAgentResponseAt: timestamp("last_agent_response_at"),
  },
  (table) => [
    index("ticket_createdById_idx").on(table.createdById),
    index("ticket_teamId_idx").on(table.teamId),
    index("ticket_assignedToId_idx").on(table.assignedToId),
    index("ticket_customerUserId_idx").on(table.customerUserId),
    index("ticket_visibility_idx").on(table.visibility),
    index("ticket_status_idx").on(table.status),
    index("ticket_priority_idx").on(table.priority),
    index("ticket_type_idx").on(table.type),
    index("ticket_ticketNumber_idx").on(table.ticketNumber),
    index("ticket_createdAt_idx").on(table.createdAt),
    index("ticket_lastMessageAt_idx").on(table.lastMessageAt),

    index("ticket_status_priority_idx").on(table.status, table.priority),
    index("ticket_teamId_status_idx").on(table.teamId, table.status),
    index("ticket_assignedToId_status_idx").on(table.assignedToId, table.status),
  ],
);

export const ticketMessage = pgTable(
  "ticket_message",
  {
    id: text("_id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(false).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),

    readStatus: text("read_status").default("SENT").notNull(),
    readAt: timestamp("read_at"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),

    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("ticket_message_ticketId_idx").on(table.ticketId),
    index("ticket_message_senderId_idx").on(table.senderId),
    index("ticket_message_createdAt_idx").on(table.createdAt),
    index("ticket_message_ticketId_createdAt_idx").on(table.ticketId, table.createdAt),
    index("ticket_message_isInternal_idx").on(table.isInternal),
    index("ticket_message_deletedAt_idx").on(table.deletedAt),
    index("ticket_message_readStatus_idx").on(table.readStatus),
  ],
);

export const ticketAttachment = pgTable(
  "ticket_attachment",
  {
    id: text("_id").primaryKey(),
    ticketId: text("ticket_id").references(() => ticket.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => ticketMessage.id, { onDelete: "cascade" }),

    uploadedById: text("uploaded_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    fileUrl: text("file_url").notNull(),
    storageKey: text("storage_key"),

    description: text("description"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ticket_attachment_ticketId_idx").on(table.ticketId),
    index("ticket_attachment_messageId_idx").on(table.messageId),
    index("ticket_attachment_uploadedById_idx").on(table.uploadedById),
    index("ticket_attachment_createdAt_idx").on(table.createdAt),
  ],
);

export const ticketTag = pgTable(
  "ticket_tag",
  {
    id: text("_id").primaryKey(),
    name: text("name").notNull().unique(),
    color: text("color"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("ticket_tag_name_idx").on(table.name)],
);

export const ticketTagRelation = pgTable(
  "ticket_tag_relation",
  {
    id: text("_id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => ticketTag.id, { onDelete: "cascade" }),
    addedById: text("added_by_id"),
    addedAt: timestamp("added_at").notNull(),
  },
  (table) => [
    uniqueIndex("ticket_tag_relation_ticketId_tagId_unique").on(
      table.ticketId,
      table.tagId,
    ),
    index("ticket_tag_relation_ticketId_idx").on(table.ticketId),
    index("ticket_tag_relation_tagId_idx").on(table.tagId),
  ],
);

export const ticketActivityLog = pgTable(
  "ticket_activity_log",
  {
    id: text("_id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    userId: text("user_id"),

    action: text("action").notNull(),
    description: text("description"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    metadata: jsonb("metadata"),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("ticket_activity_log_ticketId_idx").on(table.ticketId),
    index("ticket_activity_log_userId_idx").on(table.userId),
    index("ticket_activity_log_action_idx").on(table.action),
    index("ticket_activity_log_createdAt_idx").on(table.createdAt),
    index("ticket_activity_log_ticketId_createdAt_idx").on(table.ticketId, table.createdAt),
  ],
);

export const ticketRelations = relations(ticket, ({ many, one }) => ({
  createdBy: one(user, {
    fields: [ticket.createdById],
    references: [user.id],
    relationName: "CreatedTickets",
  }),
  team: one(team, {
    fields: [ticket.teamId],
    references: [team.id],
  }),
  assignedTo: one(user, {
    fields: [ticket.assignedToId],
    references: [user.id],
    relationName: "AssignedTickets",
  }),
  customerUser: one(user, {
    fields: [ticket.customerUserId],
    references: [user.id],
    relationName: "CustomerTickets",
  }),
  messages: many(ticketMessage),
  attachments: many(ticketAttachment),
  tags: many(ticketTagRelation),
  activityLogs: many(ticketActivityLog),
}));

export const ticketMessageRelations = relations(ticketMessage, ({ one, many }) => ({
  ticket: one(ticket, {
    fields: [ticketMessage.ticketId],
    references: [ticket.id],
  }),
  sender: one(user, {
    fields: [ticketMessage.senderId],
    references: [user.id],
  }),
  attachments: many(ticketAttachment),
}));

export const ticketAttachmentRelations = relations(ticketAttachment, ({ one }) => ({
  ticket: one(ticket, {
    fields: [ticketAttachment.ticketId],
    references: [ticket.id],
  }),
  message: one(ticketMessage, {
    fields: [ticketAttachment.messageId],
    references: [ticketMessage.id],
  }),
  uploadedBy: one(user, {
    fields: [ticketAttachment.uploadedById],
    references: [user.id],
  }),
}));

export const ticketTagRelations = relations(ticketTag, ({ many }) => ({
  tickets: many(ticketTagRelation),
}));

export const ticketTagRelationRelations = relations(ticketTagRelation, ({ one }) => ({
  ticket: one(ticket, {
    fields: [ticketTagRelation.ticketId],
    references: [ticket.id],
  }),
  tag: one(ticketTag, {
    fields: [ticketTagRelation.tagId],
    references: [ticketTag.id],
  }),
}));

export const ticketActivityLogRelations = relations(ticketActivityLog, ({ one }) => ({
  ticket: one(ticket, {
    fields: [ticketActivityLog.ticketId],
    references: [ticket.id],
  }),
}));

