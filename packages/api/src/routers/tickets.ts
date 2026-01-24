import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";

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
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  return { id: user.id };
}

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  
  // Find the highest ticket number for this year
  const lastTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
  });

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
    await prisma.ticketActivityLog.create({
      data: {
        id: randomUUID(),
        ticketId,
        userId,
        action,
        description: description ?? null,
        oldValue: oldValue as any,
        newValue: newValue as any,
        metadata: metadata as any,
        createdAt: new Date(),
      } as any,
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
      const user = await getAuthenticatedUser(ctx);
      
      // Check if user is agency or customer
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      const where: any = {};

      if (isAgency) {
        // Agency users see tickets assigned to them or unassigned
        if (input.assignedToId) {
          where.assignedToId = input.assignedToId;
        } else {
          // Show all tickets (can be filtered by status, priority, etc.)
        }
      } else {
        // Customer users see only their own tickets
        where.createdById = user.id;
        if (input.teamId) {
          where.teamId = input.teamId;
        }
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.priority) {
        where.priority = input.priority;
      }

      if (input.type) {
        where.type = input.type;
      }

      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      return tickets.map(ticket => transformTicketListItem(ticket, isAgency));
    }),

  // Get single ticket by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(ticketSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      const where: any = {
        id: input.id,
      };

      if (!isAgency) {
        // Customer can only see their own tickets
        where.createdById = user.id;
      }

      const ticket = await prisma.ticket.findFirst({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return transformTicket(ticket);
    }),

  // Create new ticket
  create: protectedProcedure
    .input(createTicketInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const ticketNumber = await generateTicketNumber();

      const ticket = await prisma.$transaction(async (tx) => {
        const newTicket = await tx.ticket.create({
          data: {
            id: randomUUID(),
            ticketNumber,
            subject: input.subject ?? null,
            description: input.description ?? null,
            type: input.type,
            priority: input.priority,
            status: "OPEN",
            source: input.source,
            createdById: user.id,
            teamId: input.teamId ?? null,
            assignedToId: null,
            lastMessageId: null,
            lastMessageAt: null,
            lastMessagePreview: null,
            unreadCount: 0,
            customerUnreadCount: 0,
            metadata: input.metadata as any,
            internalNotes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Log activity
        await logTicketActivity(
          newTicket.id,
          user.id,
          "CREATE",
          `Ticket ${ticketNumber} created`,
          null,
          { status: "OPEN", type: input.type, priority: input.priority },
        );

        return newTicket;
      });

      return transformTicket(ticket);
    }),

  // Update ticket
  update: protectedProcedure
    .input(updateTicketInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      const existingTicket = await prisma.ticket.findFirst({
        where: {
          id: input.id,
          ...(isAgency ? {} : { createdById: user.id }), // Agency can update any, customer only their own
        },
      });

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      const oldValues: any = {};

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
        
        // Update timestamps based on status
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
        // Only agency can update internal notes
        oldValues.internalNotes = existingTicket.internalNotes;
        updateData.internalNotes = input.internalNotes;
      }
      if (input.metadata !== undefined) {
        oldValues.metadata = existingTicket.metadata;
        updateData.metadata = input.metadata as any;
      }

      const updatedTicket = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.update({
          where: { id: input.id },
          data: updateData,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Log activity
        await logTicketActivity(
          ticket.id,
          user.id,
          "UPDATE",
          "Ticket updated",
          oldValues,
          updateData,
        );

        return ticket;
      });

      return transformTicket(updatedTicket);
    }),

  // Get messages for a ticket
  getMessages: protectedProcedure
    .input(getTicketMessagesInputSchema)
    .output(z.object({
      messages: z.array(ticketMessageSchema),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      // Verify ticket access
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          ...(isAgency ? {} : { createdById: user.id }), // Agency can see all, customer only their own
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const where: any = {
        ticketId: input.ticketId,
        deletedAt: null,
      };

      // Filter out internal messages for customers
      if (!isAgency) {
        where.isInternal = false;
      }

      const [messages, total] = await Promise.all([
        prisma.ticketMessage.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                fileUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.ticketMessage.count({ where }),
      ]);

      return {
        messages: messages.map(transformTicketMessage),
        total,
      };
    }),

  // Create a new message
  createMessage: protectedProcedure
    .input(createMessageInputSchema)
    .output(ticketMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      // Verify ticket access
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          ...(isAgency ? {} : { createdById: user.id }), // Agency can message any, customer only their own
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Customers cannot send internal messages
      if (input.isInternal && !isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can send internal messages",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create message
        const message = await tx.ticketMessage.create({
          data: {
            id: randomUUID(),
            ticketId: input.ticketId,
            senderId: user.id,
            content: input.content,
            isInternal: input.isInternal,
            isSystem: false,
            readStatus: "SENT",
            readAt: null,
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            editedAt: null,
            deletedAt: null,
          } as any,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                fileUrl: true,
              },
            },
          },
        });

        // Create attachments if provided
        if (input.attachments && input.attachments.length > 0) {
          await tx.ticketAttachment.createMany({
            data: input.attachments.map(att => ({
              id: randomUUID(),
              ticketId: input.ticketId,
              messageId: message.id,
              uploadedById: user.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
              fileUrl: att.fileUrl,
              storageKey: att.storageKey ?? null,
              description: null,
              metadata: null,
              createdAt: new Date(),
            })) as any,
          });
        }

        // Update ticket metadata
        // For internal messages: do NOT update lastMessage* (customers never see them; list would
        // show internal as "last" but getMessages excludes internal, so the chat would not show it)
        const preview = input.content.length > 100 
          ? input.content.substring(0, 100) + "..."
          : input.content;

        const isInternal = input.isInternal === true;

        await tx.ticket.update({
          where: { id: input.ticketId },
          data: {
            updatedAt: new Date(),
            lastResponseAt: new Date(),
            // Only update last-message fields for customer-visible (non-internal) messages
            ...(isInternal
              ? {}
              : {
                  lastMessageId: message.id,
                  lastMessageAt: new Date(),
                  lastMessagePreview: preview,
                }
            ),
            // Unread: customers must not be notified for internal messages
            ...(isAgency && !isInternal
              ? { customerUnreadCount: { increment: 1 } }
              : !isAgency
              ? { unreadCount: { increment: 1 } }
              : {}
            ),
            // First response / agent response only for customer-visible messages
            ...(ticket.firstResponseAt === null && isAgency && !isInternal
              ? { firstResponseAt: new Date() }
              : {}
            ),
            ...(isAgency && !isInternal
              ? { lastAgentResponseAt: new Date() }
              : !isAgency
              ? { lastCustomerResponseAt: new Date() }
              : {}
            ),
            // Move to IN_PROGRESS only when agency sends a real (non-internal) reply
            ...(ticket.status === "OPEN" && isAgency && !isInternal
              ? { status: "IN_PROGRESS" }
              : {}
            ),
            ...(ticket.status === "WAITING" && !isAgency
              ? { status: "IN_PROGRESS" }
              : {}
            ),
          } as any,
        });

        // Log activity
        await logTicketActivity(
          input.ticketId,
          user.id,
          "MESSAGE",
          "New message sent",
          null,
          { messageId: message.id, isInternal: input.isInternal },
        );

        // Reload message with attachments
        const messageWithAttachments = await tx.ticketMessage.findUnique({
          where: { id: message.id },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                fileUrl: true,
              },
            },
          },
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
      const user = await getAuthenticatedUser(ctx);

      const message = await prisma.ticketMessage.findFirst({
        where: {
          id: input.messageId,
        },
        include: {
          ticket: {
            select: {
              id: true,
              createdById: true,
              assignedToId: true,
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

      // Verify user has access to this ticket
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;
      const hasAccess = isAgency 
        ? message.ticket.assignedToId === user.id || message.ticket.assignedToId === null
        : message.ticket.createdById === user.id;

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this ticket",
        });
      }

      const updatedMessage = await prisma.$transaction(async (tx) => {
        const msg = await tx.ticketMessage.update({
          where: { id: input.messageId },
          data: {
            readStatus: input.readStatus,
            readAt: input.readStatus === "READ" ? new Date() : null,
            updatedAt: new Date(),
          } as any,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                fileUrl: true,
              },
            },
          },
        });

        // Update ticket unread count
        if (input.readStatus === "READ") {
          await tx.ticket.update({
            where: { id: message.ticket.id },
            data: {
              ...(isAgency
                ? { unreadCount: { decrement: 1 } }
                : { customerUnreadCount: { decrement: 1 } }
              ),
            } as any,
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
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      if (!isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can assign tickets",
        });
      }

      const existingTicket = await prisma.ticket.findFirst({
        where: { id: input.ticketId },
      });

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Verify assigned user exists and is agency
      if (input.assignedToId) {
        const assignedUser = await prisma.user.findUnique({
          where: { id: input.assignedToId },
          select: { id: true, role: true },
        });

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

      const updatedTicket = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.update({
          where: { id: input.ticketId },
          data: {
            assignedToId: input.assignedToId,
            updatedAt: new Date(),
          } as any,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Log activity
        await logTicketActivity(
          ticket.id,
          user.id,
          "ASSIGN",
          input.assignedToId 
            ? `Ticket assigned to user ${input.assignedToId}`
            : "Ticket unassigned",
          { assignedToId: existingTicket.assignedToId },
          { assignedToId: input.assignedToId },
        );

        return ticket;
      });

      return transformTicket(updatedTicket);
    }),

  // Update ticket status
  updateStatus: protectedProcedure
    .input(updateTicketStatusInputSchema)
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      const existingTicket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          ...(isAgency ? {} : { createdById: user.id }), // Agency can update any, customer only their own
        },
      });

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      // Update timestamps based on status
      if (input.status === "RESOLVED" && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (input.status === "CLOSED" && !existingTicket.closedAt) {
        updateData.closedAt = new Date();
      }

      const updatedTicket = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.update({
          where: { id: input.ticketId },
          data: updateData,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Log activity
        await logTicketActivity(
          ticket.id,
          user.id,
          "STATUS_CHANGE",
          `Ticket status changed to ${input.status}`,
          { status: existingTicket.status },
          { status: input.status },
        );

        return ticket;
      });

      return transformTicket(updatedTicket);
    }),

  // Archive ticket (soft delete by setting status to CLOSED)
  archive: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .output(ticketSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const isAgency = userRecord?.role?.includes("AGENCY") ?? false;

      if (!isAgency) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can archive tickets",
        });
      }

      const existingTicket = await prisma.ticket.findFirst({
        where: { id: input.ticketId },
      });

      if (!existingTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      const updatedTicket = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.update({
          where: { id: input.ticketId },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
            updatedAt: new Date(),
          } as any,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Log activity
        await logTicketActivity(
          ticket.id,
          user.id,
          "ARCHIVE",
          "Ticket archived",
          { status: existingTicket.status },
          { status: "CLOSED" },
        );

        return ticket;
      });

      return transformTicket(updatedTicket);
    }),
});
