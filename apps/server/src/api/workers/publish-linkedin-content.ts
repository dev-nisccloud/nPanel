import { Context } from "hono";
import { db, eq, asc } from "@npanel/db";
import {
	linkedInContentCalendar,
	linkedInContentCalendarMedia,
	linkedInContentCalendarActivityLog,
} from "@npanel/db/schema";
import { createLinkedInClient, LinkedInApiError } from "@npanel/api/lib/linkedin-client";
import { getStoredLinkedInPageAccessToken } from "@npanel/api/lib/linkedin-credentials";
import { LinkedInErrorHandler } from "@npanel/api/lib/linkedin-error-handler";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { verifySignature } from "../../lib/qstash-verify";
import { randomUUID } from "node:crypto";

interface PublishLinkedInContentPayload {
	postId: string;
	pageTokenId: string;
}

export async function handlePublishLinkedInContent(c: Context) {
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

	let body: PublishLinkedInContentPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { postId } = body;
	if (!postId) {
		return c.json({ error: "Missing postId" }, 400);
	}

	const post = await db.query.linkedInContentCalendar.findFirst({
		where: eq(linkedInContentCalendar.id, postId),
		with: {
			mediaItems: {
				orderBy: asc(linkedInContentCalendarMedia.order),
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
		const storedToken = await getStoredLinkedInPageAccessToken(post.pageToken?.pageId || "");
		if (storedToken) {
			accessToken = storedToken.accessToken;
		}
	}

	if (!accessToken || !post.pageToken?.pageId) {
		const errorMessage = "Organization access token not found. Cannot publish post.";
		await db.update(linkedInContentCalendar)
			.set({
				status: "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(linkedInContentCalendar.id, postId));

		await db.insert(linkedInContentCalendarActivityLog).values({
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

	const photos = post.mediaItems?.filter((item) => item.mediaType === "PHOTO") || [];
	const videos = post.mediaItems?.filter((item) => item.mediaType === "VIDEO") || [];

	if (videos.length > 1) {
		const errorMessage = "LinkedIn posts can only have one video";
		await db.update(linkedInContentCalendar)
			.set({
				status: "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(linkedInContentCalendar.id, postId));
		return c.json({ error: errorMessage }, 200);
	}

	if (photos.length > 1 && photos.length < 2) {
		const errorMessage = "LinkedIn carousel posts require at least 2 photos";
		await db.update(linkedInContentCalendar)
			.set({
				status: "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(linkedInContentCalendar.id, postId));
		return c.json({ error: errorMessage }, 200);
	}

	try {
		const client = createLinkedInClient(accessToken, "202501");
		const orgId = post.pageToken.pageId;
		const mediaUrns: string[] = [];

		if (videos.length > 0) {
			const video = videos[0]!;
			const registerResponse = await client.registerUpload({
				owner: `urn:li:organization:${orgId}`,
				recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
				serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
			});
			const fileResponse = await fetch(video.url);
			const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
			await client.uploadMedia(registerResponse.value.uploadUrl, fileBuffer, "video/mp4");
			mediaUrns.push(registerResponse.value.asset);
		} else if (photos.length > 0) {
			for (const photo of photos) {
				const registerResponse = await client.registerUpload({
					owner: `urn:li:organization:${orgId}`,
					recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
					serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
				});
				const fileResponse = await fetch(photo.url);
				const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
				await client.uploadMedia(registerResponse.value.uploadUrl, fileBuffer, "image/jpeg");
				mediaUrns.push(registerResponse.value.asset);
			}
		}

		const response = await client.publishPost(orgId, {
			commentary: post.message || "",
			media: mediaUrns.length > 0 ? mediaUrns.map((urn) => ({ mediaUrn: urn })) : undefined,
			visibility: "PUBLIC",
		});

		const permalink = response.id
			? `https://www.linkedin.com/feed/update/${response.id.replace("urn:li:activity:", "")}`
			: null;

		await db.update(linkedInContentCalendar)
			.set({
				status: "PUBLISHED",
				published: true,
				publishedAt: now,
				publishedPostId: response.id || null,
				publishedPermalink: permalink,
				lastError: null,
				retryCount: 0,
				lastRetryAt: null,
			})
			.where(eq(linkedInContentCalendar.id, postId));

		await db.insert(linkedInContentCalendarActivityLog).values({
			id: randomUUID(),
			userId: post.createdBy,
			calendarPostId: postId,
			action: "PUBLISH",
			description: "Post published successfully to LinkedIn",
			metadata: { linkedInPostId: response.id, permalink, publishedAt: now.toISOString() },
			createdAt: now,
		});

		return c.json({ success: true, postId: post.id, linkedInPostId: response.id, permalink, publishedAt: now.toISOString() });
	} catch (error) {
		let errorMessage = "Failed to publish post";
		let shouldRetry = true;
		if (error instanceof LinkedInApiError) {
			const errorInfo = LinkedInErrorHandler.handleError(error);
			errorMessage = errorInfo?.message || error.message;
			if (error.status === 401 || error.status === 403) shouldRetry = false;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		await db.update(linkedInContentCalendar)
			.set({
				status: shouldRetry ? "SCHEDULED" : "FAILED",
				lastError: errorMessage,
				retryCount: (post.retryCount || 0) + 1,
				lastRetryAt: now,
			})
			.where(eq(linkedInContentCalendar.id, postId));

		await db.insert(linkedInContentCalendarActivityLog).values({
			id: randomUUID(),
			userId: post.createdBy,
			calendarPostId: postId,
			action: "PUBLISH_FAILED",
			description: `Failed to publish post: ${errorMessage}`,
			metadata: { error: errorMessage, retryCount: (post.retryCount || 0) + 1 },
			createdAt: now,
		});

		return c.json({ error: errorMessage, postId, shouldRetry }, shouldRetry ? 500 : 200);
	}
}
