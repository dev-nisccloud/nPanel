import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { zeepoCanvasGeneration } from "@npanel/db/schema";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Helper to check if a string is a URL (specifically from Replicate delivery)
 */
function isReplicateUrl(val: any): boolean {
	if (typeof val !== "string") return false;
	const isUrl = val.startsWith("http");
	const isReplicate = val.includes("replicate.delivery") || val.includes("replicate.com") || val.includes("replicate.cache");
	return isUrl && isReplicate;
}

/**
 * Recursively find and upload URLs in the output to persistent storage
 */
async function persistOutput(output: any): Promise<any> {
	if (!output) return output;

	// Case 1: Simple URL string
	if (isReplicateUrl(output)) {
		try {
			console.log("[PersistOutput] Re-uploading Replicate URL to UploadThing:", output);
			const res = await utapi.uploadFilesFromUrl(output);
			const result = Array.isArray(res) ? res[0] : res;
			
			if (result?.data) {
				const persistentUrl = result.data.ufsUrl || result.data.url;
				console.log("[PersistOutput] Successfully persisted to:", persistentUrl);
				return persistentUrl;
			} else if (result?.error) {
				console.error("[PersistOutput] UploadThing error:", result.error);
			}
		} catch (e) {
			console.error("[PersistOutput] Upload failed for URL:", output, e);
		}
		return output; // Fallback to original if upload fails
	}

	// Case 2: Array of items (process in parallel for speed)
	if (Array.isArray(output)) {
		return Promise.all(output.map(item => persistOutput(item)));
	}

	// Case 3: Object with properties (like Whisper { text: "...", audio: "..." })
	if (typeof output === "object" && output !== null) {
		const newObj: any = {};
		const entries = Object.entries(output);
		
		// Process object keys in parallel
		await Promise.all(entries.map(async ([key, value]) => {
			newObj[key] = await persistOutput(value);
		}));
		
		return newObj;
	}

	return output;
}

export async function handleZeepoCanvasWebhook(c: Context) {
	try {
		const generationId = c.req.query("generationId");

		if (!generationId) {
			return c.json({ error: "Missing generationId in query params" }, 400);
		}

		const body = await c.req.json();
		const status = body.status; // 'succeeded', 'failed', 'canceled'

		if (!status) {
			return c.json({ error: "Missing status in payload" }, 400);
		}

		const generation = await db.query.zeepoCanvasGeneration.findFirst({
			where: eq(zeepoCanvasGeneration.id, generationId),
		});

		if (!generation) {
			return c.json({ error: "Generation not found" }, 404);
		}

		if (generation.status === "COMPLETED" || generation.status === "FAILED") {
			return c.json({ message: "Generation already processed" }, 200);
		}

		const now = new Date();

		if (status === "succeeded") {
			// 1. Process and persist outputs BEFORE marking as completed
			let output = body.output;
			output = await persistOutput(output);

			// 2. Now update the DB with the permanent URLs and final status
			await db.update(zeepoCanvasGeneration)
				.set({
					status: "COMPLETED",
					outputs: output,
					completedAt: now,
					updatedAt: now,
				})
				.where(eq(zeepoCanvasGeneration.id, generationId));
		} else if (status === "failed" || status === "canceled") {
			const error = body.error || `Prediction ${status}`;
			await db.update(zeepoCanvasGeneration)
				.set({
					status: "FAILED",
					errorMessage: String(error).slice(0, 500),
					completedAt: now,
					updatedAt: now,
				})
				.where(eq(zeepoCanvasGeneration.id, generationId));
		}

		return c.json({ success: true });
	} catch (error) {
		console.error("[Webhook][ZeepoCanvas] Error processing Replicate webhook:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
}
