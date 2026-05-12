import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { zeepoAgentGeneration } from "@npanel/db/schema";
import {
	persistReplicateOutputToUploadThing,
	ReplicatePersistError,
} from "../lib/replicate-uploadthing-persist";

export async function handleZeepoAgentWebhook(c: Context) {
	try {
		const generationId = c.req.query("generationId");

		if (!generationId) {
			return c.json({ error: "Missing generationId in query params" }, 400);
		}

		const body = await c.req.json();
		const status = body.status as string | undefined;

		if (!status) {
			return c.json({ error: "Missing status in payload" }, 400);
		}

		const generation = await db.query.zeepoAgentGeneration.findFirst({
			where: eq(zeepoAgentGeneration.id, generationId),
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
					.update(zeepoAgentGeneration)
					.set({
						status: "COMPLETED",
						outputs: output as any,
						completedAt: now,
						updatedAt: now,
					})
					.where(eq(zeepoAgentGeneration.id, generationId));
			} catch (persistErr) {
				const msg =
					persistErr instanceof ReplicatePersistError
						? persistErr.message
						: persistErr instanceof Error
							? persistErr.message
							: "UploadThing persistence failed";
				console.error(
					"[Webhook][ZeepoAgent] Persist failed; marking generation FAILED (no Replicate URLs stored):",
					persistErr,
				);
				await db
					.update(zeepoAgentGeneration)
					.set({
						status: "FAILED",
						errorMessage: msg.slice(0, 500),
						completedAt: now,
						updatedAt: now,
					})
					.where(eq(zeepoAgentGeneration.id, generationId));
			}
		} else if (status === "failed" || status === "canceled") {
			const error = body.error || `Prediction ${status}`;
			await db
				.update(zeepoAgentGeneration)
				.set({
					status: "FAILED",
					errorMessage: String(error).slice(0, 500),
					completedAt: now,
					updatedAt: now,
				})
				.where(eq(zeepoAgentGeneration.id, generationId));
		}

		return c.json({ success: true });
	} catch (error) {
		console.error("[Webhook][ZeepoAgent] Error processing Replicate webhook:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
}
