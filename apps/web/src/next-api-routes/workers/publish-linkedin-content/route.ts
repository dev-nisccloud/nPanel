import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import prisma from '@npanel/db';
import { createLinkedInClient, LinkedInApiError } from '@nPanel/api/lib/linkedin-client';
import { getStoredLinkedInPageAccessToken } from '@nPanel/api/lib/linkedin-credentials';
import { LinkedInErrorHandler } from '@nPanel/api/lib/linkedin-error-handler';
import { getQStashSigningKeys } from '@nPanel/api/lib/qstash/client';
import { randomUUID } from 'node:crypto';
// Use native fetch instead of undici for better compatibility

// Use Node.js runtime for worker endpoint (required for QStash signature verification)
export const runtime = 'nodejs';

/**
 * Worker endpoint for publishing scheduled LinkedIn content calendar posts
 * Called by QStash at the scheduled publish time
 * 
 * Environment variables required:
 * - QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY
 */
export async function POST(request: NextRequest) {
	try {
		// Verify QStash signature
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current,
			nextSigningKey: signingKeys.next,
		});

		// Parse request body
		const body = await request.json();
		const { postId, pageTokenId } = body;

		if (!postId || !pageTokenId) {
			return NextResponse.json(
				{ error: 'Missing postId or pageTokenId in request body' },
				{ status: 400 }
			);
		}

		// Fetch the post from database
		const post = await prisma.linkedInContentCalendar.findUnique({
			where: { id: postId },
			include: {
				mediaItems: {
					orderBy: { order: 'asc' },
				},
				pageToken: {
					select: {
						pageId: true,
						accessToken: true,
					},
				},
			},
		});

		if (!post) {
			return NextResponse.json(
				{ error: 'Post not found' },
				{ status: 404 }
			);
		}

		// Validate post is still scheduled and not published
		if (post.published) {
			return NextResponse.json(
				{ error: 'Post already published', postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		if (post.status !== 'SCHEDULED') {
			return NextResponse.json(
				{ error: `Post status is ${post.status}, not SCHEDULED`, postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		// Validate scheduled time has passed (with 5 minute grace period)
		const now = new Date();
		const scheduledTime = new Date(post.scheduledPublishTime);
		const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

		if (scheduledTime.getTime() > now.getTime() + gracePeriod) {
			return NextResponse.json(
				{ error: 'Scheduled time has not been reached yet', postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		// Get organization access token
		let accessToken: string | null = null;
		if (post.pageToken?.accessToken) {
			accessToken = post.pageToken.accessToken;
		} else {
			// Fallback: try to get stored organization token
			const storedToken = await getStoredLinkedInPageAccessToken(post.pageToken?.pageId || '');
			if (storedToken) {
				accessToken = storedToken.accessToken;
			}
		}

		if (!accessToken || !post.pageToken?.pageId) {
			const errorMessage = 'Organization access token not found. Cannot publish post.';
			await prisma.linkedInContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});

			// Log activity
			await prisma.linkedInContentCalendarActivityLog.create({
				data: {
					id: `activity_${randomUUID()}`,
					userId: post.createdBy,
					calendarPostId: postId,
					action: 'PUBLISH_FAILED',
					description: errorMessage,
					metadata: {
						reason: 'missing_access_token',
					},
					createdAt: now,
				},
			});

			return NextResponse.json(
				{ error: errorMessage },
				{ status: 500 } // Return 500 to trigger QStash retry
			);
		}

		// Prepare media for publishing
		const photos = post.mediaItems?.filter((item) => item.mediaType === 'PHOTO') || [];
		const videos = post.mediaItems?.filter((item) => item.mediaType === 'VIDEO') || [];

		// LinkedIn constraints: max 1 video, multiple photos (min 2 for carousel)
		if (videos.length > 1) {
			const errorMessage = 'LinkedIn posts can only have one video';
			await prisma.linkedInContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});
			return NextResponse.json(
				{ error: errorMessage },
				{ status: 200 } // Don't retry - this is a validation error
			);
		}

		if (photos.length > 1 && photos.length < 2) {
			const errorMessage = 'LinkedIn carousel posts require at least 2 photos';
			await prisma.linkedInContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});
			return NextResponse.json(
				{ error: errorMessage },
				{ status: 200 } // Don't retry - this is a validation error
			);
		}

		// Publish to LinkedIn API
		try {
			const client = createLinkedInClient(accessToken, '202501');
			const orgId = post.pageToken.pageId;

			// Handle media upload if present
			const mediaUrns: string[] = [];

			if (videos.length > 0) {
				// Upload video
				const video = videos[0]!;
				try {
					// Register upload for video
					const registerResponse = await client.registerUpload({
						owner: `urn:li:organization:${orgId}`,
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

					// Download file from URL and upload to LinkedIn
					const fileResponse = await fetch(video.url);
					const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
					const contentType = 'video/mp4'; // Default, could be determined from file

					// Upload to LinkedIn
					await client.uploadMedia(uploadUrl, fileBuffer, contentType);

					mediaUrns.push(assetUrn);
				} catch (error) {
					console.error('Failed to upload video:', error);
					throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
			} else if (photos.length > 0) {
				// Upload photos
				for (const photo of photos) {
					try {
						// Register upload for photo
						const registerResponse = await client.registerUpload({
							owner: `urn:li:organization:${orgId}`,
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

						// Download file from URL and upload to LinkedIn
					const fileResponse = await fetch(photo.url);
					const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
						const contentType = 'image/jpeg'; // Default, could be determined from file

						// Upload to LinkedIn
						await client.uploadMedia(uploadUrl, fileBuffer, contentType);

						mediaUrns.push(assetUrn);
					} catch (error) {
						console.error('Failed to upload photo:', error);
						throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}
				}
			}

			// Publish post
			const response = await client.publishPost(orgId, {
				commentary: post.message || '',
				media: mediaUrns.length > 0 ? mediaUrns.map((urn) => ({ mediaUrn: urn })) : undefined,
				visibility: 'PUBLIC',
			});

			// Construct permalink (LinkedIn post URL format)
			const permalink = response.id 
				? `https://www.linkedin.com/feed/update/${response.id.replace('urn:li:activity:', '')}`
				: null;

			// Update post as published
			await prisma.linkedInContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'PUBLISHED',
					published: true,
					publishedAt: now,
					publishedPostId: response.id || null,
					publishedPermalink: permalink,
					lastError: null,
					retryCount: 0,
					lastRetryAt: null,
				},
			});

			// Log successful publish activity
			await prisma.linkedInContentCalendarActivityLog.create({
				data: {
					id: `activity_${randomUUID()}`,
					userId: post.createdBy,
					calendarPostId: postId,
					action: 'PUBLISH',
					description: 'Post published successfully to LinkedIn',
					metadata: {
						linkedInPostId: response.id,
						permalink,
						publishedAt: now.toISOString(),
					},
					createdAt: now,
				},
			});

			return NextResponse.json({
				success: true,
				postId: post.id,
				linkedInPostId: response.id,
				permalink,
				publishedAt: now.toISOString(),
			});
		} catch (error) {
			console.error('LinkedIn API publish post error:', error);

			// Handle LinkedIn API errors
			let errorMessage = 'Failed to publish post';
			let shouldRetry = true;

			if (error instanceof LinkedInApiError) {
				const errorInfo = LinkedInErrorHandler.handleError(error);
				errorMessage = errorInfo?.message || error.message;
				
				// Don't retry on certain errors (e.g., invalid token, permission denied)
				if (error.status === 401 || error.status === 403) {
					shouldRetry = false;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			// Update post with error
			await prisma.linkedInContentCalendar.update({
				where: { id: postId },
				data: {
					status: shouldRetry ? 'SCHEDULED' : 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});

			// Log failed publish activity
			await prisma.linkedInContentCalendarActivityLog.create({
				data: {
					id: `activity_${randomUUID()}`,
					userId: post.createdBy,
					calendarPostId: postId,
					action: 'PUBLISH_FAILED',
					description: `Failed to publish post: ${errorMessage}`,
					metadata: {
						error: errorMessage,
						retryCount: post.retryCount + 1,
						...(error instanceof LinkedInApiError && {
							linkedInErrorStatus: error.status,
							linkedInErrorCode: error.serviceErrorCode,
						}),
					},
					createdAt: now,
				},
			});

			// Return appropriate status code
			// 500 will trigger QStash retry, 200 will not
			return NextResponse.json(
				{
					error: errorMessage,
					postId: post.id,
					retryCount: post.retryCount + 1,
					shouldRetry,
				},
				{ status: shouldRetry ? 500 : 200 }
			);
		}
	} catch (error) {
		console.error('Worker endpoint error:', error);

		// If signature verification fails, return 401
		if (error instanceof Error && error.message.includes('signature')) {
			return NextResponse.json(
				{ error: 'Invalid QStash signature' },
				{ status: 401 }
			);
		}

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			{ status: 500 }
		);
	}
}




