import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, inArray, or } from '@npanel/db';
import { randomUUID } from 'node:crypto';
import { db } from '@npanel/db';
import { user } from '@npanel/db/schema/auth';
import { metaContentCalendar, metaContentCalendarActivityLog, metaContentCalendarMedia, socialMediaPageToken, } from '@npanel/db/schema/social-media-marketing';
import { teamMember } from '@npanel/db/schema/teams';
import { router, protectedProcedure } from '../../../trpc';
import { schedulePublish, cancelPublish, reschedulePublish, } from '../../../lib/qstash/content-calendar';
// ============================================================================
// INDEPENDENT API LAYER SCHEMAS - Not shared with database layer
// ============================================================================
// Enums for API layer (independent from database enums)
const MetaContentCalendarStatusEnum = z.enum([
    'SCHEDULED',
    'PUBLISHED',
    'FAILED',
    'CANCELLED',
    'DRAFT',
]);
const MetaContentMediaTypeEnum = z.enum(['PHOTO', 'VIDEO']);
// Media item schema
const MediaItemSchema = z.object({
    mediaType: MetaContentMediaTypeEnum,
    url: z.string().url('Media URL must be a valid URL'),
    fileName: z.string().optional(),
    fileSize: z.number().int().min(0).optional(),
    caption: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().min(0).optional().default(0),
});
// Create calendar post input schema
const CreateCalendarPostInputSchema = z.object({
    pageTokenId: z.string().min(1, 'Page token ID is required'),
    message: z.string().optional(),
    // Accept both Date objects and date strings (tRPC serializes Date to string)
    scheduledPublishTime: z.coerce.date(),
    mediaItems: z.array(MediaItemSchema).optional(),
}).refine((data) => {
    // Validate: must have at least message or media items
    if (!data.message && (!data.mediaItems || data.mediaItems.length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Either message or at least one media item must be provided',
}).refine((data) => {
    // Validate: cannot have both photos and videos
    if (!data.mediaItems || data.mediaItems.length === 0) {
        return true;
    }
    const hasPhotos = data.mediaItems.some((item) => item.mediaType === 'PHOTO');
    const hasVideos = data.mediaItems.some((item) => item.mediaType === 'VIDEO');
    return !(hasPhotos && hasVideos);
}, {
    message: 'Cannot have both photos and videos in the same post',
}).refine((data) => {
    // Validate: only one video allowed
    if (!data.mediaItems || data.mediaItems.length === 0) {
        return true;
    }
    const videoCount = data.mediaItems.filter((item) => item.mediaType === 'VIDEO').length;
    return videoCount <= 1;
}, {
    message: 'Only one video is allowed per post',
});
// Update calendar post input schema
const UpdateCalendarPostInputSchema = z.object({
    id: z.string().min(1, 'Post ID is required'),
    message: z.string().optional(),
    // Accept both Date objects and date strings (tRPC serializes Date to string)
    scheduledPublishTime: z.coerce.date().optional(),
    status: MetaContentCalendarStatusEnum.optional(),
    mediaItems: z.array(MediaItemSchema).optional(),
}).refine((data) => {
    // Validate: if mediaItems provided, cannot have both photos and videos
    if (!data.mediaItems || data.mediaItems.length === 0) {
        return true;
    }
    const hasPhotos = data.mediaItems.some((item) => item.mediaType === 'PHOTO');
    const hasVideos = data.mediaItems.some((item) => item.mediaType === 'VIDEO');
    return !(hasPhotos && hasVideos);
}, {
    message: 'Cannot have both photos and videos in the same post',
}).refine((data) => {
    // Validate: only one video allowed
    if (!data.mediaItems || data.mediaItems.length === 0) {
        return true;
    }
    const videoCount = data.mediaItems.filter((item) => item.mediaType === 'VIDEO').length;
    return videoCount <= 1;
}, {
    message: 'Only one video is allowed per post',
});
// Get calendar posts input schema
const GetCalendarPostsInputSchema = z.object({
    pageTokenId: z.string().optional(),
    status: MetaContentCalendarStatusEnum.optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
// Get calendar post by ID input schema
const GetCalendarPostByIdInputSchema = z.object({
    id: z.string().min(1, 'Post ID is required'),
});
// Delete calendar post input schema
const DeleteCalendarPostInputSchema = z.object({
    id: z.string().min(1, 'Post ID is required'),
});
// Media item output schema
const MediaItemOutputSchema = z.object({
    id: z.string(),
    calendarPostId: z.string(),
    mediaType: MetaContentMediaTypeEnum,
    url: z.string(),
    fileName: z.string().nullable(),
    fileSize: z.number().int().nullable(),
    caption: z.string().nullable(),
    description: z.string().nullable(),
    order: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
// Calendar post output schema
const CalendarPostOutputSchema = z.object({
    id: z.string(),
    pageTokenId: z.string().nullable(),
    pageName: z.string().nullable(), // Page name from pageToken
    message: z.string().nullable(),
    scheduledPublishTime: z.date(),
    status: MetaContentCalendarStatusEnum,
    published: z.boolean(),
    publishedAt: z.date().nullable(),
    publishedPostId: z.string().nullable(),
    publishedPermalink: z.string().nullable(),
    lastError: z.string().nullable(),
    retryCount: z.number(),
    lastRetryAt: z.date().nullable(),
    createdBy: z.string(),
    creator: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        image: z.string().nullable(),
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    qstashJobId: z.string().nullable().optional(),
    mediaItems: z.array(MediaItemOutputSchema).optional(),
});
// Calendar posts list output schema
const CalendarPostsListOutputSchema = z.object({
    posts: z.array(CalendarPostOutputSchema),
    total: z.number(),
});
// Activity log output schema
const ActivityLogOutputSchema = z.object({
    id: z.string(),
    userId: z.string(),
    calendarPostId: z.string(),
    action: z.string(),
    description: z.string().nullable(),
    metadata: z.any().nullable(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.date(),
});
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Check if user is an agency/admin user
 */
function isAgencyUser(role) {
    return ['AGENCY_USER', 'AGENCY_ADMIN', 'AGENCY_SUPER_ADMIN'].includes(role);
}
/**
 * Get authenticated user - optimized to use session role when available
 * Falls back to database query if role not in session
 */
async function getAuthenticatedUser(ctx) {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
        });
    }
    const sessionRole = sessionUser.role;
    if (sessionRole) {
        return { id: sessionUser.id, role: sessionRole };
    }
    const dbUser = await db.query.user.findFirst({
        where: eq(user.id, sessionUser.id),
        columns: { id: true, role: true },
    });
    if (!dbUser) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
        });
    }
    return { id: dbUser.id, role: dbUser.role };
}
/**
 * Ensure user has access to a page token
 * - Admin users can access any page
 * - Regular users can only access pages owned by their team
 */
async function ensurePageTokenAccess(userId, role, pageTokenId) {
    const pageToken = await db.query.socialMediaPageToken.findFirst({
        where: eq(socialMediaPageToken.id, pageTokenId),
        columns: { id: true, teamId: true, platform: true },
    });
    // Ensure this is a Meta Facebook page token
    if (pageToken && pageToken.platform !== 'META_FACEBOOK') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid page token platform',
        });
    }
    if (!pageToken) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Page token not found',
        });
    }
    // Admin users can access any page
    if (isAgencyUser(role)) {
        return pageToken;
    }
    // Regular users must be team members
    if (!pageToken.teamId) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This page is not associated with any team',
        });
    }
    const membership = await db.query.teamMember.findFirst({
        where: and(eq(teamMember.teamId, pageToken.teamId), eq(teamMember.userId, userId)),
        columns: { id: true },
    });
    if (!membership) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this page',
        });
    }
    return pageToken;
}
/**
 * Ensure user has access to a calendar post
 * - Admin users can access any post
 * - Regular users can only access posts for pages owned by their team
 */
