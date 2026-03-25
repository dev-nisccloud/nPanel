import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@npanel/db";
import { randomUUID } from "node:crypto";

// ============================================================================
// TYPESCRIPT TYPES - Independent from Prisma, mirroring database structure
// ============================================================================

// Notification type enums as TypeScript types
type NotificationTypeType = 
  | "SYSTEM" 
  | "USER" 
  | "TEAM" 
  | "ORDER" 
  | "PAYMENT" 
  | "INVOICE" 
  | "DOMAIN" 
  | "HOSTING" 
  | "CREATIVE_BRIEF" 
  | "CREATIVE_ASSET" 
  | "SOCIAL_MEDIA" 
  | "EMAIL_MARKETING" 
  | "AD_CAMPAIGN" 
  | "GENERAL";

type NotificationPriorityType = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// Database model types (matching Prisma schema structure but independent)
interface DbUser {
  id: string;
  name: string;
  email: string;
}

interface DbTeam {
  id: string;
  name: string;
  slug: string;
}

interface DbNotification {
  id: string;
  userId: string;
  teamId: string | null;
  type: NotificationTypeType;
  priority: NotificationPriorityType;
  title: string | null;
  message: string;
  link: string | null;
  metadata: unknown | null;
  seen: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: DbUser;
  team?: DbTeam | null;
}

// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================

// Response schema
const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  type: z.enum([
    "SYSTEM",
    "USER",
    "TEAM",
    "ORDER",
    "PAYMENT",
    "INVOICE",
    "DOMAIN",
    "HOSTING",
    "CREATIVE_BRIEF",
    "CREATIVE_ASSET",
    "SOCIAL_MEDIA",
    "EMAIL_MARKETING",
    "AD_CAMPAIGN",
    "GENERAL",
  ]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  title: z.string().nullable(),
  message: z.string(),
  link: z.string().nullable(),
  metadata: z.unknown().nullable(),
  seen: z.boolean(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
});

// Input schemas
const createNotificationInputSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().optional(),
  type: z.enum([
    "SYSTEM",
    "USER",
    "TEAM",
    "ORDER",
    "PAYMENT",
    "INVOICE",
    "DOMAIN",
    "HOSTING",
    "CREATIVE_BRIEF",
    "CREATIVE_ASSET",
    "SOCIAL_MEDIA",
    "EMAIL_MARKETING",
    "AD_CAMPAIGN",
    "GENERAL",
  ]).default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  title: z.string().optional(),
  message: z.string().min(1),
  link: z.string().optional(),
  metadata: z.unknown().optional(),
});

const updateNotificationInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  message: z.string().min(1).optional(),
  link: z.string().optional(),
  metadata: z.unknown().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

const markAsSeenInputSchema = z.object({
  id: z.string(),
});

const markAllAsSeenInputSchema = z.object({
  userId: z.string().optional(), // If not provided, uses authenticated user
  teamId: z.string().optional(),
});

