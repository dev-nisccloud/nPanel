import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import { createLinkedInClient, LinkedInApiError } from '../../../lib/linkedin-client';
import { getStoredLinkedInAccessToken, getStoredLinkedInPageAccessToken } from '../../../lib/linkedin-credentials';
import { LinkedInErrorHandler } from '../../../lib/linkedin-error-handler';
import prisma from '@nPanel/db';

// Validation schema for organizations list request
const OrganizationsListRequestSchema = z.object({
	accessToken: z.string().optional(), // Optional - will use stored token if not provided
	apiVersion: z.string().optional().default('202501'),
	useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
});

export const linkedinPagesListRouter = router({
	/**
	 * Get list of LinkedIn Organizations managed by the user
	 */
	getOrganizations: protectedProcedure
		.input(OrganizationsListRequestSchema)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredLinkedInAccessToken();
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

				const client = createLinkedInClient(accessToken, input.apiVersion);

				const response = await client.getOrganizations();

				// LinkedIn API returns data in 'elements' array
				const organizations = response.elements || [];

				// Transform organizations to match our page token structure
				const transformedOrgs = organizations.map((org: any) => {
					const orgTarget = org.organizationalTarget || '';
					const orgId = orgTarget.split(':').pop() || '';
					const orgData = org['organizationalTarget~'] || {};

					return {
						id: orgId,
						name: orgData.localizedName || '',
						username: orgData.vanityName || '',
						picture: orgData.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier || null,
						access_token: accessToken, // Use same access token for organization
					};
				});

				// Store organization tokens in DB if they're included in the response
				// This allows non-agency users to use stored tokens
				if (transformedOrgs.length > 0 && input.useStoredToken) {
					try {
						const integration = await prisma.socialMediaIntegration.findFirst({
							where: {
								platform: 'LINKEDIN' as const,
								status: 'ACTIVE' as const,
							},
						});

						if (integration) {
							const now = new Date();
							// Store organization tokens
							for (const org of transformedOrgs) {
								if (org.id) {
									try {
										const orgInfo = {
											pageName: org.name,
											pageUsername: org.username,
											pagePicture: org.picture,
											pageCategory: null, // LinkedIn doesn't have categories like Facebook
										};

										// Note: Organization tokens use the same access token as user token
										// They expire when the parent user token expires
										const expiresAt = integration.accessTokenExpiresAt || null;

										// Use upsert to handle both create and update cases
										await prisma.socialMediaPageToken.upsert({
											where: {
												integrationId_pageId: {
													integrationId: integration.id,
													pageId: org.id,
												},
											},
											update: {
												platform: integration.platform, // Set platform from integration
												accessToken: accessToken, // Update with current token
												accessTokenExpiresAt: expiresAt,
												pageName: orgInfo.pageName,
												pageUsername: orgInfo.pageUsername,
												pagePicture: orgInfo.pagePicture,
												pageCategory: orgInfo.pageCategory,
												isActive: true,
												lastTokenRefreshAt: now,
												updatedAt: now,
											},
											create: {
												id: `page_token_${integration.id}_${org.id}_${Date.now()}`,
												integrationId: integration.id,
												platform: integration.platform, // Set platform from integration
												pageId: org.id,
												accessToken: accessToken,
												accessTokenExpiresAt: expiresAt,
												pageName: orgInfo.pageName,
												pageUsername: orgInfo.pageUsername,
												pagePicture: orgInfo.pagePicture,
												pageCategory: orgInfo.pageCategory,
												isActive: true,
												lastTokenRefreshAt: now,
												createdAt: now,
												updatedAt: now,
											},
										});
									} catch (error) {
										// Log but don't fail the request if storing organization token fails
										console.warn(`Failed to store organization token for org ${org.id}:`, error);
									}
								}
							}
						}
					} catch (error) {
						// Log but don't fail the request if storing organization tokens fails
						console.warn('Failed to store organization tokens:', error);
					}
				}

				return {
					success: true,
					data: transformedOrgs,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_organizations: transformedOrgs.length,
					},
				};
			} catch (error) {
				console.error('LinkedIn API organizations list error:', error);

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

				if (error instanceof LinkedInApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = LinkedInErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.status >= 400 && error.status < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							status: error.status,
							serviceErrorCode: error.serviceErrorCode,
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
					message: 'Failed to retrieve organizations list',
				});
			}
		}),

	/**
	 * Get organization token ID from organization ID
	 * Returns the database ID of the organization token for a given LinkedIn organization ID
	 */
	getPageTokenId: protectedProcedure
		.input(
			z.object({
				pageId: z.string().min(1, 'Organization ID is required'),
			})
		)
		.query(async ({ input }) => {
			try {
				// Find the organization token in the database (LinkedIn only)
				const pageToken = await prisma.socialMediaPageToken.findFirst({
					where: {
						pageId: input.pageId,
						platform: 'LINKEDIN', // Filter by platform
						isActive: true,
					},
					select: {
						id: true,
						pageId: true,
						pageName: true,
					},
				});

				if (!pageToken) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Organization token not found for this organization. Please refresh the organizations list.',
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
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve organization token ID',
				});
			}
		}),

	/**
	 * Get a specific organization by ID
	 */
	getOrganization: protectedProcedure
		.input(
			z.object({
				orgId: z.string().min(1, 'Organization ID is required'),
				accessToken: z.string().optional(),
				apiVersion: z.string().optional().default('202501'),
				useStoredToken: z.boolean().optional().default(true),
			})
		)
		.query(async ({ input }) => {
			try {
				// Get access token - use stored token if available and not explicitly provided
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const stored = await getStoredLinkedInAccessToken();
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

				const client = createLinkedInClient(accessToken, input.apiVersion);

				const organization = await client.getOrganization(input.orgId);

				return {
					success: true,
					data: organization,
					meta: {
						retrieved_at: new Date().toISOString(),
						organization_id: input.orgId,
					},
				};
			} catch (error) {
				console.error('LinkedIn API get organization error:', error);

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

				if (error instanceof LinkedInApiError) {
					const errorInfo = LinkedInErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.status >= 400 && error.status < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							status: error.status,
							serviceErrorCode: error.serviceErrorCode,
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
					message: 'Failed to retrieve organization',
				});
			}
		}),
});




