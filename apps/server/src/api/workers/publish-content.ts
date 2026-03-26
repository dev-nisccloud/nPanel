import { Context } from "hono";
import { db, eq, asc } from "@npanel/db";
import {
	metaContentCalendar,
	metaContentCalendarMedia,
	metaContentCalendarActivityLog,
} from "@npanel/db/schema";
import { createMetaClient, MetaApiError } from "@npanel/api/lib/meta-client";
import { getStoredPageAccessToken } from "@npanel/api/lib/meta-credentials";
import { MetaErrorHandler } from "@npanel/api/lib/meta-error-handler";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { verifySignature } from "../../lib/qstash-verify";
import { randomUUID } from "node:crypto";

interface PublishContentPayload {
	postId: string;
	pageTokenId: string;
}

export async function handlePublishContent(c: Context) {
	const request = c.req.raw;
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: PublishContentPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { postId } = body;
	if (!postId) {
		return c.json({ error: "Missing postId" }, 400);
	}

	const post = await db.query.metaContentCalendar.findFirst({
		where: eq(metaContentCalendar.id, postId),
		with: {
			mediaItems: {
				orderBy: asc(metaContentCalendarMedia.order),
			},
			pageToken: {
				columns: {
					pageId: true,
					accessToken: true,
				},
			},
		},
	});

	if (!post) {
		return c.json({ error: "Post not found" }, 404);
	}

	if (post.published) {
		return c.json({ error: "Post already published", postId: post.id }, 200);
	}

	if (post.status !== "SCHEDULED") {
		return c.json({ error: `Post status is ${post.status}, not SCHEDULED`, postId: post.id }, 200);
	}

	const now = new Date();
	const scheduledTime = new Date(post.scheduledPublishTime);
	const gracePeriod = 5 * 60 * 1000;
	if (scheduledTime.getTime() > now.getTime() + gracePeriod) {
		return c.json({ error: "Scheduled time has not been reached yet", postId: post.id }, 200);
	}

	let accessToken: string | null = null;
	if (post.pageToken?.accessToken) {
		accessToken = post.pageToken.accessToken;
	} else {
		const storedToken = await getStoredPageAccessToken(post.pageToken?.pageId || "");
		if (storedToken) {
			accessToken = storedToken.accessToken;
		}
	}

	if (!accessToken || !post.pageToken?.pageId) {
		const errorMessage = "Page access token not found. Cannot publish post.";
		await db.update(metaContentCalendar)
			.set({
				status: "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(metaContentCalendar.id, postId));

		await db.insert(metaContentCalendarActivityLog).values({
			id: randomUUID(),
			userId: post.createdBy,
			calendarPostId: postId,
			action: "PUBLISH_FAILED",
			description: errorMessage,
			metadata: { reason: "missing_access_token" },
			createdAt: now,
		});

		return c.json({ error: errorMessage }, 500);
	}

	const photos = post.mediaItems
		?.filter((item) => item.mediaType === "PHOTO")
		.map((item) => ({
			url: item.url,
			caption: item.caption || undefined,
		}));

	const videos = post.mediaItems?.filter((item) => item.mediaType === "VIDEO");
	const video = videos && videos.length > 0
		? {
			file_url: videos[0]!.url,
			description: videos[0]!.description || undefined,
		}
		: undefined;

	try {
		const client = createMetaClient(accessToken, "v24.0");
		const response = await client.publishPost(post.pageToken.pageId, {
			message: post.message || undefined,
			photos: photos && photos.length > 0 ? photos : undefined,
			video,
			published: true,
		});

		await db.update(metaContentCalendar)
			.set({
				status: "PUBLISHED",
				published: true,
				publishedAt: now,
				publishedPostId: response.id || null,
				publishedPermalink: response.permalink_url || null,
				lastError: null,
				retryCount: 0,
				lastRetryAt: null,
			})
			.where(eq(metaContentCalendar.id, postId));

		await db.insert(metaContentCalendarActivityLog).values({
			id: randomUUID(),
			userId: post.createdBy,
			calendarPostId: postId,
			action: "PUBLISH",
			description: "Post published successfully to Facebook",
			metadata: {
				facebookPostId: response.id,
				permalink: response.permalink_url,
				publishedAt: now.toISOString(),
			},
			createdAt: now,
		});

		return c.json({
			success: true,
			postId: post.id,
			facebookPostId: response.id,
			permalink: response.permalink_url,
			publishedAt: now.toISOString(),
		});
	} catch (error) {
		let errorMessage = "Failed to publish post";
		let shouldRetry = true;

		if (error instanceof MetaApiError) {
			const errorInfo = MetaErrorHandler.handleError(error);
			errorMessage = errorInfo?.message || error.message;
			if (error.code === 190 || error.code === 200) {
				shouldRetry = false;
			}
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		await db.update(metaContentCalendar)
			.set({
				status: shouldRetry ? "SCHEDULED" : "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(metaContentCalendar.id, postId));

		await db.insert(metaContentCalendarActivityLog).values({
			id: randomUUID(),
			userId: post.createdBy,
			calendarPostId: postId,
			action: "PUBLISH_FAILED",
			description: `Failed to publish post: ${errorMessage}`,
			metadata: {
				error: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
			},
			createdAt: now,
		});

		return c.json({ error: errorMessage, postId, shouldRetry }, shouldRetry ? 500 : 200);
	}
}
