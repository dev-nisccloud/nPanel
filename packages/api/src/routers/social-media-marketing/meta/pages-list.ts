import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import { createMetaClient, MetaApiError } from '../../../lib/meta-client';
import { getStoredMetaAccessToken } from '../../../lib/meta-credentials';
import { MetaErrorHandler } from '../../../lib/meta-error-handler';

// Validation schema for pages list request
const PagesListRequestSchema = z.object({
	fields: z.array(z.string()).optional(),
	accessToken: z.string().optional(), // Optional - will use stored token if not provided
	apiVersion: z.string().optional().default('v21.0'),
	useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
});

export const metaPagesListRouter = router({
	/**
	 * Get list of Facebook Pages managed by the user
	 */
	getPages: protectedProcedure
		.input(PagesListRequestSchema)
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

				const response = await client.getPages(input.fields);

				// Meta API returns data in a 'data' array
				const pages = response.data || [];

				return {
					success: true,
					data: pages,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_pages: pages.length,
					},
				};
			} catch (error) {
				console.error('Meta API pages list error:', error);

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
					message: 'Failed to retrieve pages list',
				});
			}
		}),

	/**
	 * Get a specific page by ID
	 */
	getPage: protectedProcedure
		.input(
			z.object({
				pageId: z.string().min(1, 'Page ID is required'),
				fields: z.array(z.string()).optional(),
				accessToken: z.string().optional(), // Optional - will use stored token if not provided
				apiVersion: z.string().optional().default('v21.0'),
				useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
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

				const page = await client.getPage(input.pageId, input.fields);

				return {
					success: true,
					data: page,
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
					},
				};
			} catch (error) {
				console.error('Meta API get page error:', error);

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
					message: 'Failed to retrieve page',
				});
			}
		}),
});

