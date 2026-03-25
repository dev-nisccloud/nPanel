import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from '@npanel/db';
import { createMetaClient, MetaApiError } from '@npanel/api/lib/meta-client';
import { getStoredPageAccessToken } from '@npanel/api/lib/meta-credentials';
import { MetaErrorHandler } from '@npanel/api/lib/meta-error-handler';
import { getQStashSigningKeys } from '@npanel/api/lib/qstash/client';
import { randomUUID } from 'node:crypto';

// Use Node.js runtime for worker endpoint (required for QStash signature verification)

/**
 * Worker endpoint for publishing scheduled content calendar posts
 * Called by QStash at the scheduled publish time
 * 
 * Environment variables required:
 * - QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY
 */
export async function POST(request: Request) {
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
			return Response.json(
				{ error: 'Missing postId or pageTokenId in request body' },
				{ status: 400 }
			);
		}

		// Fetch the post from database
		const post = await prisma.metaContentCalendar.findUnique({
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
			return Response.json(
				{ error: 'Post not found' },
				{ status: 404 }
			);
		}

		// Validate post is still scheduled and not published
		if (post.published) {
			return Response.json(
				{ error: 'Post already published', postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		if (post.status !== 'SCHEDULED') {
			return Response.json(
				{ error: `Post status is ${post.status}, not SCHEDULED`, postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		// Validate scheduled time has passed (with 5 minute grace period)
		const now = new Date();
		const scheduledTime = new Date(post.scheduledPublishTime);
		const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

		if (scheduledTime.getTime() > now.getTime() + gracePeriod) {
			return Response.json(
				{ error: 'Scheduled time has not been reached yet', postId: post.id },
				{ status: 200 } // Return 200 to prevent QStash retries
			);
		}

		// Get page access token
		let accessToken: string | null = null;
		if (post.pageToken?.accessToken) {
			accessToken = post.pageToken.accessToken;
		} else {
			// Fallback: try to get stored page token
			const storedToken = await getStoredPageAccessToken(post.pageToken?.pageId || '');
			if (storedToken) {
				accessToken = storedToken.accessToken;
			}
		}

		if (!accessToken || !post.pageToken?.pageId) {
			const errorMessage = 'Page access token not found. Cannot publish post.';
			await prisma.metaContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});

			// Log activity
			await prisma.metaContentCalendarActivityLog.create({
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

			return Response.json(
				{ error: errorMessage },
				{ status: 500 } // Return 500 to trigger QStash retry
			);
		}

		// Prepare media for publishing
		const photos = post.mediaItems
			?.filter((item) => item.mediaType === 'PHOTO')
			.map((item) => ({
				url: item.url,
				caption: item.caption || undefined,
			}));

		const videos = post.mediaItems?.filter((item) => item.mediaType === 'VIDEO');
		const video = videos && videos.length > 0
			? {
				file_url: videos[0]!.url,
				description: videos[0]!.description || undefined,
			}
			: undefined;

		// Publish to Meta API
		try {
			const client = createMetaClient(accessToken, 'v24.0');
			const response = await client.publishPost(post.pageToken.pageId, {
				message: post.message || undefined,
				photos: photos && photos.length > 0 ? photos : undefined,
				video,
				published: true, // Always publish immediately (scheduling is handled by QStash)
			});

			// Update post as published
			await prisma.metaContentCalendar.update({
				where: { id: postId },
				data: {
					status: 'PUBLISHED',
					published: true,
					publishedAt: now,
					publishedPostId: response.id || null,
					publishedPermalink: response.permalink_url || null,
					lastError: null,
					retryCount: 0,
					lastRetryAt: null,
				},
			});

			// Log successful publish activity
			await prisma.metaContentCalendarActivityLog.create({
				data: {
					id: `activity_${randomUUID()}`,
					userId: post.createdBy,
					calendarPostId: postId,
					action: 'PUBLISH',
					description: 'Post published successfully to Facebook',
					metadata: {
						facebookPostId: response.id,
						permalink: response.permalink_url,
						publishedAt: now.toISOString(),
					},
					createdAt: now,
				},
			});

			return Response.json({
				success: true,
				postId: post.id,
				facebookPostId: response.id,
				permalink: response.permalink_url,
				publishedAt: now.toISOString(),
			});
		} catch (error) {
			console.error('Meta API publish post error:', error);

			// Handle Meta API errors
			let errorMessage = 'Failed to publish post';
			let shouldRetry = true;

			if (error instanceof MetaApiError) {
				const errorInfo = MetaErrorHandler.handleError(error);
				errorMessage = errorInfo?.message || error.message;

				// Don't retry on certain errors (e.g., invalid token, permission denied)
				if (error.code === 190 || error.code === 200) {
					shouldRetry = false;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			// Update post with error
			await prisma.metaContentCalendar.update({
				where: { id: postId },
				data: {
					status: shouldRetry ? 'SCHEDULED' : 'FAILED',
					lastError: errorMessage,
					retryCount: post.retryCount + 1,
					lastRetryAt: now,
				},
			});

			// Log failed publish activity
			await prisma.metaContentCalendarActivityLog.create({
				data: {
					id: `activity_${randomUUID()}`,
					userId: post.createdBy,
					calendarPostId: postId,
					action: 'PUBLISH_FAILED',
					description: `Failed to publish post: ${errorMessage}`,
					metadata: {
						error: errorMessage,
						retryCount: post.retryCount + 1,
						...(error instanceof MetaApiError && {
							metaErrorCode: error.code,
							metaErrorType: error.type,
						}),
					},
					createdAt: now,
				},
			});

			// Return appropriate status code
			// 500 will trigger QStash retry, 200 will not
			return Response.json(
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
			return Response.json(
				{ error: 'Invalid QStash signature' },
				{ status: 401 }
			);
		}

		return Response.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			{ status: 500 }
		);
	}
}