const getNotificationsInputSchema = z.object({
  userId: z.string().optional(), // If not provided, uses authenticated user
  teamId: z.string().optional(),
  seen: z.boolean().optional(),
  type: z.enum([
    "SYSTEM",
    "USER",
    "TEAM",
    "ORDER",
    "PAYMENT",
    "INVOICE",
    "DOMAIN",
    "HOSTING",
    "CREATIVE_BRIEF",
    "CREATIVE_ASSET",
    "SOCIAL_MEDIA",
    "EMAIL_MARKETING",
    "AD_CAMPAIGN",
    "GENERAL",
  ]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  since: z.string().optional(), // ISO timestamp for change detection - only fetch notifications updated after this time
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

// ============================================================================
// TRANSFORM FUNCTIONS - Convert DB types to API response types
// ============================================================================

function transformNotification(notification: DbNotification) {
  const result: {
    id: string;
    userId: string;
    teamId: string | null;
    type: NotificationTypeType;
    priority: NotificationPriorityType;
    title: string | null;
    message: string;
    link: string | null;
    metadata: unknown | null;
    seen: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: string; name: string; email: string };
    team?: { id: string; name: string; slug: string } | null;
  } = {
    id: notification.id,
    userId: notification.userId,
    teamId: notification.teamId,
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    metadata: notification.metadata,
    seen: notification.seen,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };

  if (notification.user) {
    result.user = {
      id: notification.user.id,
      name: notification.user.name,
      email: notification.user.email,
    };
  }

  if (notification.team !== undefined) {
    result.team = notification.team ? {
      id: notification.team.id,
      name: notification.team.name,
      slug: notification.team.slug,
    } : null;
  }

  return result;
}

/**
 * Get authenticated user - optimized to use session data
 * Only queries database to verify user exists if needed
 */
async function getAuthenticatedUser(ctx: { session: { user?: { id: string } } | null }) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  // Optimize: If user.id is in session, we can trust it (set by auth hooks)
  // Only need to verify user exists if we're doing additional validation
  // For most cases, we can just return the session user id
  // If we need to verify existence, we can query, but it's usually not necessary
  // since the session is already authenticated by the auth middleware
  
  // Return session user id directly - no need to query database
  // The session is already validated by the auth middleware
  return { id: user.id };
}

// Helper to log activity
async function logActivity(
  notificationId: string,
  userId: string,
  action: string,
  description?: string | null,
  metadata?: unknown,
  ipAddress?: string | null,
  userAgent?: string | null,
) {
  await prisma.notificationActivityLog.create({
    data: {
      id: randomUUID(),
      notificationId,
      userId,
      action,
      description: description ?? null,
      metadata: metadata ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      createdAt: new Date(),
    } as any, // Type assertion for JsonValue compatibility
  });
}

export const notificationsRouter = router({
  // Get all notifications for the authenticated user (or specified user/team)
  getAll: protectedProcedure
    .input(getNotificationsInputSchema)
    .output(z.array(notificationSchema))
    .query(async ({ ctx, input }) => {
      const authenticatedUser = await getAuthenticatedUser(ctx);
      
      // Use input userId if provided, otherwise use authenticated user
      const targetUserId = input.userId || authenticatedUser.id;

      // Build where clause
      const where: any = {
        userId: targetUserId,
      };

      if (input.teamId) {
        where.teamId = input.teamId;
      }

      if (input.seen !== undefined) {
        where.seen = input.seen;
      }

      if (input.type) {
        where.type = input.type;
      }

      if (input.priority) {
        where.priority = input.priority;
      }

      // Change detection: only fetch notifications updated after 'since' timestamp
      if (input.since) {
        try {
          const sinceDate = new Date(input.since);
          if (!isNaN(sinceDate.getTime())) {
            where.updatedAt = {
              gt: sinceDate,
            };
          }
        } catch (error) {
          // Invalid date, ignore since parameter
          console.warn("Invalid 'since' parameter in notifications query:", input.since);
        }
      }

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          user: {
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
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      return notifications.map(transformNotification);
    }),

  // Get unseen notifications count
  getUnseenCount: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      teamId: z.string().optional(),
    }).optional())
    .output(z.object({
      count: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const authenticatedUser = await getAuthenticatedUser(ctx);
      const targetUserId = input?.userId || authenticatedUser.id;

      const where: any = {
        userId: targetUserId,
        seen: false,
      };

      if (input?.teamId) {
        where.teamId = input.teamId;
      }

      const count = await prisma.notification.count({
        where,
      });

      return { count };
    }),

  // Get a single notification by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(notificationSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const notification = await prisma.notification.findFirst({
        where: {
          id: input.id,
          userId: user.id, // Ensure user owns the notification
        },
        include: {
          user: {
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
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      return transformNotification(notification);
    }),

  // Create a new notification (system-wide, can be called by any authenticated user)
  create: protectedProcedure
    .input(createNotificationInputSchema)
    .output(notificationSchema)
    .mutation(async ({ ctx, input }) => {
      const authenticatedUser = await getAuthenticatedUser(ctx);

      // Validate user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found",
        });
      }

      // Validate team if provided
      if (input.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
          select: { id: true },
        });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }
      }

      // Batch: Create notification and log activity in a transaction
      // This reduces connection usage from 2 sequential queries to 1 transaction
      const notification = await prisma.$transaction(async (tx) => {
        const notification = await tx.notification.create({
          data: {
            id: randomUUID(),
            userId: input.userId,
            teamId: input.teamId ?? null,
            type: input.type,
            priority: input.priority,
            title: input.title ?? null,
            message: input.message,
            link: input.link ?? null,
            metadata: input.metadata ?? null,
            seen: false,
            readAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any, // Type assertion for JsonValue compatibility
          include: {
            user: {
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
          },
        });

        // Log activity
        await tx.notificationActivityLog.create({
          data: {
            id: randomUUID(),
            notificationId: notification.id,
            userId: authenticatedUser.id,
            action: "CREATE",
            description: `Notification created: ${input.title || input.message.substring(0, 50)}`,
            metadata: { type: input.type, priority: input.priority } as any,
            createdAt: new Date(),
          } as any,
        });

        return notification;
      });

      return transformNotification(notification);
    }),

  // Update a notification
  update: protectedProcedure
    .input(updateNotificationInputSchema)
    .output(notificationSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      // Check if notification exists and user owns it
      const existingNotification = await prisma.notification.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!existingNotification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Build update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.message !== undefined) {
        updateData.message = input.message;
      }
      if (input.link !== undefined) {
        updateData.link = input.link;
      }
      if (input.metadata !== undefined) {
        updateData.metadata = input.metadata;
      }
      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      // Batch: Update notification and log activity in a transaction
      // This reduces connection usage from 2 sequential queries to 1 transaction
      const notification = await prisma.$transaction(async (tx) => {
        const notification = await tx.notification.update({
          where: { id: input.id },
          data: updateData,
          include: {
            user: {
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
          },
        });

        // Log activity
        await tx.notificationActivityLog.create({
          data: {
            id: randomUUID(),
            notificationId: notification.id,
            userId: user.id,
            action: "UPDATE",
            description: "Notification updated",
            metadata: { updatedFields: Object.keys(updateData) } as any,
            createdAt: new Date(),
          } as any,
        });

        return notification;
      });

      return transformNotification(notification);
    }),

  // Mark notification as seen
  markAsSeen: protectedProcedure
    .input(markAsSeenInputSchema)
    .output(notificationSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const notification = await prisma.notification.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Batch: Update notification and log activity in a transaction
      // This reduces connection usage from 2 sequential queries to 1 transaction
      const updatedNotification = await prisma.$transaction(async (tx) => {
        const notification = await tx.notification.update({
          where: { id: input.id },
          data: {
            seen: true,
            readAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            user: {
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
          },
        });

        // Log activity
        await tx.notificationActivityLog.create({
          data: {
            id: randomUUID(),
            notificationId: notification.id,
            userId: user.id,
            action: "MARK_SEEN",
            description: "Notification marked as seen",
            metadata: null,
            createdAt: new Date(),
          } as any,
        });

        return notification;
      });

      const transformed = transformNotification(updatedNotification);

      // Broadcast unseen count update via event
      if (typeof globalThis !== 'undefined') {
        const unseenCount = await prisma.notification.count({
          where: {
            userId: user.id,
            seen: false,
          },
        });
        const eventName = `notification:unseen_count:${user.id}`;
        if (globalThis.dispatchEvent) {
          globalThis.dispatchEvent(new CustomEvent(eventName, { detail: { count: unseenCount } }));
        }
      }

      return transformed;
    }),

  // Mark notification as unseen
  markAsUnseen: protectedProcedure
    .input(markAsSeenInputSchema)
    .output(notificationSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const notification = await prisma.notification.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Batch: Update notification and log activity in a transaction
      // This reduces connection usage from 2 sequential queries to 1 transaction
      const updatedNotification = await prisma.$transaction(async (tx) => {
        const notification = await tx.notification.update({
          where: { id: input.id },
          data: {
            seen: false,
            readAt: null,
            updatedAt: new Date(),
          },
          include: {
            user: {
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
          },
        });

        // Log activity
        await tx.notificationActivityLog.create({
          data: {
            id: randomUUID(),
            notificationId: notification.id,
            userId: user.id,
            action: "MARK_UNSEEN",
            description: "Notification marked as unseen",
            metadata: null,
            createdAt: new Date(),
          } as any,
        });

        return notification;
      });

      return transformNotification(updatedNotification);
    }),

  // Mark all notifications as seen
  markAllAsSeen: protectedProcedure
    .input(markAllAsSeenInputSchema)
    .output(z.object({
      count: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const authenticatedUser = await getAuthenticatedUser(ctx);
      const targetUserId = input?.userId || authenticatedUser.id;

      const where: any = {
        userId: targetUserId,
        seen: false,
      };

      if (input?.teamId) {
        where.teamId = input.teamId;
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          seen: true,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Batch: Log activity for all notifications in a transaction
      // This reduces connection usage from N sequential queries to 1 transaction
      const notifications = await prisma.notification.findMany({
        where,
        select: { id: true },
      });

      if (notifications.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.notificationActivityLog.createMany({
            data: notifications.map(notification => ({
              id: randomUUID(),
              notificationId: notification.id,
              userId: authenticatedUser.id,
              action: "MARK_SEEN",
              description: "Notification marked as seen (bulk)",
              metadata: null,
              createdAt: new Date(),
            })) as any,
          });
        });
      }

      return { count: result.count };
    }),

  // Delete a notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const notification = await prisma.notification.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Log activity before deletion
      await logActivity(
        notification.id,
        user.id,
        "DELETE",
        "Notification deleted",
      );

      await prisma.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
