import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import { createLinkedInClient, LinkedInApiError } from '../../../lib/linkedin-client';
import {
	getStoredLinkedInAccessToken,
	getStoredLinkedInPageAccessToken,
} from '../../../lib/linkedin-credentials';
import { LinkedInErrorHandler } from '../../../lib/linkedin-error-handler';

// Validation schema for organization content request
const OrganizationContentRequestSchema = z.object({
	orgId: z.string().min(1, 'Organization ID is required'),
	limit: z.number().min(1).max(100).optional().default(25),
	accessToken: z.string().optional(), // Optional - will use stored token if not provided
	apiVersion: z.string().optional().default('202501'),
	useStoredToken: z.boolean().optional().default(true), // Whether to use stored token if available
});

export const linkedinPageContentRouter = router({
	/**
	 * Get organization posts/content
	 * Note: LinkedIn API has limited support for fetching posts directly.
	 * This endpoint attempts to fetch posts using the UGC Posts API.
	 */
	getContent: protectedProcedure
		.input(OrganizationContentRequestSchema)
		.query(async ({ input }) => {
			try {
				// For organization content, we need an organization access token
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const storedPageToken = await getStoredLinkedInPageAccessToken(input.orgId);
					if (storedPageToken) {
						accessToken = storedPageToken.accessToken;
					} else {
						// Fall back to user token
						const userToken = await getStoredLinkedInAccessToken();
						if (userToken) {
							accessToken = userToken.accessToken;
						}
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

				// LinkedIn API doesn't have a direct equivalent to Meta's getPageContent
				// We'll use the UGC Posts API to fetch posts
				// Note: This requires specific permissions and may not return all posts
				try {
					// Attempt to fetch posts using the UGC Posts API
					// This is a simplified implementation - LinkedIn's API structure is different
					// For now, return empty array as LinkedIn API has limited support for fetching posts
					// LinkedIn's UGC Posts API requires specific permissions and may not be available
					const { request } = await import('undici');
					const response = await request(
						`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${input.orgId})&count=${input.limit}`,
						{
							method: 'GET',
							headers: {
								'Authorization': `Bearer ${accessToken}`,
								'LinkedIn-Version': input.apiVersion || '202501',
								'X-Restli-Protocol-Version': '2.0.0',
							},
						}
					);
					const responseData = (await response.body.json()) as any;

					const posts = responseData.elements || [];

					return {
						success: true,
						data: posts.map((post: any) => ({
							id: post.id || post.urn,
							text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
							created_time: post.created?.time || new Date().toISOString(),
							permalink_url: post.permalink || null,
							type: 'post',
							// LinkedIn posts structure is different from Meta
							// We'll map what we can
						})),
						pagination: {
							previous: null,
							next: null,
							cursors: null,
						},
						meta: {
							retrieved_at: new Date().toISOString(),
							org_id: input.orgId,
							content_type: 'posts',
							total_items: posts.length,
						},
					};
				} catch (ugcError) {
					// If UGC Posts API fails, return empty array with a note
					console.warn('LinkedIn UGC Posts API not available or insufficient permissions:', ugcError);
					return {
						success: true,
						data: [],
						pagination: {
							previous: null,
							next: null,
							cursors: null,
						},
						meta: {
							retrieved_at: new Date().toISOString(),
							org_id: input.orgId,
							content_type: 'posts',
							total_items: 0,
							note: 'LinkedIn API has limited support for fetching organization posts. Some posts may not be available.',
						},
					};
				}
			} catch (error) {
				console.error('LinkedIn API organization content error:', error);

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

					if (errorType === 'refresh-token' || error.status === 401) {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.status >= 400 && error.status < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: errorType,
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
					message: 'Failed to retrieve organization content',
				});
			}
		}),

	/**
	 * Publish a post to a LinkedIn Organization
	 * Supports text posts, photo posts, video posts, and scheduled posts
	 */
	publishPost: protectedProcedure
		.input(
			z.object({
				orgId: z.string().min(1, 'Organization ID is required'),
				commentary: z.string().optional(),
				photos: z
					.array(
						z.object({
							url: z.string().url('Photo URL must be a valid URL'),
						})
					)
					.optional(),
				video: z
					.object({
						url: z.string().url('Video file URL must be a valid URL'),
					})
					.optional(),
				scheduledPublishTime: z.number().optional(), // Unix timestamp in milliseconds
				accessToken: z.string().optional(),
				apiVersion: z.string().optional().default('202501'),
				useStoredToken: z.boolean().optional().default(true),
			})
		)
		.mutation(async ({ input }) => {
			try {
				// For publishing posts, we need an organization access token
				let accessToken = input.accessToken;
				if (!accessToken && input.useStoredToken) {
					const storedPageToken = await getStoredLinkedInPageAccessToken(input.orgId);
					if (storedPageToken) {
						accessToken = storedPageToken.accessToken;
					} else {
						// Fall back to user token
						const userToken = await getStoredLinkedInAccessToken();
						if (userToken) {
							accessToken = userToken.accessToken;
						}
					}
				}

				if (!accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'Access token is required. Either provide accessToken in the request or configure stored credentials.',
					});
				}

				const client = createLinkedInClient(accessToken, input.apiVersion);

				// Handle media uploads if provided
				const mediaUrns: string[] = [];

				if (input.photos && input.photos.length > 0) {
					// Upload photos
					for (const photo of input.photos) {
						try {
							// Fetch the image from URL
							const imageResponse = await fetch(photo.url);
							if (!imageResponse.ok) {
								throw new Error(`Failed to fetch image from ${photo.url}`);
							}
							const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
							const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

							// Register upload
							const registerResponse = await client.registerUpload({
								owner: `urn:li:organization:${input.orgId}`,
								recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
								serviceRelationships: [
									{
										relationshipType: 'OWNER',
										identifier: 'urn:li:userGeneratedContent',
									},
								],
							});

							const uploadUrl = registerResponse.value.uploadUrl;
							const assetUrn = registerResponse.value.asset;

							// Upload media
							await client.uploadMedia(uploadUrl, imageBuffer, contentType);
							mediaUrns.push(assetUrn);
						} catch (error) {
							console.error('Failed to upload photo:', error);
							throw new TRPCError({
								code: 'BAD_REQUEST',
								message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
							});
						}
					}
				}

				if (input.video) {
					try {
						// Fetch the video from URL
						const videoResponse = await fetch(input.video.url);
						if (!videoResponse.ok) {
							throw new Error(`Failed to fetch video from ${input.video.url}`);
						}
						const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
						const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

						// Register upload
						const registerResponse = await client.registerUpload({
							owner: `urn:li:organization:${input.orgId}`,
							recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
							serviceRelationships: [
								{
									relationshipType: 'OWNER',
									identifier: 'urn:li:userGeneratedContent',
								},
							],
						});

						const uploadUrl = registerResponse.value.uploadUrl;
						const assetUrn = registerResponse.value.asset;

						// Upload media
						await client.uploadMedia(uploadUrl, videoBuffer, contentType);
						mediaUrns.push(assetUrn);
					} catch (error) {
						console.error('Failed to upload video:', error);
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: `Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`,
						});
					}
				}

				// Publish the post
				let response: { id: string; statusCode: number; headers: Record<string, string> };
				try {
					response = await client.publishPost(input.orgId, {
						commentary: input.commentary,
						media: mediaUrns.length > 0 ? mediaUrns.map(urn => ({ mediaUrn: urn })) : undefined,
						visibility: 'PUBLIC',
						scheduledPublishTime: input.scheduledPublishTime,
					});

					// Check if status code indicates success (200 or 201)
					if (response.statusCode !== 200 && response.statusCode !== 201) {
						throw new LinkedInApiError(
							response.statusCode,
							`LinkedIn API returned status ${response.statusCode} instead of 200/201`,
							undefined
						);
					}

					// LinkedIn returns post ID in x-restli-id header (format: "urn:li:share:123456" or just "123456")
					const postId = response.id;
					if (!postId) {
						throw new LinkedInApiError(
							500,
							'LinkedIn API did not return a post ID',
							undefined
						);
					}

					// Extract numeric ID from URN (e.g., "urn:li:share:123456" -> "123456")
					// Or use the ID directly if it's already numeric
					const postIdMatch = typeof postId === 'string' ? postId.match(/\d+$/) : null;
					const numericId = postIdMatch ? postIdMatch[0] : postId;

					return {
						success: true,
						data: {
							postId: numericId,
							urn: postId.startsWith('urn:') ? postId : `urn:li:share:${postId}`,
							permalink: `https://www.linkedin.com/feed/update/${numericId}`,
						},
						meta: {
							published_at: new Date().toISOString(),
							org_id: input.orgId,
						},
					};
				} catch (error) {
					// Check if it's a duplicate content error
					// LinkedIn sometimes returns this error even when the post is published
					// BUT we should only treat it as success if we can extract a valid share URN
					if (error instanceof LinkedInApiError) {
						const errorMessage = error.message.toLowerCase();
						if ((error.status === 422 || error.status === 400) && 
							(errorMessage.includes('duplicate') || errorMessage.includes('content is a duplicate'))) {
							// Try to extract the share URN from the error message
							const urnMatch = error.message.match(/urn:li:share:(\d+)/i);
							if (urnMatch && urnMatch[1]) {
								const shareId = urnMatch[1];
								// Post was published despite the duplicate error
								// This is a known LinkedIn quirk - they publish but return duplicate error
								return {
									success: true,
									data: {
										postId: shareId,
										urn: `urn:li:share:${shareId}`,
										permalink: `https://www.linkedin.com/feed/update/${shareId}`,
									},
									meta: {
										published_at: new Date().toISOString(),
										org_id: input.orgId,
										note: 'Post published successfully. LinkedIn reported it as duplicate (may have been posted previously).',
									},
								};
							}
							// If we can't extract a share URN, it's a real duplicate error and post was NOT published
							// Fall through to throw the error
						}
					}
					// Re-throw the error - post was NOT published
					throw error;
				}
			} catch (error) {
				console.error('LinkedIn API publish post error:', error);

				if (error instanceof LinkedInApiError) {
					// Check if it's a duplicate error - LinkedIn sometimes returns this even when post succeeds
					const errorMessage = error.message.toLowerCase();
					if ((error.status === 422 || error.status === 400) && 
						(errorMessage.includes('duplicate') || errorMessage.includes('content is a duplicate'))) {
						// Try to extract the share URN from the error message
						const urnMatch = error.message.match(/urn:li:share:(\d+)/i);
						if (urnMatch) {
							const shareId = urnMatch[1];
							// Post was published despite the duplicate error
							return {
								success: true,
								data: {
									postId: shareId,
									urn: `urn:li:share:${shareId}`,
									permalink: `https://www.linkedin.com/feed/update/${shareId}`,
								},
								meta: {
									published_at: new Date().toISOString(),
									org_id: input.orgId,
									note: 'Post published successfully. LinkedIn reported it as duplicate (may have been posted previously).',
								},
							};
						}
					}

					const errorInfo = LinkedInErrorHandler.handleError(error);
					const errorType = (error as any).errorType || errorInfo?.type || 'unknown';

					throw new TRPCError({
						code: error.status === 401 ? 'UNAUTHORIZED' : 'BAD_REQUEST',
						message: errorInfo?.message || error.message,
						cause: {
							linkedInErrorStatus: error.status,
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
					message: 'Failed to publish post',
				});
			}
		}),
});