async function ensureCalendarPostAccess(userId, role, postId) {
    const post = await db.query.metaContentCalendar.findFirst({
        where: eq(metaContentCalendar.id, postId),
        columns: { id: true, pageTokenId: true, createdBy: true },
    });
    if (!post) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calendar post not found',
        });
    }
    // Admin users can access any post
    if (isAgencyUser(role)) {
        return post;
    }
    // If post has no page token, only creator can access
    if (!post.pageTokenId) {
        if (post.createdBy !== userId) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have access to this post',
            });
        }
        return post;
    }
    // Check team membership for the page
    const pageToken = await db.query.socialMediaPageToken.findFirst({
        where: eq(socialMediaPageToken.id, post.pageTokenId),
        columns: { teamId: true, platform: true },
    });
    // Ensure this is a Meta Facebook page token
    if (pageToken && pageToken.platform !== 'META_FACEBOOK') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid page token platform',
        });
    }
    if (!pageToken) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Page token not found',
        });
    }
    if (!pageToken.teamId) {
        // If page has no team, only creator can access
        if (post.createdBy !== userId) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have access to this post',
            });
        }
        return post;
    }
    // Check team membership
    const membership = await db.query.teamMember.findFirst({
        where: and(eq(teamMember.teamId, pageToken.teamId), eq(teamMember.userId, userId)),
        columns: { id: true },
    });
    if (!membership) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this post',
        });
    }
    return post;
}
/**
 * Create activity log entry
 */
