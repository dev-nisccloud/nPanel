import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq } from "@npanel/db";
import { router, protectedProcedure } from '../../../trpc';
import { createMetaClient, MetaApiError } from '../../../lib/meta-client';
import { getStoredMetaAccessToken, getStoredPageAccessToken } from '../../../lib/meta-credentials';
import { MetaErrorHandler } from '../../../lib/meta-error-handler';
import { request } from 'undici';
import { db } from "@npanel/db";
import { socialMediaIntegration, socialMediaPageToken, } from "@npanel/db/schema/social-media-marketing";
// Validation schema for pages list request
const PagesListRequestSchema = z.object({
    fields: z.array(z.string()).optional(),
    accessToken: z.string().optional(), // Optional - will use stored token if not provided
    apiVersion: z.string().optional().default('v24.0'),
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
                    message: 'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
                });
            }
            const client = createMetaClient(accessToken, input.apiVersion);
            const response = await client.getPages(input.fields);
            // Meta API returns data in a 'data' array
            const pages = response.data || [];
            // Store page tokens in DB if they're included in the response
            // This allows non-agency users to use stored tokens
            if (pages.length > 0 && input.useStoredToken) {
                try {
                    const integration = await db.query.socialMediaIntegration.findFirst({
                        where: and(eq(socialMediaIntegration.platform, 'META_FACEBOOK'), eq(socialMediaIntegration.status, 'ACTIVE')),
                    });
                    if (integration) {
                        const now = new Date();
                        // Store page tokens for pages that have access_token
                        for (const page of pages) {
                            if (page.access_token && page.id) {
                                try {
                                    const pageInfo = {
                                        pageName: page.name,
                                        pageUsername: page.username,
                                        pagePicture: page.picture?.data?.url,
                                        pageCategory: page.category,
                                    };
                                    // Note: Page tokens typically don't expire unless revoked by page admin
                                    // However, we set expiration to match parent integration token expiration
                                    // as page tokens become invalid if parent user token expires
                                    const expiresAt = integration.accessTokenExpiresAt || null;
                                    const existingToken = await db.query.socialMediaPageToken.findFirst({
                                        where: and(eq(socialMediaPageToken.integrationId, integration.id), eq(socialMediaPageToken.pageId, page.id)),
                                    });
                                    if (existingToken) {
                                        await db
                                            .update(socialMediaPageToken)
                                            .set({
                                            platform: integration.platform,
                                            accessToken: page.access_token,
                                            accessTokenExpiresAt: expiresAt,
                                            pageName: pageInfo.pageName,
                                            pageUsername: pageInfo.pageUsername,
                                            pagePicture: pageInfo.pagePicture,
                                            pageCategory: pageInfo.pageCategory,
                                            isActive: true,
                                            lastTokenRefreshAt: now,
                                            updatedAt: now,
                                        })
                                            .where(eq(socialMediaPageToken.id, existingToken.id));
                                    }
                                    else {
                                        await db.insert(socialMediaPageToken).values({
                                            id: `page_token_${integration.id}_${page.id}_${Date.now()}`,
                                            integrationId: integration.id,
                                            platform: integration.platform,
                                            pageId: page.id,
                                            accessToken: page.access_token,
                                            accessTokenExpiresAt: expiresAt,
                                            pageName: pageInfo.pageName,
                                            pageUsername: pageInfo.pageUsername,
                                            pagePicture: pageInfo.pagePicture,
                                            pageCategory: pageInfo.pageCategory,
                                            isActive: true,
                                            lastTokenRefreshAt: now,
                                            createdAt: now,
                                            updatedAt: now,
                                        });
                                    }
                                }
                                catch (error) {
                                    // Log but don't fail the request if storing page token fails
                                    console.warn(`Failed to store page token for page ${page.id}:`, error);
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    // Log but don't fail the request if storing page tokens fails
                    console.warn('Failed to store page tokens:', error);
                }
            }
            return {
                success: true,
                data: pages,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    total_pages: pages.length,
                },
            };
        }
        catch (error) {
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
                let trpcCode = 'INTERNAL_SERVER_ERROR';
                if (errorType === 'refresh-token') {
                    trpcCode = 'UNAUTHORIZED';
                }
                else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
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
     * Get page token ID from page ID
     * Returns the database ID of the page token for a given Facebook page ID
     */
    getPageTokenId: protectedProcedure
        .input(z.object({
        pageId: z.string().min(1, 'Page ID is required'),
    }))
        .query(async ({ input }) => {
        try {
            // Find the page token in the database (Meta Facebook only)
            const pageToken = await db.query.socialMediaPageToken.findFirst({
                where: and(eq(socialMediaPageToken.pageId, input.pageId), eq(socialMediaPageToken.platform, 'META_FACEBOOK'), eq(socialMediaPageToken.isActive, true)),
                columns: {
                    id: true,
                    pageId: true,
                    pageName: true,
                },
            });
            if (!pageToken) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Page token not found for this page. Please refresh the pages list.',
                });
            }
            return {
                success: true,
                data: {
                    pageTokenId: pageToken.id,
                    pageId: pageToken.pageId,
                    pageName: pageToken.pageName,
                },
            };
        }
        catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve page token ID',
            });
        }
    }),
    /**
     * Get a specific page by ID
     */
    getPage: protectedProcedure
        .input(z.object({
        pageId: z.string().min(1, 'Page ID is required'),
        fields: z.array(z.string()).optional(),
        accessToken: z.string().optional(), // Optional - will use stored token if not provided
        apiVersion: z.string().optional().default('v24.0'),
        useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
    }))
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
                    message: 'Access token is required. Either provide accessToken in the request or configure stored credentials using the auth.generateToken endpoint.',
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
        }
        catch (error) {
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
                let trpcCode = 'INTERNAL_SERVER_ERROR';
                if (errorType === 'refresh-token') {
                    trpcCode = 'UNAUTHORIZED';
                }
                else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
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
    /**
     * Get page insights/analytics
     */
    getPageInsights: protectedProcedure
        .input(z.object({
        pageId: z.string().min(1, 'Page ID is required'),
        metrics: z.array(z.string()).optional().default([
            'page_views_total',
            'page_post_engagements',
            'page_impressions_unique',
            'page_posts_impressions',
            'page_posts_impressions_unique',
            'page_video_views',
            'page_daily_follows',
        ]),
        period: z.enum(['day', 'week', 'days_28']).optional().default('day'),
        since: z.string().optional(),
        until: z.string().optional(),
        accessToken: z.string().optional(),
        apiVersion: z.string().optional().default('v24.0'),
        useStoredToken: z.boolean().optional().default(true),
    }))
        .query(async ({ input }) => {
        try {
            // For page insights, we need a page access token, not a user access token
            // Step 1: Try to get stored page token
            let accessToken = input.accessToken;
            if (!accessToken && input.useStoredToken) {
                const storedPageToken = await getStoredPageAccessToken(input.pageId);
                if (storedPageToken) {
                    accessToken = storedPageToken.accessToken;
                }
                else {
                    // Step 2: If no stored page token, get user token and fetch page token on-the-fly
                    const userToken = await getStoredMetaAccessToken();
                    if (userToken) {
                        try {
                            // Get page access token using user access token
                            const apiVersion = input.apiVersion || 'v24.0';
                            const pageTokenUrl = `https://graph.facebook.com/${apiVersion}/${input.pageId}?fields=access_token&access_token=${userToken.accessToken}`;
                            const pageTokenResponse = await request(pageTokenUrl, { method: 'GET' });
                            const pageTokenData = (await pageTokenResponse.body.json());
                            if (pageTokenData && pageTokenData.access_token) {
                                accessToken = pageTokenData.access_token;
                            }
                            else if (pageTokenData && 'error' in pageTokenData) {
                                // If error getting page token, throw error (insights require page token)
                                throw new TRPCError({
                                    code: 'UNAUTHORIZED',
                                    message: 'Page access token is required for insights. Please ensure you have proper permissions on this page.',
                                });
                            }
                            else {
                                throw new TRPCError({
                                    code: 'UNAUTHORIZED',
                                    message: 'Failed to retrieve page access token for insights.',
                                });
                            }
                        }
                        catch (error) {
                            if (error instanceof TRPCError) {
                                throw error;
                            }
                            throw new TRPCError({
                                code: 'UNAUTHORIZED',
                                message: 'Page access token is required for insights. Please ensure you have proper permissions on this page.',
                            });
                        }
                    }
                }
            }
            if (!accessToken) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Page access token is required for insights. Either provide accessToken in the request or configure stored credentials.',
                });
            }
            const client = createMetaClient(accessToken, input.apiVersion);
            const insights = await client.getPageInsights(input.pageId, input.metrics, input.period, input.since, input.until);
            return {
                success: true,
                data: insights.data || [],
                meta: {
                    retrieved_at: new Date().toISOString(),
                    page_id: input.pageId,
                },
            };
        }
        catch (error) {
            console.error('Meta API get page insights error:', error);
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
                const errorInfo = MetaErrorHandler.handleError(error);
                const userMessage = errorInfo?.message || error.message;
                const errorType = errorInfo?.type || 'unknown';
                let trpcCode = 'INTERNAL_SERVER_ERROR';
                if (errorType === 'refresh-token') {
                    trpcCode = 'UNAUTHORIZED';
                }
                else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
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
                message: 'Failed to retrieve page insights',
            });
        }
    }),
});
