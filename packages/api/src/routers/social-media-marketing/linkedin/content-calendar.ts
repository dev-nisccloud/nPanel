import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import prisma from '@nPanel/db';
import { randomUUID } from 'node:crypto';
import {
	scheduleLinkedInPublish,
	cancelLinkedInPublish,
	rescheduleLinkedInPublish,
} from '../../../lib/qstash/linkedin-content-calendar';

// ============================================================================
// INDEPENDENT API LAYER SCHEMAS - Not shared with database layer
// ============================================================================

// Enums for API layer (independent from database enums)
const LinkedInContentCalendarStatusEnum = z.enum([
	'SCHEDULED',
	'PUBLISHED',
	'FAILED',
	'CANCELLED',
	'DRAFT',
]);

const LinkedInContentMediaTypeEnum = z.enum(['PHOTO', 'VIDEO']);

// Media item schema
const MediaItemSchema = z.object({
	mediaType: LinkedInContentMediaTypeEnum,
	url: z.string().url('Media URL must be a valid URL'),
	fileName: z.string().optional(),
	fileSize: z.number().int().min(0).optional(),
	caption: z.string().optional(),
	description: z.string().optional(),
	order: z.number().int().min(0).optional().default(0),
});

// Create calendar post input schema
// LinkedIn constraints: max 1 video, multiple photos (min 2 for carousel), cannot mix
const CreateCalendarPostInputSchema = z.object({
	pageTokenId: z.string().min(1, 'Page token ID is required'),
	message: z.string().optional(),
	// Accept both Date objects and date strings (tRPC serializes Date to string)
	scheduledPublishTime: z.coerce.date(),
	mediaItems: z.array(MediaItemSchema).optional(),
}).refine(
	(data) => {
		// Validate: must have at least message or media items
		if (!data.message && (!data.mediaItems || data.mediaItems.length === 0)) {
			return false;
		}
		return true;
	},
	{
		message: 'Either message or at least one media item must be provided',
	}
).refine(
	(data) => {
		// Validate: cannot have both photos and videos
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const hasPhotos = data.mediaItems.some((item) => item.mediaType === 'PHOTO');
		const hasVideos = data.mediaItems.some((item) => item.mediaType === 'VIDEO');
		return !(hasPhotos && hasVideos);
	},
	{
		message: 'Cannot have both photos and videos in the same post',
	}
).refine(
	(data) => {
		// Validate: only one video allowed
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const videoCount = data.mediaItems.filter((item) => item.mediaType === 'VIDEO').length;
		return videoCount <= 1;
	},
	{
		message: 'Only one video is allowed per post',
	}
).refine(
	(data) => {
		// Validate: if carousel (multiple photos), minimum 2 photos required
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const photoCount = data.mediaItems.filter((item) => item.mediaType === 'PHOTO').length;
		if (photoCount > 1 && photoCount < 2) {
			return false;
		}
		return true;
	},
	{
		message: 'Carousel posts require at least 2 photos',
	}
);

// Update calendar post input schema
const UpdateCalendarPostInputSchema = z.object({
	id: z.string().min(1, 'Post ID is required'),
	message: z.string().optional(),
	// Accept both Date objects and date strings (tRPC serializes Date to string)
	scheduledPublishTime: z.coerce.date().optional(),
	status: LinkedInContentCalendarStatusEnum.optional(),
	mediaItems: z.array(MediaItemSchema).optional(),
}).refine(
	(data) => {
		// Validate: if mediaItems provided, cannot have both photos and videos
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const hasPhotos = data.mediaItems.some((item) => item.mediaType === 'PHOTO');
		const hasVideos = data.mediaItems.some((item) => item.mediaType === 'VIDEO');
		return !(hasPhotos && hasVideos);
	},
	{
		message: 'Cannot have both photos and videos in the same post',
	}
).refine(
	(data) => {
		// Validate: only one video allowed
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const videoCount = data.mediaItems.filter((item) => item.mediaType === 'VIDEO').length;
		return videoCount <= 1;
	},
	{
		message: 'Only one video is allowed per post',
	}
).refine(
	(data) => {
		// Validate: if carousel (multiple photos), minimum 2 photos required
		if (!data.mediaItems || data.mediaItems.length === 0) {
			return true;
		}
		const photoCount = data.mediaItems.filter((item) => item.mediaType === 'PHOTO').length;
		if (photoCount > 1 && photoCount < 2) {
			return false;
		}
		return true;
	},
	{
		message: 'Carousel posts require at least 2 photos',
	}
);

