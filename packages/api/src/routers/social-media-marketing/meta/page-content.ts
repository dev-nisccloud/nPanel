import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import { createMetaClient, MetaApiError } from '../../../lib/meta-client';
import { getStoredMetaAccessToken } from '../../../lib/meta-credentials';
import { MetaErrorHandler } from '../../../lib/meta-error-handler';

// Validation schema for page content request
const PageContentRequestSchema = z.object({
	pageId: z.string().min(1, 'Page ID is required'),
	contentType: z.enum(['posts', 'photos', 'videos', 'events']).optional().default('posts'),
	fields: z.array(z.string()).optional(),
	limit: z.number().min(1).max(100).optional(),
	since: z.string().optional(), // ISO 8601 date string
	until: z.string().optional(), // ISO 8601 date string
	accessToken: z.string().optional(), // Optional - will use stored token if not provided
	apiVersion: z.string().optional().default('v21.0'),
	useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
});

export const metaPageContentRouter = router({
	/**
	 * Get page content (posts, photos, videos, or events)
	 */
	getContent: protectedProcedure
		.input(PageContentRequestSchema)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredMetaAccessToken();
					if (stored) {
						accessToken = stored.accessToken;
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
					});
				}

				const client = createMetaClient(accessToken, input.apiVersion);

				const response = await client.getPageContent(input.pageId, input.contentType, {
					fields: input.fields,
					limit: input.limit,
					since: input.since,
					until: input.until,
				});

				// Meta API returns data in a 'data' array with pagination info
				const content = response.data || [];
				const paging = response.paging || {};

				return {
					success: true,
					data: content,
					pagination: {
						previous: paging.previous || null,
						next: paging.next || null,
						cursors: paging.cursors || null,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						content_type: input.contentType,
						total_items: content.length,
					},
				};
			} catch (error) {
				console.error('Meta API page content error:', error);

				if (error instanceof z.ZodError) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid request data',
						cause: error.issues.map((err) => ({
							field: err.path.join('.'),
							message: err.message,
						})),
					});
				}

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page content',
				});
			}
		}),

	/**
	 * Get page posts
	 */
	getPosts: protectedProcedure
		.input(
			PageContentRequestSchema.omit({ contentType: true }).extend({
				contentType: z.literal('posts').optional(),
			})
		)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredMetaAccessToken();
					if (stored) {
						accessToken = stored.accessToken;
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
					});
				}

				const client = createMetaClient(accessToken, input.apiVersion);

				const response = await client.getPageContent(input.pageId, 'posts', {
					fields: input.fields,
					limit: input.limit,
					since: input.since,
					until: input.until,
				});

				const posts = response.data || [];
				const paging = response.paging || {};

				return {
					success: true,
					data: posts,
					pagination: {
						previous: paging.previous || null,
						next: paging.next || null,
						cursors: paging.cursors || null,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						total_posts: posts.length,
					},
				};
			} catch (error) {
				console.error('Meta API page posts error:', error);

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page posts',
				});
			}
		}),

	/**
	 * Get page photos
	 */
	getPhotos: protectedProcedure
		.input(
			PageContentRequestSchema.omit({ contentType: true }).extend({
				contentType: z.literal('photos').optional(),
			})
		)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredMetaAccessToken();
					if (stored) {
						accessToken = stored.accessToken;
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
					});
				}

				const client = createMetaClient(accessToken, input.apiVersion);

				const response = await client.getPageContent(input.pageId, 'photos', {
					fields: input.fields,
					limit: input.limit,
					since: input.since,
					until: input.until,
				});

				const photos = response.data || [];
				const paging = response.paging || {};

				return {
					success: true,
					data: photos,
					pagination: {
						previous: paging.previous || null,
						next: paging.next || null,
						cursors: paging.cursors || null,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						total_photos: photos.length,
					},
				};
			} catch (error) {
				console.error('Meta API page photos error:', error);

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page photos',
				});
			}
		}),

	/**
	 * Get page videos
	 */
	getVideos: protectedProcedure
		.input(
			PageContentRequestSchema.omit({ contentType: true }).extend({
				contentType: z.literal('videos').optional(),
			})
		)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredMetaAccessToken();
					if (stored) {
						accessToken = stored.accessToken;
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
					});
				}

				const client = createMetaClient(accessToken, input.apiVersion);

				const response = await client.getPageContent(input.pageId, 'videos', {
					fields: input.fields,
					limit: input.limit,
					since: input.since,
					until: input.until,
				});

				const videos = response.data || [];
				const paging = response.paging || {};

				return {
					success: true,
					data: videos,
					pagination: {
						previous: paging.previous || null,
						next: paging.next || null,
						cursors: paging.cursors || null,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						total_videos: videos.length,
					},
				};
			} catch (error) {
				console.error('Meta API page videos error:', error);

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page videos',
				});
			}
		}),

	/**
	 * Get page events
	 */
	getEvents: protectedProcedure
		.input(
			PageContentRequestSchema.omit({ contentType: true }).extend({
				contentType: z.literal('events').optional(),
			})
		)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredMetaAccessToken();
					if (stored) {
						accessToken = stored.accessToken;
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
					});
				}

				const client = createMetaClient(accessToken, input.apiVersion);

				const response = await client.getPageContent(input.pageId, 'events', {
					fields: input.fields,
					limit: input.limit,
					since: input.since,
					until: input.until,
				});

				const events = response.data || [];
				const paging = response.paging || {};

				return {
					success: true,
					data: events,
					pagination: {
						previous: paging.previous || null,
						next: paging.next || null,
						cursors: paging.cursors || null,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						total_events: events.length,
					},
				};
			} catch (error) {
				console.error('Meta API page events error:', error);

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page events',
				});
			}
		}),
});

