import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, asc, count, desc, eq, inArray, isNull, like, ne } from "@npanel/db";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
  ticket,
  ticketActivityLog,
  ticketAttachment,
  ticketMessage,
} from "@npanel/db/schema/tickets";

// ============================================================================
// TYPESCRIPT TYPES - Independent from Prisma, mirroring database structure
// ============================================================================

// Ticket status enums as TypeScript types (independent from DB)
type TicketStatusType =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

type TicketPriorityType = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type TicketTypeType =
  | "TECHNICAL"
  | "BILLING"
  | "FEATURE"
  | "BUG"
  | "ACCOUNT"
  | "GENERAL"
  | "HOSTING"
  | "DOMAIN"
  | "EMAIL"
  | "WORDPRESS";

type TicketSourceType = "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";

type MessageReadStatusType = "SENT" | "DELIVERED" | "READ";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================

// Ticket Status Schema
const ticketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

// Ticket Priority Schema
const ticketPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

// Ticket Type Schema
const ticketTypeSchema = z.enum([
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

// Ticket Source Schema
const ticketSourceSchema = z.enum(["WEB", "EMAIL", "API", "CHAT", "PHONE"]);

// Message Read Status Schema
const messageReadStatusSchema = z.enum(["SENT", "DELIVERED", "READ"]);

// User Schema (for responses)
const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
});

// Team Schema (for responses)
const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

// Ticket Message Schema
const ticketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  senderId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isSystem: z.boolean(),
  readStatus: messageReadStatusSchema,
  readAt: z.date().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  sender: userSchema.optional(),
  attachments: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileUrl: z.string(),
  })).optional(),
});

// Ticket Schema
const ticketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  subject: z.string().nullable(),
  description: z.string().nullable(),
  type: ticketTypeSchema,
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  source: ticketSourceSchema,
  createdById: z.string(),
  teamId: z.string().nullable(),
  assignedToId: z.string().nullable(),
  lastMessageId: z.string().nullable(),
  lastMessageAt: z.date().nullable(),
  lastMessagePreview: z.string().nullable(),
  unreadCount: z.number(),
  customerUnreadCount: z.number(),
  metadata: z.unknown().nullable(),
  internalNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().nullable(),
  closedAt: z.date().nullable(),
  firstResponseAt: z.date().nullable(),
  lastResponseAt: z.date().nullable(),
  lastCustomerResponseAt: z.date().nullable(),
  lastAgentResponseAt: z.date().nullable(),
  createdBy: userSchema.optional(),
  team: teamSchema.nullable().optional(),
  assignedTo: userSchema.nullable().optional(),
});

// Ticket List Item Schema (for chat list)
const ticketListItemSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.date().nullable(),
  unreadCount: z.number(),
  customerName: z.string().optional(), // For agency side
  assignedToName: z.string().nullable().optional(), // For customer side
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
});

// Input Schemas
const createTicketInputSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  type: ticketTypeSchema.default("GENERAL"),
  priority: ticketPrioritySchema.default("NORMAL"),
  source: ticketSourceSchema.default("WEB"),
  teamId: z.string().optional(),
  metadata: z.unknown().optional(),
});

const updateTicketInputSchema = z.object({
  id: z.string(),
  subject: z.string().optional(),
  description: z.string().optional(),
  type: ticketTypeSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  assignedToId: z.string().nullable().optional(),
  internalNotes: z.string().optional(),
  metadata: z.unknown().optional(),
});

const createMessageInputSchema = z.object({
  ticketId: z.string(),
  content: z.string().min(1, "Message content is required"),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileUrl: z.string(),
    storageKey: z.string().optional(),
  })).optional(),
});