// Get calendar posts input schema
const GetCalendarPostsInputSchema = z.object({
	pageTokenId: z.string().optional(),
	status: LinkedInContentCalendarStatusEnum.optional(),
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
	mediaType: LinkedInContentMediaTypeEnum,
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
	pageName: z.string().nullable(), // Organization name from pageToken
	message: z.string().nullable(),
	scheduledPublishTime: z.date(),
	status: LinkedInContentCalendarStatusEnum,
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
function isAgencyUser(role: string): boolean {
	return ['AGENCY_USER', 'AGENCY_ADMIN', 'AGENCY_SUPER_ADMIN'].includes(role);
}

/**
 * Get authenticated user - optimized to use session role when available
 * Falls back to database query if role not in session
 */
async function getAuthenticatedUser(ctx: { session?: { user?: { id: string; role?: string } } | null }) {
	const user = ctx.session?.user;
	if (!user?.id) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in',
		});
	}

	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids unnecessary database queries
	const sessionRole = user.role;
	
	if (sessionRole) {
		// Role is in session, no need to query database
		return { id: user.id, role: sessionRole };
	}

	// Fallback: Query database only if role not in session
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, role: true },
	});

	if (!dbUser) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'User not found',
		});
	}

	return { id: dbUser.id, role: dbUser.role as string };
}

/**
 * Ensure user has access to a page token (LinkedIn organization)
 * - Admin users can access any organization
 * - Regular users can only access organizations owned by their team
 */
async function ensurePageTokenAccess(
	userId: string,
	role: string,
	pageTokenId: string
): Promise<{ id: string; teamId: string | null }> {
	const pageToken = await prisma.socialMediaPageToken.findUnique({
		where: { id: pageTokenId },
		select: { id: true, teamId: true, platform: true },
	});

	// Ensure this is a LinkedIn page token
	if (pageToken && pageToken.platform !== 'LINKEDIN') {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Invalid page token platform',
		});
	}

	if (!pageToken) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Organization token not found',
		});
	}

	// Admin users can access any organization
	if (isAgencyUser(role)) {
		return pageToken;
	}

	// Regular users must be team members
	if (!pageToken.teamId) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'This organization is not associated with any team',
		});
	}

	const membership = await prisma.teamMember.findFirst({
		where: {
			teamId: pageToken.teamId,
			userId,
		},
		select: { id: true },
	});

	if (!membership) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to this organization',
		});
	}

	return pageToken;
}

/**
 * Ensure user has access to a calendar post
 * - Admin users can access any post
 * - Regular users can only access posts for organizations owned by their team
 */
