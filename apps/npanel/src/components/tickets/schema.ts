import { z } from "zod";

// ============================================================================
// UI SCHEMAS - Independent from API/DB schemas (for data transformation)
// ============================================================================

// Ticket Status (UI layer)
export const ticketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;

// Ticket Priority (UI layer)
export const ticketPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

// Ticket Type (UI layer)
export const ticketTypeSchema = z.enum([
  "TECHNICAL",
  "BILLING",
  "FEATURE",
  "BUG",
  "ACCOUNT",
  "GENERAL",
  "HOSTING",
  "DOMAIN",
  "EMAIL",
  "WORDPRESS",
]);

export type TicketType = z.infer<typeof ticketTypeSchema>;

// Message Read Status (UI layer)
export const messageReadStatusSchema = z.enum(["SENT", "DELIVERED", "READ"]);

export type MessageReadStatus = z.infer<typeof messageReadStatusSchema>;

// Ticket List Item (for chat list)
export const ticketListItemSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.date().nullable(),
  unreadCount: z.number(),
  assignedToName: z.string().nullable().optional(), // For customer side
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
});

export type TicketListItem = z.infer<typeof ticketListItemSchema>;

// Ticket Message (UI layer)
export const ticketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  senderId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isSystem: z.boolean(),
  readStatus: messageReadStatusSchema,
  readAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  sender: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileUrl: z.string(),
  })).optional(),
});

export type TicketMessage = z.infer<typeof ticketMessageSchema>;

// Ticket (UI layer)
export const ticketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  subject: z.string().nullable(),
  description: z.string().nullable(),
  type: ticketTypeSchema,
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  source: z.enum(["WEB", "EMAIL", "API", "CHAT", "PHONE"]),
  createdById: z.string(),
  teamId: z.string().nullable(),
  assignedToId: z.string().nullable(),
  lastMessageId: z.string().nullable(),
  lastMessageAt: z.date().nullable(),
  lastMessagePreview: z.string().nullable(),
  unreadCount: z.number(),
  customerUnreadCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().nullable(),
  closedAt: z.date().nullable(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }).optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  assignedTo: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }).nullable().optional(),
});

export type Ticket = z.infer<typeof ticketSchema>;
