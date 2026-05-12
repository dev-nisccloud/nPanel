import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { zeepoCanvasGeneration } from "@npanel/db/schema";
import {
	persistReplicateOutputToUploadThing,
	ReplicatePersistError,
} from "../lib/replicate-uploadthing-persist";

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
			try {
				let output = body.output;
				output = await persistReplicateOutputToUploadThing(output);

				await db
					.update(zeepoCanvasGeneration)
					.set({
						status: "COMPLETED",
						outputs: output,
						completedAt: now,
						updatedAt: now,
					})
					.where(eq(zeepoCanvasGeneration.id, generationId));
			} catch (persistErr) {
				const msg =
					persistErr instanceof ReplicatePersistError
						? persistErr.message
						: persistErr instanceof Error
							? persistErr.message
							: "UploadThing persistence failed";
				console.error(
					"[Webhook][ZeepoCanvas] Persist failed; marking generation FAILED (no Replicate URLs stored):",
					persistErr,
				);
				await db
					.update(zeepoCanvasGeneration)
					.set({
						status: "FAILED",
						errorMessage: msg.slice(0, 500),
						completedAt: now,
						updatedAt: now,
					})
					.where(eq(zeepoCanvasGeneration.id, generationId));
			}
		} else if (status === "failed" || status === "canceled") {
			const error = body.error || `Prediction ${status}`;
			await db
				.update(zeepoCanvasGeneration)
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