async function ensureCalendarPostAccess(
	userId: string,
	role: string,
	postId: string
): Promise<{ id: string; pageTokenId: string | null; createdBy: string }> {
	const post = await prisma.linkedInContentCalendar.findUnique({
		where: { id: postId },
		select: { id: true, pageTokenId: true, createdBy: true },
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

	// Check team membership for the organization
	const pageToken = await prisma.socialMediaPageToken.findUnique({
		where: { id: post.pageTokenId },
		select: { teamId: true, platform: true },
	});

	// Ensure this is a LinkedIn page token
	if (pageToken && pageToken.platform !== 'LINKEDIN') {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Invalid page token platform',
		});
	}

	if (!pageToken) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Organization token not found',
		});
	}

	if (!pageToken.teamId) {
		// If organization has no team, only creator can access
		if (post.createdBy !== userId) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You do not have access to this post',
			});
		}
		return post;
	}

	// Check team membership
	const membership = await prisma.teamMember.findFirst({
		where: {
			teamId: pageToken.teamId,
			userId,
		},
		select: { id: true },
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
async function createActivityLog(
	userId: string,
	calendarPostId: string,
	action: string,
	description?: string | null,
	metadata?: any,
	ipAddress?: string | null,
	userAgent?: string | null
) {
	await prisma.linkedInContentCalendarActivityLog.create({
		data: {
			id: `activity_${randomUUID()}`,
			userId,
			calendarPostId,
			action,
			description: description || null,
			metadata: metadata || null,
			ipAddress: ipAddress || null,
			userAgent: userAgent || null,
			createdAt: new Date(),
		},
	});
}

/**
 * Transform calendar post with user and organization information
 */
async function transformCalendarPost(post: {
	id: string;
	pageTokenId: string | null;
	message: string | null;
	scheduledPublishTime: Date;
	status: string;
	published: boolean;
	publishedAt: Date | null;
	publishedPostId: string | null;
	publishedPermalink: string | null;
	lastError: string | null;
	retryCount: number;
	lastRetryAt: Date | null;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	mediaItems?: Array<{
		id: string;
		calendarPostId: string;
		mediaType: string;
		url: string;
		fileName?: string | null;
		fileSize?: number | null;
		caption: string | null;
		description: string | null;
		order: number;
		createdAt: Date;
		updatedAt: Date;
	}>;
}) {
	// Fetch user information
	const user = await prisma.user.findUnique({
		where: { id: post.createdBy },
		select: { id: true, name: true, email: true, image: true },
	});

	// Fetch organization information
	let pageName: string | null = null;
	if (post.pageTokenId) {
		const pageToken = await prisma.socialMediaPageToken.findUnique({
			where: { id: post.pageTokenId },
			select: { pageName: true, platform: true },
		});
		// Only use organization name if it's a LinkedIn page token
		if (pageToken && pageToken.platform === 'LINKEDIN') {
			pageName = pageToken.pageName || null;
		}
	}

	return {
		id: post.id,
		pageTokenId: post.pageTokenId,
		pageName,
		message: post.message,
		scheduledPublishTime: post.scheduledPublishTime,
		status: post.status as z.infer<typeof LinkedInContentCalendarStatusEnum>,
		published: post.published,
		publishedAt: post.publishedAt,
		publishedPostId: post.publishedPostId,
		publishedPermalink: post.publishedPermalink,
		lastError: post.lastError,
		retryCount: post.retryCount,
		lastRetryAt: post.lastRetryAt,
		createdBy: post.createdBy,
		creator: user
			? {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				}
			: undefined,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		qstashJobId: (post as any).qstashJobId || null,
		mediaItems: post.mediaItems?.map((item) => ({
			id: item.id,
			calendarPostId: item.calendarPostId,
			mediaType: item.mediaType as z.infer<typeof LinkedInContentMediaTypeEnum>,
			url: item.url,
			fileName: (item as any).fileName || null,
			fileSize: (item as any).fileSize || null,
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

export const linkedinContentCalendarRouter = router({
	/**
	 * Create a new calendar post
	 * NOTE: This endpoint ONLY saves to the database. It does NOT publish to LinkedIn.
	 * Publishing to LinkedIn will be handled by a separate scheduler/service that runs
	 * at the scheduled publish time.
	 */
	create: protectedProcedure
		.input(CreateCalendarPostInputSchema)
		.output(CalendarPostOutputSchema)
		.mutation(async ({ input, ctx }) => {
			const user = await getAuthenticatedUser(ctx);

			// Ensure user has access to the organization token
			await ensurePageTokenAccess(user.id, user.role, input.pageTokenId);

			// Validate scheduled time is in the future
			if (input.scheduledPublishTime <= new Date()) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Scheduled publish time must be in the future',
				});
			}

			const now = new Date();
			const postId = `linkedin_calendar_${randomUUID()}`;

			// Create calendar post
			const post = await prisma.linkedInContentCalendar.create({
				data: {
					id: postId,
					pageTokenId: input.pageTokenId,
					message: input.message || null,
					scheduledPublishTime: input.scheduledPublishTime,
					status: 'SCHEDULED',
					published: false,
					createdBy: user.id,
					createdAt: now,
					updatedAt: now,
				},
			});

			// Create media items if provided
			if (input.mediaItems && input.mediaItems.length > 0) {
				await prisma.linkedInContentCalendarMedia.createMany({
					data: input.mediaItems.map((item, index) => ({
						id: `linkedin_media_${randomUUID()}`,
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
					})),
				});
			}

			// Schedule QStash job for publishing
			let qstashJobId: string | null = null;
			try {
				const jobResult = await scheduleLinkedInPublish(
					postId,
					input.pageTokenId,
					input.scheduledPublishTime
				);
				qstashJobId = jobResult.messageId;
			} catch (error) {
				// Log error but don't fail the creation
				// The post will be created but may need manual scheduling
				console.error('Failed to schedule QStash job:', error);
				// Update post with error in lastError field
				await prisma.linkedInContentCalendar.update({
					where: { id: postId },
					data: {
						lastError: `Failed to schedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`,
					},
				});
			}

			// Update post with QStash job ID if scheduled successfully
			if (qstashJobId) {
				await prisma.linkedInContentCalendar.update({
					where: { id: postId },
					data: {
						qstashJobId,
					},
				});
			}

			// Create activity log
			await createActivityLog(
				user.id,
				postId,
				'CREATE',
				'Calendar post created',
				{
					pageTokenId: input.pageTokenId,
					scheduledPublishTime: input.scheduledPublishTime,
					hasMedia: (input.mediaItems?.length ?? 0) > 0,
					mediaCount: input.mediaItems?.length ?? 0,
					qstashJobId,
				},
				null, // IP address not available in context
				null // User agent not available in context
			);

			// Fetch created post with media items
			const createdPost = await prisma.linkedInContentCalendar.findUnique({
				where: { id: postId },
				include: {
					mediaItems: {
						orderBy: { order: 'asc' },
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

			// Build where clause
			const where: any = {};

			// Filter by page token if provided
			if (input.pageTokenId) {
				// Ensure user has access to this organization
				await ensurePageTokenAccess(user.id, user.role, input.pageTokenId);
				where.pageTokenId = input.pageTokenId;
			} else if (!isAgencyUser(user.role)) {
				// For non-admin users, only show posts for organizations they have access to
				// Get all teams the user is a member of
				const memberships = await prisma.teamMember.findMany({
					where: { userId: user.id },
					select: { teamId: true },
				});

				const teamIds = memberships.map((m) => m.teamId);

				// Get organization tokens for these teams (LinkedIn only)
				const pageTokens = await prisma.socialMediaPageToken.findMany({
					where: {
						teamId: { in: teamIds },
						platform: 'LINKEDIN', // Filter by platform
					},
					select: { id: true },
				});

				const pageTokenIds = pageTokens.map((pt) => pt.id);

				// Also include posts created by the user (even if organization has no team)
				where.OR = [
					{ pageTokenId: { in: pageTokenIds } },
					{ createdBy: user.id },
				];
			}

			// Filter by status if provided
			if (input.status) {
				where.status = input.status;
			}

			// Get posts
			const [posts, total] = await Promise.all([
				prisma.linkedInContentCalendar.findMany({
					where,
					include: {
						mediaItems: {
							orderBy: { order: 'asc' },
						},
					},
					orderBy: { scheduledPublishTime: 'asc' },
					take: input.limit,
					skip: input.offset,
				}),
				prisma.linkedInContentCalendar.count({ where }),
			]);

			// Transform all posts with user and organization information
			const transformedPosts = await Promise.all(
				posts.map((post) => transformCalendarPost(post))
			);

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

			const post = await prisma.linkedInContentCalendar.findUnique({
				where: { id: input.id },
				include: {
					mediaItems: {
						orderBy: { order: 'asc' },
					},
				},
			});

			if (!post) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Calendar post not found',
				});
			}

			return await transformCalendarPost(post);
		}),

	/**
	 * Update calendar post
	 * NOTE: This endpoint ONLY updates the database. It does NOT interact with LinkedIn API.
	 */
	update: protectedProcedure
		.input(UpdateCalendarPostInputSchema)
		.output(CalendarPostOutputSchema)
		.mutation(async ({ input, ctx }) => {
			const user = await getAuthenticatedUser(ctx);

			// Ensure user has access to this post
			await ensureCalendarPostAccess(user.id, user.role, input.id);

			// Get existing post with QStash job ID
			const existingPost = await prisma.linkedInContentCalendar.findUnique({
				where: { id: input.id },
				select: {
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

			const updateData: any = {
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
				? await prisma.linkedInContentCalendarMedia.count({
						where: { calendarPostId: input.id },
					})
				: 0;

			// Update media items if provided
			if (hasMediaUpdate) {
				// Delete existing media items
				await prisma.linkedInContentCalendarMedia.deleteMany({
					where: { calendarPostId: input.id },
				});

			// Create new media items
			if (input.mediaItems && input.mediaItems.length > 0) {
				const now = new Date();
				await prisma.linkedInContentCalendarMedia.createMany({
					data: input.mediaItems.map((item, index) => ({
							id: `linkedin_media_${randomUUID()}`,
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
						})),
					});
				}
			}

			// Handle QStash job management
			let newQstashJobId: string | null = existingPost.qstashJobId || null;
			const needsReschedule =
				input.scheduledPublishTime !== undefined &&
				existingPost.scheduledPublishTime.getTime() !== input.scheduledPublishTime.getTime();
			const statusChanged = input.status !== undefined && input.status !== existingPost.status;
			const shouldCancel =
				statusChanged && (input.status === 'CANCELLED' || input.status === 'DRAFT');
			const shouldSchedule =
				statusChanged && input.status === 'SCHEDULED' && existingPost.status !== 'SCHEDULED';

			// Cancel job if status changed to CANCELLED or DRAFT
			if (shouldCancel && existingPost.qstashJobId) {
				try {
					await cancelLinkedInPublish(existingPost.qstashJobId);
					newQstashJobId = null;
				} catch (error) {
					console.warn('Failed to cancel QStash job:', error);
					// Continue even if cancellation fails
				}
			}

			// Reschedule job if publish time changed
			if (needsReschedule && existingPost.pageTokenId && !shouldCancel) {
				try {
					const newScheduledTime = input.scheduledPublishTime || existingPost.scheduledPublishTime;
					const jobResult = await rescheduleLinkedInPublish(
						existingPost.qstashJobId,
						input.id,
						existingPost.pageTokenId,
						newScheduledTime
					);
					newQstashJobId = jobResult.messageId;
				} catch (error) {
					console.error('Failed to reschedule QStash job:', error);
					// Update post with error but continue
					updateData.lastError = `Failed to reschedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`;
				}
			}

			// Schedule new job if status changed to SCHEDULED
			if (shouldSchedule && existingPost.pageTokenId) {
				try {
					const scheduledTime = input.scheduledPublishTime || existingPost.scheduledPublishTime;
					const jobResult = await scheduleLinkedInPublish(
						input.id,
						existingPost.pageTokenId,
						scheduledTime
					);
					newQstashJobId = jobResult.messageId;
				} catch (error) {
					console.error('Failed to schedule QStash job:', error);
					updateData.lastError = `Failed to schedule publish job: ${error instanceof Error ? error.message : 'Unknown error'}`;
				}
			}

			// Update QStash job ID if changed
			if (newQstashJobId !== existingPost.qstashJobId) {
				updateData.qstashJobId = newQstashJobId;
			}

			// Update post
			await prisma.linkedInContentCalendar.update({
				where: { id: input.id },
				data: updateData,
			});

			// Create activity log
			// If only media items were updated (no other fields), log as ADD_MEDIA or UPDATE_MEDIA
			const hasOtherUpdates = Object.keys(updateData).length > 1; // More than just updatedAt
			
			if (hasMediaUpdate && !hasOtherUpdates) {
				// Only media was updated - log as ADD_MEDIA if items were added, or UPDATE_MEDIA if replaced
				const action = input.mediaItems && input.mediaItems.length > previousMediaCount 
					? 'ADD_MEDIA' 
					: 'UPDATE_MEDIA';
				await createActivityLog(
					user.id,
					input.id,
					action,
					action === 'ADD_MEDIA' 
						? `Media items added (${input.mediaItems?.length || 0} items)`
						: 'Media items updated',
					{
						previousMediaCount,
						newMediaCount: input.mediaItems?.length || 0,
						mediaTypes: input.mediaItems?.map((item) => item.mediaType) || [],
					},
					null,
					null
				);
			} else {
				// General update (may include media and other fields)
				await createActivityLog(
					user.id,
					input.id,
					'UPDATE',
					'Calendar post updated',
					{
						updatedFields: Object.keys(updateData),
						hasMediaUpdate,
						...(hasMediaUpdate && {
							previousMediaCount,
							newMediaCount: input.mediaItems?.length || 0,
						}),
					},
					null,
					null
				);
			}

			// Fetch updated post with media items
			const updatedPost = await prisma.linkedInContentCalendar.findUnique({
				where: { id: input.id },
				include: {
					mediaItems: {
						orderBy: { order: 'asc' },
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
	 * NOTE: This endpoint ONLY deletes from the database. It does NOT interact with LinkedIn API.
	 */
	delete: protectedProcedure
		.input(DeleteCalendarPostInputSchema)
		.output(z.object({ success: z.boolean(), message: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const user = await getAuthenticatedUser(ctx);

			// Ensure user has access to this post
			await ensureCalendarPostAccess(user.id, user.role, input.id);

			// Get existing post with QStash job ID
			const existingPost = await prisma.linkedInContentCalendar.findUnique({
				where: { id: input.id },
				select: { published: true, status: true, qstashJobId: true },
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
					await cancelLinkedInPublish(existingPost.qstashJobId);
				} catch (error) {
					console.warn('Failed to cancel QStash job before deletion:', error);
					// Continue with deletion even if cancellation fails
				}
			}

			// Create activity log before deletion
			await createActivityLog(
				user.id,
				input.id,
				'DELETE',
				'Calendar post deleted',
				{
					wasPublished: existingPost.published,
					status: existingPost.status,
					qstashJobId: existingPost.qstashJobId,
				},
				null,
				null
			);

			// Delete post (media items will be cascade deleted)
			await prisma.linkedInContentCalendar.delete({
				where: { id: input.id },
			});

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

			const logs = await prisma.linkedInContentCalendarActivityLog.findMany({
				where: { calendarPostId: input.calendarPostId },
				orderBy: { createdAt: 'desc' },
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
		.input(
			z.object({
				mediaItemId: z.string().min(1, 'Media item ID is required'),
				caption: z.string().optional(),
				description: z.string().optional(),
			})
		)
		.output(MediaItemOutputSchema)
		.mutation(async ({ input, ctx }) => {
			const user = await getAuthenticatedUser(ctx);

			// Get media item and its post
			const mediaItem = await prisma.linkedInContentCalendarMedia.findUnique({
				where: { id: input.mediaItemId },
				include: { calendarPost: true },
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
			const updatedFields: string[] = [];

			// Update media item
			const updated = await prisma.linkedInContentCalendarMedia.update({
				where: { id: input.mediaItemId },
				data: {
					caption: input.caption !== undefined ? input.caption || null : undefined,
					description: input.description !== undefined ? input.description || null : undefined,
					updatedAt: new Date(),
				},
			});

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

			await createActivityLog(
				user.id,
				mediaItem.calendarPostId,
				'UPDATE_MEDIA',
				description,
				{
					mediaItemId: input.mediaItemId,
					mediaType: updated.mediaType,
					fileName: (updated as any).fileName || null,
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
				},
				null,
				null
			);

			return {
				id: updated.id,
				calendarPostId: updated.calendarPostId,
				mediaType: updated.mediaType as z.infer<typeof LinkedInContentMediaTypeEnum>,
				url: updated.url,
				fileName: (updated as any).fileName || null,
				fileSize: (updated as any).fileSize || null,
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
			const mediaItem = await prisma.linkedInContentCalendarMedia.findUnique({
				where: { id: input.mediaItemId },
				include: { calendarPost: true },
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
			await createActivityLog(
				user.id,
				mediaItem.calendarPostId,
				'DELETE_MEDIA',
				`Media item deleted: ${(mediaItem as any).fileName || `Media ${mediaItem.order + 1}`}`,
				{
					mediaItemId: input.mediaItemId,
					mediaType: mediaItem.mediaType,
					fileName: (mediaItem as any).fileName || null,
					fileSize: (mediaItem as any).fileSize || null,
					url: mediaItem.url,
					caption: mediaItem.caption,
					description: mediaItem.description,
					order: mediaItem.order,
				},
				null,
				null
			);

			// Delete media item
			await prisma.linkedInContentCalendarMedia.delete({
				where: { id: input.mediaItemId },
			});

			return {
				success: true,
				message: 'Media item deleted successfully',
			};
		}),
});