async function createActivityLog(userId, calendarPostId, action, description, metadata, ipAddress, userAgent) {
    await db.insert(metaContentCalendarActivityLog).values({
        id: `activity_${randomUUID()}`,
        userId,
        calendarPostId,
        action,
        description: description ?? null,
        metadata: metadata ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        createdAt: new Date(),
    });
}
/**
 * Transform calendar post with user and page information
 */
async function transformCalendarPost(post) {
    // Fetch user information
    const author = await db.query.user.findFirst({
        where: eq(user.id, post.createdBy),
        columns: { id: true, name: true, email: true, image: true },
    });
    // Fetch page information
    let pageName = null;
    if (post.pageTokenId) {
        const pageToken = await db.query.socialMediaPageToken.findFirst({
            where: eq(socialMediaPageToken.id, post.pageTokenId),
            columns: { pageName: true, platform: true },
        });
        // Only use page name if it's a Meta Facebook page token
        if (pageToken && pageToken.platform === 'META_FACEBOOK') {
            pageName = pageToken.pageName || null;
        }
    }
    return {
        id: post.id,
        pageTokenId: post.pageTokenId,
        pageName,
        message: post.message,
        scheduledPublishTime: post.scheduledPublishTime,
        status: post.status,
        published: post.published,
        publishedAt: post.publishedAt,
        publishedPostId: post.publishedPostId,
        publishedPermalink: post.publishedPermalink,
        lastError: post.lastError,
        retryCount: post.retryCount,
        lastRetryAt: post.lastRetryAt,
        createdBy: post.createdBy,
        creator: author
            ? {
                id: author.id,
                name: author.name,
                email: author.email,
                image: author.image,
            }
            : undefined,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        qstashJobId: post.qstashJobId ?? null,
        mediaItems: post.mediaItems?.map((item) => ({
            id: item.id,
            calendarPostId: item.calendarPostId,
            mediaType: item.mediaType,
            url: item.url,
            fileName: item.fileName ?? null,
            fileSize: item.fileSize ?? null,
            caption: item.caption,
            description: item.description,
            order: item.order,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })),
    };
}
// ============================================================================
// tRPC ROUTER
// ============================================================================
export const metaContentCalendarRouter = router({
    /**
     * Create a new calendar post
     * NOTE: This endpoint ONLY saves to the database. It does NOT publish to Meta.
     * Publishing to Meta will be handled by a separate scheduler/service that runs
     * at the scheduled publish time.
     */
    create: protectedProcedure
        .input(CreateCalendarPostInputSchema)
        .output(CalendarPostOutputSchema)
        .mutation(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Ensure user has access to the page token
        await ensurePageTokenAccess(user.id, user.role, input.pageTokenId);
        // Validate scheduled time is in the future
        if (input.scheduledPublishTime <= new Date()) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Scheduled publish time must be in the future',
            });
        }
        const now = new Date();
        const postId = `calendar_${randomUUID()}`;
        await db.insert(metaContentCalendar).values({
            id: postId,
            pageTokenId: input.pageTokenId,
            message: input.message || null,
            scheduledPublishTime: input.scheduledPublishTime,
            status: 'SCHEDULED',
            published: false,
            createdBy: user.id,
            createdAt: now,
            updatedAt: now,
        });
        if (input.mediaItems && input.mediaItems.length > 0) {
            await db.insert(metaContentCalendarMedia).values(input.mediaItems.map((item, index) => ({
                id: `media_${randomUUID()}`,
                calendarPostId: postId,
                mediaType: item.mediaType,
                url: item.url,
                fileName: item.fileName || null,
                fileSize: item.fileSize || null,
                caption: item.caption || null,
                description: item.description || null,
                order: item.order ?? index,
                createdAt: now,
                updatedAt: now,
            })));
        }
        // Schedule QStash job for publishing
        let qstashJobId = null;
        try {
            const jobResult = await schedulePublish(postId, input.pageTokenId, input.scheduledPublishTime);
            qstashJobId = jobResult.messageId;
        }
        catch (error) {
            // Log error but don't fail the creation
            // The post will be created but may need manual scheduling
            console.error('Failed to schedule QStash job:', error);
            // Update post with error in lastError field
            await db
                .update(metaContentCalendar)
                .set({
                lastError: `Failed to schedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
                .where(eq(metaContentCalendar.id, postId));
        }
        // Update post with QStash job ID if scheduled successfully
        if (qstashJobId) {
            await db
                .update(metaContentCalendar)
                .set({ qstashJobId })
                .where(eq(metaContentCalendar.id, postId));
        }
        // Create activity log
        await createActivityLog(user.id, postId, 'CREATE', 'Calendar post created', {
            pageTokenId: input.pageTokenId,
            scheduledPublishTime: input.scheduledPublishTime,
            hasMedia: (input.mediaItems?.length ?? 0) > 0,
            mediaCount: input.mediaItems?.length ?? 0,
            qstashJobId,
        }, null, // IP address not available in context
        null // User agent not available in context
        );
        // Fetch created post with media items
        const createdPost = await db.query.metaContentCalendar.findFirst({
            where: eq(metaContentCalendar.id, postId),
            with: {
                mediaItems: {
                    orderBy: (m, { asc: ascCol }) => [ascCol(m.order)],
                },
            },
        });
        if (!createdPost) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create calendar post',
            });
        }
        return await transformCalendarPost(createdPost);
    }),
    /**
     * Get calendar posts with filters
     */
    getAll: protectedProcedure
        .input(GetCalendarPostsInputSchema)
        .output(CalendarPostsListOutputSchema)
        .query(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        const conditions = [];
        if (input.pageTokenId) {
            await ensurePageTokenAccess(user.id, user.role, input.pageTokenId);
            conditions.push(eq(metaContentCalendar.pageTokenId, input.pageTokenId));
        }
        else if (!isAgencyUser(user.role)) {
            const memberships = await db.query.teamMember.findMany({
                where: eq(teamMember.userId, user.id),
                columns: { teamId: true },
            });
            const teamIds = memberships.map((m) => m.teamId);
            const pageTokens = teamIds.length > 0
                ? await db.query.socialMediaPageToken.findMany({
                    where: and(inArray(socialMediaPageToken.teamId, teamIds), eq(socialMediaPageToken.platform, 'META_FACEBOOK')),
                    columns: { id: true },
                })
                : [];
            const pageTokenIds = pageTokens.map((pt) => pt.id);
            if (pageTokenIds.length === 0) {
                conditions.push(eq(metaContentCalendar.createdBy, user.id));
            }
            else {
                conditions.push(or(inArray(metaContentCalendar.pageTokenId, pageTokenIds), eq(metaContentCalendar.createdBy, user.id)));
            }
        }
        if (input.status) {
            conditions.push(eq(metaContentCalendar.status, input.status));
        }
        const whereClause = conditions.length === 0
            ? undefined
            : conditions.length === 1
                ? conditions[0]
                : and(...conditions);
        const [posts, countRows] = await Promise.all([
            db.query.metaContentCalendar.findMany({
                where: whereClause,
                with: {
                    mediaItems: {
                        orderBy: (m, { asc: ascCol }) => [ascCol(m.order)],
                    },
                },
                orderBy: [asc(metaContentCalendar.scheduledPublishTime)],
                limit: input.limit,
                offset: input.offset,
            }),
            whereClause
                ? db
                    .select({ total: count() })
                    .from(metaContentCalendar)
                    .where(whereClause)
                : db.select({ total: count() }).from(metaContentCalendar),
        ]);
        const total = Number(countRows[0]?.total ?? 0);
        const transformedPosts = await Promise.all(posts.map((calendarPost) => transformCalendarPost(calendarPost)));
        return {
            posts: transformedPosts,
            total,
        };
    }),
    /**
     * Get calendar post by ID
     */
    getById: protectedProcedure
        .input(GetCalendarPostByIdInputSchema)
        .output(CalendarPostOutputSchema)
        .query(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Ensure user has access to this post
        await ensureCalendarPostAccess(user.id, user.role, input.id);
        const calendarPost = await db.query.metaContentCalendar.findFirst({
            where: eq(metaContentCalendar.id, input.id),
            with: {
                mediaItems: {
                    orderBy: (m, { asc: ascCol }) => [ascCol(m.order)],
                },
            },
        });
        if (!calendarPost) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Calendar post not found',
            });
        }
        return await transformCalendarPost(calendarPost);
    }),
    /**
     * Update calendar post
     * NOTE: This endpoint ONLY updates the database. It does NOT interact with Meta API.
     */
    update: protectedProcedure
        .input(UpdateCalendarPostInputSchema)
        .output(CalendarPostOutputSchema)
        .mutation(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Ensure user has access to this post
        await ensureCalendarPostAccess(user.id, user.role, input.id);
        // Get existing post with QStash job ID
        const existingPost = await db.query.metaContentCalendar.findFirst({
            where: eq(metaContentCalendar.id, input.id),
            columns: {
                published: true,
                status: true,
                qstashJobId: true,
                pageTokenId: true,
                scheduledPublishTime: true,
            },
        });
        if (!existingPost) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Calendar post not found',
            });
        }
        if (existingPost.published) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot update a published post',
            });
        }
        // Validate scheduled time is in the future if provided
        if (input.scheduledPublishTime && input.scheduledPublishTime <= new Date()) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Scheduled publish time must be in the future',
            });
        }
        const updateData = {
            updatedAt: new Date(),
        };
        if (input.message !== undefined) {
            updateData.message = input.message || null;
        }
        if (input.scheduledPublishTime !== undefined) {
            updateData.scheduledPublishTime = input.scheduledPublishTime;
        }
        if (input.status !== undefined) {
            updateData.status = input.status;
        }
        // Track if media items are being updated
        const hasMediaUpdate = input.mediaItems !== undefined;
        const previousMediaCount = hasMediaUpdate
            ? Number((await db
                .select({ c: count() })
                .from(metaContentCalendarMedia)
                .where(eq(metaContentCalendarMedia.calendarPostId, input.id)))[0]?.c ?? 0)
            : 0;
        // Update media items if provided
        if (hasMediaUpdate) {
            await db
                .delete(metaContentCalendarMedia)
                .where(eq(metaContentCalendarMedia.calendarPostId, input.id));
            if (input.mediaItems && input.mediaItems.length > 0) {
                const now = new Date();
                await db.insert(metaContentCalendarMedia).values(input.mediaItems.map((item, index) => ({
                    id: `media_${randomUUID()}`,
                    calendarPostId: input.id,
                    mediaType: item.mediaType,
                    url: item.url,
                    fileName: item.fileName || null,
                    fileSize: item.fileSize || null,
                    caption: item.caption || null,
                    description: item.description || null,
                    order: item.order ?? index,
                    createdAt: now,
                    updatedAt: now,
                })));
            }
        }
        // Handle QStash job management
        let newQstashJobId = existingPost.qstashJobId || null;
        const needsReschedule = input.scheduledPublishTime !== undefined &&
            existingPost.scheduledPublishTime.getTime() !== input.scheduledPublishTime.getTime();
        const statusChanged = input.status !== undefined && input.status !== existingPost.status;
        const shouldCancel = statusChanged && (input.status === 'CANCELLED' || input.status === 'DRAFT');
        const shouldSchedule = statusChanged && input.status === 'SCHEDULED' && existingPost.status !== 'SCHEDULED';
        // Cancel job if status changed to CANCELLED or DRAFT
        if (shouldCancel && existingPost.qstashJobId) {
            try {
                await cancelPublish(existingPost.qstashJobId);
                newQstashJobId = null;
            }
            catch (error) {
                console.warn('Failed to cancel QStash job:', error);
                // Continue even if cancellation fails
            }
        }
        // Reschedule job if publish time changed
        if (needsReschedule && existingPost.pageTokenId && !shouldCancel) {
            try {
                const newScheduledTime = input.scheduledPublishTime || existingPost.scheduledPublishTime;
                const jobResult = await reschedulePublish(existingPost.qstashJobId, input.id, existingPost.pageTokenId, newScheduledTime);
                newQstashJobId = jobResult.messageId;
            }
            catch (error) {
                console.error('Failed to reschedule QStash job:', error);
                // Update post with error but continue
                updateData.lastError = `Failed to reschedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
        // Schedule new job if status changed to SCHEDULED
        if (shouldSchedule && existingPost.pageTokenId) {
            try {
                const scheduledTime = input.scheduledPublishTime || existingPost.scheduledPublishTime;
                const jobResult = await schedulePublish(input.id, existingPost.pageTokenId, scheduledTime);
                newQstashJobId = jobResult.messageId;
            }
            catch (error) {
                console.error('Failed to schedule QStash job:', error);
                updateData.lastError = `Failed to schedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
        // Update QStash job ID if changed
        if (newQstashJobId !== existingPost.qstashJobId) {
            updateData.qstashJobId = newQstashJobId;
        }
        await db
            .update(metaContentCalendar)
            .set(updateData)
            .where(eq(metaContentCalendar.id, input.id));
        // Create activity log
        // If only media items were updated (no other fields), log as ADD_MEDIA or UPDATE_MEDIA
        const hasOtherUpdates = Object.keys(updateData).length > 1; // More than just updatedAt
        if (hasMediaUpdate && !hasOtherUpdates) {
            // Only media was updated - log as ADD_MEDIA if items were added, or UPDATE_MEDIA if replaced
            const action = input.mediaItems && input.mediaItems.length > previousMediaCount
                ? 'ADD_MEDIA'
                : 'UPDATE_MEDIA';
            await createActivityLog(user.id, input.id, action, action === 'ADD_MEDIA'
                ? `Media items added (${input.mediaItems?.length || 0} items)`
                : 'Media items updated', {
                previousMediaCount,
                newMediaCount: input.mediaItems?.length || 0,
                mediaTypes: input.mediaItems?.map((item) => item.mediaType) || [],
            }, null, null);
        }
        else {
            // General update (may include media and other fields)
            await createActivityLog(user.id, input.id, 'UPDATE', 'Calendar post updated', {
                updatedFields: Object.keys(updateData),
                hasMediaUpdate,
                ...(hasMediaUpdate && {
                    previousMediaCount,
                    newMediaCount: input.mediaItems?.length || 0,
                }),
            }, null, null);
        }
        // Fetch updated post with media items
        const updatedPost = await db.query.metaContentCalendar.findFirst({
            where: eq(metaContentCalendar.id, input.id),
            with: {
                mediaItems: {
                    orderBy: (m, { asc: ascCol }) => [ascCol(m.order)],
                },
            },
        });
        if (!updatedPost) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update calendar post',
            });
        }
        return await transformCalendarPost(updatedPost);
    }),
    /**
     * Delete calendar post
     * NOTE: This endpoint ONLY deletes from the database. It does NOT interact with Meta API.
     */
    delete: protectedProcedure
        .input(DeleteCalendarPostInputSchema)
        .output(z.object({ success: z.boolean(), message: z.string() }))
        .mutation(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Ensure user has access to this post
        await ensureCalendarPostAccess(user.id, user.role, input.id);
        // Get existing post with QStash job ID
        const existingPost = await db.query.metaContentCalendar.findFirst({
            where: eq(metaContentCalendar.id, input.id),
            columns: { published: true, status: true, qstashJobId: true },
        });
        if (!existingPost) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Calendar post not found',
            });
        }
        // Cancel QStash job if it exists and post is not published
        // For published posts, the job has already been executed and may not exist
        if (existingPost.qstashJobId && !existingPost.published && existingPost.status !== 'PUBLISHED') {
            try {
                await cancelPublish(existingPost.qstashJobId);
            }
            catch (error) {
                console.warn('Failed to cancel QStash job before deletion:', error);
                // Continue with deletion even if cancellation fails
            }
        }
        // Create activity log before deletion
        await createActivityLog(user.id, input.id, 'DELETE', 'Calendar post deleted', {
            wasPublished: existingPost.published,
            status: existingPost.status,
            qstashJobId: existingPost.qstashJobId,
        }, null, null);
        await db.delete(metaContentCalendar).where(eq(metaContentCalendar.id, input.id));
        return {
            success: true,
            message: 'Calendar post deleted successfully',
        };
    }),
    /**
     * Get activity logs for a calendar post
     */
    getActivityLogs: protectedProcedure
        .input(z.object({ calendarPostId: z.string().min(1, 'Post ID is required') }))
        .output(z.array(ActivityLogOutputSchema))
        .query(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Ensure user has access to this post
        await ensureCalendarPostAccess(user.id, user.role, input.calendarPostId);
        const logs = await db.query.metaContentCalendarActivityLog.findMany({
            where: eq(metaContentCalendarActivityLog.calendarPostId, input.calendarPostId),
            orderBy: [desc(metaContentCalendarActivityLog.createdAt)],
        });
        return logs.map((log) => ({
            id: log.id,
            userId: log.userId,
            calendarPostId: log.calendarPostId,
            action: log.action,
            description: log.description,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
        }));
    }),
    /**
     * Update a single media item (caption/description)
     */
    updateMediaItem: protectedProcedure
        .input(z.object({
        mediaItemId: z.string().min(1, 'Media item ID is required'),
        caption: z.string().optional(),
        description: z.string().optional(),
    }))
        .output(MediaItemOutputSchema)
        .mutation(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Get media item and its post
        const mediaItem = await db.query.metaContentCalendarMedia.findFirst({
            where: eq(metaContentCalendarMedia.id, input.mediaItemId),
            with: { calendarPost: true },
        });
        if (!mediaItem) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Media item not found',
            });
        }
        // Ensure user has access to the post
        await ensureCalendarPostAccess(user.id, user.role, mediaItem.calendarPostId);
        // Don't allow updating media for published posts
        if (mediaItem.calendarPost.published) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot update media for a published post',
            });
        }
        // Store old values for logging
        const oldCaption = mediaItem.caption;
        const oldDescription = mediaItem.description;
        const updatedFields = [];
        const [updated] = await db
            .update(metaContentCalendarMedia)
            .set({
            ...(input.caption !== undefined ? { caption: input.caption || null } : {}),
            ...(input.description !== undefined
                ? { description: input.description || null }
                : {}),
            updatedAt: new Date(),
        })
            .where(eq(metaContentCalendarMedia.id, input.mediaItemId))
            .returning();
        if (!updated) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update media item',
            });
        }
        // Determine what was updated
        if (input.caption !== undefined) {
            updatedFields.push('caption');
        }
        if (input.description !== undefined) {
            updatedFields.push('description');
        }
        // Create detailed activity log
        const description = updatedFields.length > 0
            ? `Media item ${updatedFields.join(' and ')} updated`
            : 'Media item updated';
        await createActivityLog(user.id, mediaItem.calendarPostId, 'UPDATE_MEDIA', description, {
            mediaItemId: input.mediaItemId,
            mediaType: updated.mediaType,
            fileName: updated.fileName || null,
            updatedFields,
            ...(input.caption !== undefined && {
                caption: {
                    old: oldCaption,
                    new: updated.caption,
                },
            }),
            ...(input.description !== undefined && {
                description: {
                    old: oldDescription,
                    new: updated.description,
                },
            }),
        }, null, null);
        return {
            id: updated.id,
            calendarPostId: updated.calendarPostId,
            mediaType: updated.mediaType,
            url: updated.url,
            fileName: updated.fileName || null,
            fileSize: updated.fileSize ?? null,
            caption: updated.caption,
            description: updated.description,
            order: updated.order,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };
    }),
    /**
     * Delete a single media item
     */
    deleteMediaItem: protectedProcedure
        .input(z.object({ mediaItemId: z.string().min(1, 'Media item ID is required') }))
        .output(z.object({ success: z.boolean(), message: z.string() }))
        .mutation(async ({ input, ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        // Get media item and its post
        const mediaItem = await db.query.metaContentCalendarMedia.findFirst({
            where: eq(metaContentCalendarMedia.id, input.mediaItemId),
            with: { calendarPost: true },
        });
        if (!mediaItem) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Media item not found',
            });
        }
        // Ensure user has access to the post
        await ensureCalendarPostAccess(user.id, user.role, mediaItem.calendarPostId);
        // Don't allow deleting media for published posts
        if (mediaItem.calendarPost.published) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot delete media for a published post',
            });
        }
        // Create activity log before deletion (so we can capture all media item details)
        await createActivityLog(user.id, mediaItem.calendarPostId, 'DELETE_MEDIA', `Media item deleted: ${mediaItem.fileName || `Media ${mediaItem.order + 1}`}`, {
            mediaItemId: input.mediaItemId,
            mediaType: mediaItem.mediaType,
            fileName: mediaItem.fileName || null,
            fileSize: mediaItem.fileSize ?? null,
            url: mediaItem.url,
            caption: mediaItem.caption,
            description: mediaItem.description,
            order: mediaItem.order,
        }, null, null);
        await db
            .delete(metaContentCalendarMedia)
            .where(eq(metaContentCalendarMedia.id, input.mediaItemId));
        return {
            success: true,
            message: 'Media item deleted successfully',
        };
    }),
});
