import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gt } from "@npanel/db";
import { z } from "zod";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { notification, notificationActivityLog } from "@npanel/db/schema/notifications";
import { team } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";
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
function transformNotification(notification) {
    const result = {
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
async function getAuthenticatedUser(ctx) {
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
async function logActivity(notificationId, userId, action, description, metadata, ipAddress, userAgent) {
    await db.insert(notificationActivityLog).values({
        id: randomUUID(),
        notificationId,
        userId,
        action,
        description: description ?? null,
        metadata: metadata ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        createdAt: new Date(),
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
        const conditions = [eq(notification.userId, targetUserId)];
        if (input.teamId) {
            conditions.push(eq(notification.teamId, input.teamId));
        }
        if (input.seen !== undefined) {
            conditions.push(eq(notification.seen, input.seen));
        }
        if (input.type) {
            conditions.push(eq(notification.type, input.type));
        }
        if (input.priority) {
            conditions.push(eq(notification.priority, input.priority));
        }
        // Change detection: only fetch notifications updated after 'since' timestamp
        if (input.since) {
            try {
                const sinceDate = new Date(input.since);
                if (!isNaN(sinceDate.getTime())) {
                    conditions.push(gt(notification.updatedAt, sinceDate));
                }
            }
            catch {
                // Invalid date, ignore since parameter
                console.warn("Invalid 'since' parameter in notifications query:", input.since);
            }
        }
        const notifications = await db
            .select({
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(and(...conditions))
            .orderBy(desc(notification.createdAt))
            .limit(input.limit)
            .offset(input.offset);
        return notifications.map((n) => transformNotification({
            ...n,
            user: n.user?.id ? n.user : undefined,
            team: n.team?.id ? n.team : null,
        }));
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
        const conditions = [
            eq(notification.userId, targetUserId),
            eq(notification.seen, false),
        ];
        if (input?.teamId) {
            conditions.push(eq(notification.teamId, input.teamId));
        }
        const unseenCountRes = await db
            .select({ count: count() })
            .from(notification)
            .where(and(...conditions));
        return { count: unseenCountRes[0]?.count ?? 0 };
    }),
    // Get a single notification by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(notificationSchema)
        .query(async ({ ctx, input }) => {
        const authUser = await getAuthenticatedUser(ctx);
        const [notificationRow] = await db
            .select({
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
            userInfo: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)))
            .limit(1);
        if (!notificationRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        return transformNotification({
            ...notificationRow,
            user: notificationRow.userInfo?.id ? notificationRow.userInfo : undefined,
            team: notificationRow.team?.id ? notificationRow.team : null,
        });
    }),
    // Create a new notification (system-wide, can be called by any authenticated user)
    create: protectedProcedure
        .input(createNotificationInputSchema)
        .output(notificationSchema)
        .mutation(async ({ ctx, input }) => {
        const authenticatedUser = await getAuthenticatedUser(ctx);
        // Validate user exists
        const [targetUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, input.userId))
            .limit(1);
        if (!targetUser) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Target user not found",
            });
        }
        // Validate team if provided
        if (input.teamId) {
            const [targetTeam] = await db
                .select({ id: team.id })
                .from(team)
                .where(eq(team.id, input.teamId))
                .limit(1);
            if (!targetTeam) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }
        }
        // Batch: Create notification and log activity in a transaction
        // This reduces connection usage from 2 sequential queries to 1 transaction
        const createdNotification = await db.transaction(async (tx) => {
            const [created] = await tx
                .insert(notification)
                .values({
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
            })
                .returning({ id: notification.id });
            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create notification",
                });
            }
            // Log activity
            await tx.insert(notificationActivityLog).values({
                id: randomUUID(),
                notificationId: created.id,
                userId: authenticatedUser.id,
                action: "CREATE",
                description: `Notification created: ${input.title || input.message.substring(0, 50)}`,
                metadata: { type: input.type, priority: input.priority },
                createdAt: new Date(),
            });
            return created.id;
        });
        const [createdRow] = await db
            .select({
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(eq(notification.id, createdNotification))
            .limit(1);
        if (!createdRow) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Created notification could not be fetched",
            });
        }
        return transformNotification({
            ...createdRow,
            user: createdRow.user?.id ? createdRow.user : undefined,
            team: createdRow.team?.id ? createdRow.team : null,
        });
    }),
    // Update a notification
    update: protectedProcedure
        .input(updateNotificationInputSchema)
        .output(notificationSchema)
        .mutation(async ({ ctx, input }) => {
        const authUser = await getAuthenticatedUser(ctx);
        // Check if notification exists and user owns it
        const [existingNotification] = await db
            .select({ id: notification.id })
            .from(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)))
            .limit(1);
        if (!existingNotification) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        // Build update data
        const updateData = {
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
        await db.transaction(async (tx) => {
            await tx
                .update(notification)
                .set(updateData)
                .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)));
            // Log activity
            await tx.insert(notificationActivityLog).values({
                id: randomUUID(),
                notificationId: input.id,
                userId: authUser.id,
                action: "UPDATE",
                description: "Notification updated",
                metadata: { updatedFields: Object.keys(updateData) },
                createdAt: new Date(),
            });
        });
        const [updatedRow] = await db
            .select({
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
            userInfo: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(eq(notification.id, input.id))
            .limit(1);
        if (!updatedRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        return transformNotification({
            ...updatedRow,
            user: updatedRow.userInfo?.id ? updatedRow.userInfo : undefined,
            team: updatedRow.team?.id ? updatedRow.team : null,
        });
    }),
    // Mark notification as seen
    markAsSeen: protectedProcedure
        .input(markAsSeenInputSchema)
        .output(notificationSchema)
        .mutation(async ({ ctx, input }) => {
        const authUser = await getAuthenticatedUser(ctx);
        const [existingNotification] = await db
            .select({ id: notification.id })
            .from(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)))
            .limit(1);
        if (!existingNotification) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        // Batch: Update notification and log activity in a transaction
        // This reduces connection usage from 2 sequential queries to 1 transaction
        await db.transaction(async (tx) => {
            await tx
                .update(notification)
                .set({
                seen: true,
                readAt: new Date(),
                updatedAt: new Date(),
            })
                .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)));
            // Log activity
            await tx.insert(notificationActivityLog).values({
                id: randomUUID(),
                notificationId: input.id,
                userId: authUser.id,
                action: "MARK_SEEN",
                description: "Notification marked as seen",
                metadata: null,
                createdAt: new Date(),
            });
        });
        const [updatedRow] = await db
            .select({
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
            userInfo: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(eq(notification.id, input.id))
            .limit(1);
        if (!updatedRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        const transformed = transformNotification({
            ...updatedRow,
            user: updatedRow.userInfo?.id ? updatedRow.userInfo : undefined,
            team: updatedRow.team?.id ? updatedRow.team : null,
        });
        // Broadcast unseen count update via event
        if (typeof globalThis !== 'undefined') {
            const unseenCountRes = await db
                .select({ count: count() })
                .from(notification)
                .where(and(eq(notification.userId, authUser.id), eq(notification.seen, false)));
            const unseenCount = unseenCountRes[0]?.count ?? 0;
            const eventName = `notification:unseen_count:${authUser.id}`;
            const globalAny = globalThis;
            if (typeof globalAny.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
                globalAny.dispatchEvent(new CustomEvent(eventName, { detail: { count: unseenCount } }));
            }
        }
        return transformed;
    }),
    // Mark notification as unseen
    markAsUnseen: protectedProcedure
        .input(markAsSeenInputSchema)
        .output(notificationSchema)
        .mutation(async ({ ctx, input }) => {
        const authUser = await getAuthenticatedUser(ctx);
        const [existingNotification] = await db
            .select({ id: notification.id })
            .from(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)))
            .limit(1);
        if (!existingNotification) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        // Batch: Update notification and log activity in a transaction
        // This reduces connection usage from 2 sequential queries to 1 transaction
        await db.transaction(async (tx) => {
            await tx
                .update(notification)
                .set({
                seen: false,
                readAt: null,
                updatedAt: new Date(),
            })
                .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)));
            // Log activity
            await tx.insert(notificationActivityLog).values({
                id: randomUUID(),
                notificationId: input.id,
                userId: authUser.id,
                action: "MARK_UNSEEN",
                description: "Notification marked as unseen",
                metadata: null,
                createdAt: new Date(),
            });
        });
        const [updatedRow] = await db
            .select({
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
            userInfo: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        })
            .from(notification)
            .leftJoin(user, eq(notification.userId, user.id))
            .leftJoin(team, eq(notification.teamId, team.id))
            .where(eq(notification.id, input.id))
            .limit(1);
        if (!updatedRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        return transformNotification({
            ...updatedRow,
            user: updatedRow.userInfo?.id ? updatedRow.userInfo : undefined,
            team: updatedRow.team?.id ? updatedRow.team : null,
        });
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
        const conditions = [
            eq(notification.userId, targetUserId),
            eq(notification.seen, false),
        ];
        if (input?.teamId) {
            conditions.push(eq(notification.teamId, input.teamId));
        }
        const targetNotifications = await db
            .select({ id: notification.id })
            .from(notification)
            .where(and(...conditions));
        const targetIds = targetNotifications.map((n) => n.id);
        if (targetIds.length === 0) {
            return { count: 0 };
        }
        await db.transaction(async (tx) => {
            await tx
                .update(notification)
                .set({
                seen: true,
                readAt: new Date(),
                updatedAt: new Date(),
            })
                .where(and(...conditions));
            await tx.insert(notificationActivityLog).values(targetIds.map((notificationId) => ({
                id: randomUUID(),
                notificationId,
                userId: authenticatedUser.id,
                action: "MARK_SEEN",
                description: "Notification marked as seen (bulk)",
                metadata: null,
                createdAt: new Date(),
            })));
        });
        return { count: targetIds.length };
    }),
    // Delete a notification
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const authUser = await getAuthenticatedUser(ctx);
        const [existingNotification] = await db
            .select({ id: notification.id })
            .from(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)))
            .limit(1);
        if (!existingNotification) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        // Log activity before deletion
        await logActivity(existingNotification.id, authUser.id, "DELETE", "Notification deleted");
        await db
            .delete(notification)
            .where(and(eq(notification.id, input.id), eq(notification.userId, authUser.id)));
        return { success: true };
    }),
});
