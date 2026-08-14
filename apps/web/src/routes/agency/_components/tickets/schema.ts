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
// Use z.coerce.date() so ISO strings from the API are parsed to Date
export const ticketListItemSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  subject: z.string().nullable().optional(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.coerce.date().nullable(),
  unreadCount: z.number(),
  customerName: z.string().optional(), // For agency side
  assignedToName: z.string().nullable().optional(), // For customer side
  isGuest: z.boolean().optional(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  metadata: z.unknown().nullable().optional(),
});

export type TicketListItem = z.infer<typeof ticketListItemSchema>;

// Ticket Message (UI layer)
// Use z.coerce.date() so ISO strings from the API are parsed to Date
export const ticketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  senderId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isSystem: z.boolean(),
  readStatus: messageReadStatusSchema,
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  editedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
  senderIsAgency: z.boolean().optional(),
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
  lastMessageAt: z.coerce.date().nullable(),
  lastMessagePreview: z.string().nullable(),
  unreadCount: z.number(),
  customerUnreadCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  closedAt: z.coerce.date().nullable(),
  guestContact: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string().nullable(),
    })
    .nullable()
    .optional(),
  metadata: z.unknown().nullable().optional(),
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