const getTicketsInputSchema = z.object({
  teamId: z.string().optional(),
  assignedToId: z.string().optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  type: ticketTypeSchema.optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

const getTicketMessagesInputSchema = z.object({
  ticketId: z.string(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

const markMessageReadInputSchema = z.object({
  messageId: z.string(),
  readStatus: messageReadStatusSchema,
});

const assignTicketInputSchema = z.object({
  ticketId: z.string(),
  assignedToId: z.string().nullable(),
});

const updateTicketStatusInputSchema = z.object({
  ticketId: z.string(),
  status: ticketStatusSchema,
});

// ============================================================================
// TRANSFORM FUNCTIONS - Convert DB types to API response types
// ============================================================================

function transformTicket(ticket: any) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    type: ticket.type as TicketTypeType,
    priority: ticket.priority as TicketPriorityType,
    status: ticket.status as TicketStatusType,
    source: ticket.source as TicketSourceType,
    createdById: ticket.createdById,
    teamId: ticket.teamId,
    assignedToId: ticket.assignedToId,
    lastMessageId: ticket.lastMessageId,
    lastMessageAt: ticket.lastMessageAt,
    lastMessagePreview: ticket.lastMessagePreview,
    unreadCount: ticket.unreadCount,
    customerUnreadCount: ticket.customerUnreadCount,
    metadata: ticket.metadata,
    internalNotes: ticket.internalNotes,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
    firstResponseAt: ticket.firstResponseAt,
    lastResponseAt: ticket.lastResponseAt,
    lastCustomerResponseAt: ticket.lastCustomerResponseAt,
    lastAgentResponseAt: ticket.lastAgentResponseAt,
    createdBy: ticket.createdBy ? {
      id: ticket.createdBy.id,
      name: ticket.createdBy.name,
      email: ticket.createdBy.email,
    } : undefined,
    team: ticket.team ? {
      id: ticket.team.id,
      name: ticket.team.name,
      slug: ticket.team.slug,
    } : null,
    assignedTo: ticket.assignedTo ? {
      id: ticket.assignedTo.id,
      name: ticket.assignedTo.name,
      email: ticket.assignedTo.email,
    } : null,
  };
}

function transformTicketMessage(message: any) {
  return {
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId,
    content: message.content,
    isInternal: message.isInternal,
    isSystem: message.isSystem,
    readStatus: message.readStatus as MessageReadStatusType,
    readAt: message.readAt,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    sender: message.sender ? {
      id: message.sender.id,
      name: message.sender.name,
      email: message.sender.email,
    } : undefined,
    attachments: message.attachments?.map((att: any) => ({
      id: att.id,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      fileUrl: att.fileUrl,
    })) || [],
  };
}

function transformTicketListItem(ticket: any, isAgency: boolean) {
  const result: any = {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    lastMessage: ticket.lastMessagePreview,
    lastMessageAt: ticket.lastMessageAt,
    unreadCount: isAgency ? ticket.unreadCount : ticket.customerUnreadCount,
    status: ticket.status as TicketStatusType,
    priority: ticket.priority as TicketPriorityType,
  };

  if (isAgency) {
    // For agency: show customer name
    if (ticket.createdBy) {
      result.customerName = ticket.createdBy.name || ticket.createdBy.email;
    }
  } else {
    // For customer: show assigned agent name
    if (ticket.assignedTo) {
      result.assignedToName = ticket.assignedTo.name || ticket.assignedTo.email;
    }
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthenticatedUser(ctx: { session: { user?: { id: string } } | null }) {
  const sessionUser = ctx.session?.user;
  if (!sessionUser?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  return { id: sessionUser.id };
}

async function fetchUserRole(userId: string): Promise<string | null> {
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
  return row?.role ?? null;
}

function roleIsAgency(role: string | null | undefined): boolean {
  return (role ?? "").includes("AGENCY");
}

const ticketWithRelations = {
  createdBy: { columns: { id: true, name: true, email: true } as const },
  team: { columns: { id: true, name: true, slug: true } as const },
  assignedTo: { columns: { id: true, name: true, email: true } as const },
} as const;

const messageWithRelations = {
  sender: { columns: { id: true, name: true, email: true } as const },
  attachments: {
    columns: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      fileUrl: true,
    } as const,
  },
} as const;

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  const [lastTicket] = await db
    .select()
    .from(ticket)
    .where(like(ticket.ticketNumber, `${prefix}%`))
    .orderBy(desc(ticket.ticketNumber))
    .limit(1);

  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNumber.replace(prefix, ""), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(6, "0")}`;
}

async function logTicketActivity(
  ticketId: string,
  userId: string,
  action: string,
  description?: string | null,
  oldValue?: unknown,
  newValue?: unknown,
  metadata?: unknown,
) {
  try {
    await db.insert(ticketActivityLog).values({
      id: randomUUID(),
      ticketId,
      userId,
      action,
      description: description ?? null,
      oldValue: oldValue as any,
      newValue: newValue as any,
      metadata: metadata as any,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to log ticket activity:", error);
  }
}

// ============================================================================
// TICKETS ROUTER
// ============================================================================

export const ticketsRouter = router({
  // Get tickets list (for chat list view)
  getList: protectedProcedure
    .input(getTicketsInputSchema)
    .output(z.array(ticketListItemSchema))
    .query(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const conds = [];
      if (isAgency) {
        if (input.assignedToId) {
          conds.push(eq(ticket.assignedToId, input.assignedToId));
        }
      } else {
        conds.push(eq(ticket.createdById, sessionUser.id));
        if (input.teamId) {
          conds.push(eq(ticket.teamId, input.teamId));
        }
      }

      if (input.status) {
        conds.push(eq(ticket.status, input.status));
      }

      if (input.priority) {
        conds.push(eq(ticket.priority, input.priority));
      }

      if (input.type) {
        conds.push(eq(ticket.type, input.type));
      }

      const ticketsList = await db.query.ticket.findMany({
        where: conds.length ? and(...conds) : undefined,
        orderBy: [desc(ticket.lastMessageAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          createdBy: { columns: { id: true, name: true, email: true } },
          assignedTo: { columns: { id: true, name: true, email: true } },
        },
      });

      return ticketsList.map((t) => transformTicketListItem(t, isAgency));
    }),

  // Get single ticket by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(ticketSchema)
    .query(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const conds = [eq(ticket.id, input.id)];
      if (!isAgency) {
        conds.push(eq(ticket.createdById, sessionUser.id));
      }

      const ticketRow = await db.query.ticket.findFirst({
        where: and(...conds),
        with: ticketWithRelations,
      });

      if (!ticketRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return transformTicket(ticketRow);
    }),

  // Create new ticket
  create: protectedProcedure
    .input(createTicketInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const ticketNumber = await generateTicketNumber();
      const id = randomUUID();
      const now = new Date();

      await db.insert(ticket).values({
        id,
        ticketNumber,
        subject: input.subject ?? null,
        description: input.description ?? null,
        type: input.type,
        priority: input.priority,
        status: "OPEN",
        source: input.source,
        createdById: sessionUser.id,
        teamId: input.teamId ?? null,
        assignedToId: null,
        lastMessageId: null,
        lastMessageAt: null,
        lastMessagePreview: null,
        unreadCount: 0,
        customerUnreadCount: 0,
        metadata: input.metadata as any,
        internalNotes: null,
        createdAt: now,
        updatedAt: now,
      });

      await logTicketActivity(
        id,
        sessionUser.id,
        "CREATE",
        `Ticket ${ticketNumber} created`,
        null,
        { status: "OPEN", type: input.type, priority: input.priority },
      );

      const full = await db.query.ticket.findFirst({
        where: eq(ticket.id, id),
        with: ticketWithRelations,
      });

      if (!full) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load created ticket",
        });
      }

      return transformTicket(full);
    }),

  // Update ticket
  update: protectedProcedure
    .input(updateTicketInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const accessConds = [eq(ticket.id, input.id)];
      if (!isAgency) {
        accessConds.push(eq(ticket.createdById, sessionUser.id));
      }

      const [existingTicket] = await db
        .select()
        .from(ticket)
        .where(and(...accessConds))
        .limit(1);

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      const oldValues: Record<string, unknown> = {};

      if (input.subject !== undefined) {
        oldValues.subject = existingTicket.subject;
        updateData.subject = input.subject;
      }
      if (input.description !== undefined) {
        oldValues.description = existingTicket.description;
        updateData.description = input.description;
      }
      if (input.type !== undefined) {
        oldValues.type = existingTicket.type;
        updateData.type = input.type;
      }
      if (input.priority !== undefined) {
        oldValues.priority = existingTicket.priority;
        updateData.priority = input.priority;
      }
      if (input.status !== undefined) {
        oldValues.status = existingTicket.status;
        updateData.status = input.status;

        if (input.status === "RESOLVED" && !existingTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        if (input.status === "CLOSED" && !existingTicket.closedAt) {
          updateData.closedAt = new Date();
        }
      }
      if (input.assignedToId !== undefined) {
        oldValues.assignedToId = existingTicket.assignedToId;
        updateData.assignedToId = input.assignedToId;
      }
      if (input.internalNotes !== undefined && isAgency) {
        oldValues.internalNotes = existingTicket.internalNotes;
        updateData.internalNotes = input.internalNotes;
      }
      if (input.metadata !== undefined) {
        oldValues.metadata = existingTicket.metadata;
        updateData.metadata = input.metadata as any;
      }

      await db.update(ticket).set(updateData as any).where(eq(ticket.id, input.id));

      await logTicketActivity(
        input.id,
        sessionUser.id,
        "UPDATE",
        "Ticket updated",
        oldValues,
        updateData,
      );

      const updatedRow = await db.query.ticket.findFirst({
        where: eq(ticket.id, input.id),
        with: ticketWithRelations,
      });

      if (!updatedRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return transformTicket(updatedRow);
    }),

  // Get messages for a ticket
  getMessages: protectedProcedure
    .input(getTicketMessagesInputSchema)
    .output(z.object({
      messages: z.array(ticketMessageSchema),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const ticketConds = [eq(ticket.id, input.ticketId)];
      if (!isAgency) {
        ticketConds.push(eq(ticket.createdById, sessionUser.id));
      }

      const [ticketRow] = await db
        .select({ id: ticket.id })
        .from(ticket)
        .where(and(...ticketConds))
        .limit(1);

      if (!ticketRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const msgConds = [eq(ticketMessage.ticketId, input.ticketId), isNull(ticketMessage.deletedAt)];
      if (!isAgency) {
        msgConds.push(eq(ticketMessage.isInternal, false));
      }
      const msgWhere = and(...msgConds);

      const [messages, totalRow] = await Promise.all([
        db.query.ticketMessage.findMany({
          where: msgWhere,
          orderBy: [asc(ticketMessage.createdAt)],
          limit: input.limit,
          offset: input.offset,
          with: messageWithRelations,
        }),
        db.select({ n: count(ticketMessage.id) }).from(ticketMessage).where(msgWhere),
      ]);

      return {
        messages: messages.map(transformTicketMessage),
        total: Number(totalRow[0]?.n ?? 0),
      };
    }),

  // Create a new message
  createMessage: protectedProcedure
    .input(createMessageInputSchema)
    .output(ticketMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const ticketConds = [eq(ticket.id, input.ticketId)];
      if (!isAgency) {
        ticketConds.push(eq(ticket.createdById, sessionUser.id));
      }

      const [ticketRow] = await db
        .select()
        .from(ticket)
        .where(and(...ticketConds))
        .limit(1);

      if (!ticketRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (input.isInternal && !isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can send internal messages",
        });
      }

      const result = await db.transaction(async (tx) => {
        const now = new Date();
        const messageId = randomUUID();

        const [messageRow] = await tx
          .insert(ticketMessage)
          .values({
            id: messageId,
            ticketId: input.ticketId,
            senderId: sessionUser.id,
            content: input.content,
            isInternal: input.isInternal,
            isSystem: false,
            readStatus: "SENT",
            readAt: null,
            metadata: null,
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            deletedAt: null,
          })
          .returning();

        if (!messageRow) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create message",
          });
        }

        if (input.attachments && input.attachments.length > 0) {
          await tx.insert(ticketAttachment).values(
            input.attachments.map((att) => ({
              id: randomUUID(),
              ticketId: input.ticketId,
              messageId: messageRow.id,
              uploadedById: sessionUser.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
              fileUrl: att.fileUrl,
              storageKey: att.storageKey ?? null,
              description: null,
              metadata: null,
              createdAt: now,
            })),
          );
        }

        const preview =
          input.content.length > 100 ? `${input.content.substring(0, 100)}...` : input.content;
        const isInternal = input.isInternal === true;

        const ticketUpdate: Record<string, unknown> = {
          updatedAt: now,
          lastResponseAt: now,
        };

        if (!isInternal) {
          ticketUpdate.lastMessageId = messageRow.id;
          ticketUpdate.lastMessageAt = now;
          ticketUpdate.lastMessagePreview = preview;
        }

        if (isAgency && !isInternal) {
          ticketUpdate.customerUnreadCount = ticketRow.customerUnreadCount + 1;
        } else if (!isAgency) {
          ticketUpdate.unreadCount = ticketRow.unreadCount + 1;
        }

        if (ticketRow.firstResponseAt === null && isAgency && !isInternal) {
          ticketUpdate.firstResponseAt = now;
        }
        if (isAgency && !isInternal) {
          ticketUpdate.lastAgentResponseAt = now;
        } else if (!isAgency) {
          ticketUpdate.lastCustomerResponseAt = now;
        }
        if (ticketRow.status === "OPEN" && isAgency && !isInternal) {
          ticketUpdate.status = "IN_PROGRESS";
        }
        if (ticketRow.status === "WAITING" && !isAgency) {
          ticketUpdate.status = "IN_PROGRESS";
        }

        await tx.update(ticket).set(ticketUpdate as any).where(eq(ticket.id, input.ticketId));

        await logTicketActivity(
          input.ticketId,
          sessionUser.id,
          "MESSAGE",
          "New message sent",
          null,
          { messageId: messageRow.id, isInternal: input.isInternal },
        );

        const messageWithAttachments = await tx.query.ticketMessage.findFirst({
          where: eq(ticketMessage.id, messageRow.id),
          with: messageWithRelations,
        });

        return messageWithAttachments!;
      });

      return transformTicketMessage(result);
    }),

  // Mark message as read
  markMessageRead: protectedProcedure
    .input(markMessageReadInputSchema)
    .output(ticketMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const message = await db.query.ticketMessage.findFirst({
        where: eq(ticketMessage.id, input.messageId),
        with: {
          ticket: {
            columns: {
              id: true,
              createdById: true,
              assignedToId: true,
              unreadCount: true,
              customerUnreadCount: true,
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);
      const hasAccess = isAgency
        ? message.ticket.assignedToId === sessionUser.id || message.ticket.assignedToId === null
        : message.ticket.createdById === sessionUser.id;

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this ticket",
        });
      }

      const updatedMessage = await db.transaction(async (tx) => {
        const now = new Date();
        await tx
          .update(ticketMessage)
          .set({
            readStatus: input.readStatus,
            readAt: input.readStatus === "READ" ? now : null,
            updatedAt: now,
          })
          .where(eq(ticketMessage.id, input.messageId));

        if (input.readStatus === "READ") {
          const t = message.ticket;
          await tx
            .update(ticket)
            .set(
              isAgency
                ? {
                    unreadCount: Math.max(0, t.unreadCount - 1),
                    updatedAt: now,
                  }
                : {
                    customerUnreadCount: Math.max(0, t.customerUnreadCount - 1),
                    updatedAt: now,
                  },
            )
            .where(eq(ticket.id, t.id));
        }

        const msg = await tx.query.ticketMessage.findFirst({
          where: eq(ticketMessage.id, input.messageId),
          with: messageWithRelations,
        });

        if (!msg) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found",
          });
        }

        return msg;
      });

      return transformTicketMessage(updatedMessage);
    }),

  // Assign ticket to user
  assign: protectedProcedure
    .input(assignTicketInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      if (!isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can assign tickets",
        });
      }

      const [existingTicket] = await db
        .select()
        .from(ticket)
        .where(eq(ticket.id, input.ticketId))
        .limit(1);

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (input.assignedToId) {
        const [assignedUser] = await db
          .select({ id: user.id, role: user.role })
          .from(user)
          .where(eq(user.id, input.assignedToId))
          .limit(1);

        if (!assignedUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assigned user not found",
          });
        }

        if (!assignedUser.role?.includes("AGENCY")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only assign tickets to agency users",
          });
        }
      }

      const now = new Date();
      await db
        .update(ticket)
        .set({ assignedToId: input.assignedToId, updatedAt: now })
        .where(eq(ticket.id, input.ticketId));

      await logTicketActivity(
        input.ticketId,
        sessionUser.id,
        "ASSIGN",
        input.assignedToId
          ? `Ticket assigned to user ${input.assignedToId}`
          : "Ticket unassigned",
        { assignedToId: existingTicket.assignedToId },
        { assignedToId: input.assignedToId },
      );

      const updatedRow = await db.query.ticket.findFirst({
        where: eq(ticket.id, input.ticketId),
        with: ticketWithRelations,
      });

      if (!updatedRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      return transformTicket(updatedRow);
    }),

  // Update ticket status
  updateStatus: protectedProcedure
    .input(updateTicketStatusInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const role = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(role);

      const accessConds = [eq(ticket.id, input.ticketId)];
      if (!isAgency) {
        accessConds.push(eq(ticket.createdById, sessionUser.id));
      }

      const [existingTicket] = await db
        .select()
        .from(ticket)
        .where(and(...accessConds))
        .limit(1);

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "RESOLVED" && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (input.status === "CLOSED" && !existingTicket.closedAt) {
        updateData.closedAt = new Date();
      }

      await db.update(ticket).set(updateData as any).where(eq(ticket.id, input.ticketId));

      await logTicketActivity(
        input.ticketId,
        sessionUser.id,
        "STATUS_CHANGE",
        `Ticket status changed to ${input.status}`,
        { status: existingTicket.status },
        { status: input.status },
      );

      const updatedRow = await db.query.ticket.findFirst({
        where: eq(ticket.id, input.ticketId),
        with: ticketWithRelations,
      });

      if (!updatedRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      return transformTicket(updatedRow);
    }),

  // Archive ticket (soft delete by setting status to CLOSED)
  archive: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      if (!isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can archive tickets",
        });
      }

      const [existingTicket] = await db
        .select()
        .from(ticket)
        .where(eq(ticket.id, input.ticketId))
        .limit(1);

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const now = new Date();
      await db
        .update(ticket)
        .set({
          status: "CLOSED",
          closedAt: now,
          updatedAt: now,
        })
        .where(eq(ticket.id, input.ticketId));

      await logTicketActivity(
        input.ticketId,
        sessionUser.id,
        "ARCHIVE",
        "Ticket archived",
        { status: existingTicket.status },
        { status: "CLOSED" },
      );

      const updatedRow = await db.query.ticket.findFirst({
        where: eq(ticket.id, input.ticketId),
        with: ticketWithRelations,
      });

      if (!updatedRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      return transformTicket(updatedRow);
    }),

  // Mark all messages in a ticket as read (WhatsApp-style)
  markAllTicketMessagesAsRead: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .output(z.object({
      markedCount: z.number(),
      ticket: ticketSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionUser = await getAuthenticatedUser(ctx);

      const userRole = await fetchUserRole(sessionUser.id);
      const isAgency = roleIsAgency(userRole);

      const ticketConds = [eq(ticket.id, input.ticketId)];
      if (!isAgency) {
        ticketConds.push(eq(ticket.createdById, sessionUser.id));
      }

      const [ticketRow] = await db
        .select({ id: ticket.id })
        .from(ticket)
        .where(and(...ticketConds))
        .limit(1);

      if (!ticketRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const result = await db.transaction(async (tx) => {
        const now = new Date();
        const unreadConds = [
          eq(ticketMessage.ticketId, input.ticketId),
          ne(ticketMessage.senderId, sessionUser.id),
          ne(ticketMessage.readStatus, "READ"),
          isNull(ticketMessage.deletedAt),
        ];
        if (!isAgency) {
          unreadConds.push(eq(ticketMessage.isInternal, false));
        }
        const unreadWhere = and(...unreadConds);

        const unreadMessages = await tx
          .select({ id: ticketMessage.id })
          .from(ticketMessage)
          .where(unreadWhere);

        if (unreadMessages.length === 0) {
          const updatedTicket = await tx.query.ticket.findFirst({
            where: eq(ticket.id, input.ticketId),
            with: ticketWithRelations,
          });

          return {
            markedCount: 0,
            ticket: updatedTicket!,
          };
        }

        await tx
          .update(ticketMessage)
          .set({
            readStatus: "READ",
            readAt: now,
            updatedAt: now,
          })
          .where(
            inArray(
              ticketMessage.id,
              unreadMessages.map((m) => m.id),
            ),
          );

        await tx
          .update(ticket)
          .set(
            isAgency
              ? { unreadCount: 0, updatedAt: now }
              : { customerUnreadCount: 0, updatedAt: now },
          )
          .where(eq(ticket.id, input.ticketId));

        const updatedTicket = await tx.query.ticket.findFirst({
          where: eq(ticket.id, input.ticketId),
          with: ticketWithRelations,
        });

        return {
          markedCount: unreadMessages.length,
          ticket: updatedTicket!,
        };
      });

      return {
        markedCount: result.markedCount,
        ticket: transformTicket(result.ticket),
      };
    }),
});
