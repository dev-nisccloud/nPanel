import { Context } from "hono";
import Replicate from "replicate";
import { db, eq } from "@npanel/db";
import { zeepoAgentGeneration } from "@npanel/db/schema";
import { user as userTable } from "@npanel/db/schema/auth";
import { billZeepoAgentPredictionById } from "@npanel/api/lib/zeepo-agent-bill-prediction";
import { buildReplicateInput } from "@npanel/api/lib/replicate-model-input";
import {
	persistReplicateOutputToUploadThing,
	ReplicatePersistError,
} from "../lib/replicate-uploadthing-persist";
import { resolveZeepoAgentStoredErrorMessage } from "@npanel/api/lib/zeepo-agent-errors";

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

				const predictionId =
					(typeof body.id === "string" ? body.id : null) ??
					generation.predictionId;
				if (predictionId && generation.teamId && process.env.REPLICATE_API_TOKEN) {
					try {
						const dbUser = await db.query.user.findFirst({
							where: eq(userTable.id, generation.userId),
							columns: { role: true },
						});
						const replicate = new Replicate({
							auth: process.env.REPLICATE_API_TOKEN,
						});
						await billZeepoAgentPredictionById({
							replicate,
							billing: {
								teamId: generation.teamId,
								userId: generation.userId,
								userRole: dbUser?.role,
								sessionId: generation.sessionId,
							},
							predictionId,
							modelId: generation.modelId,
							operationType: "media_generation",
							generationId,
							output,
							predictionInput: buildReplicateInput({
								modelId: generation.modelId,
								prompt: generation.prompt,
								inputs: generation.inputs,
							}),
						});
					} catch (billErr) {
						console.error("[Webhook][ZeepoAgent] Token billing failed:", billErr);
					}
				}
			} catch (persistErr) {
				console.error(
					"[Webhook][ZeepoAgent] Persist failed; marking generation FAILED (no Replicate URLs stored):",
					persistErr,
				);
				await db
					.update(zeepoAgentGeneration)
					.set({
						status: "FAILED",
						errorMessage: resolveZeepoAgentStoredErrorMessage(persistErr),
						completedAt: now,
						updatedAt: now,
					})
					.where(eq(zeepoAgentGeneration.id, generationId));
			}
		} else if (status === "failed" || status === "canceled") {
			const error = body.error || `Prediction ${status}`;
			console.error("[Webhook][ZeepoAgent] Replicate prediction failed:", error);
			await db
				.update(zeepoAgentGeneration)
				.set({
					status: "FAILED",
					errorMessage: resolveZeepoAgentStoredErrorMessage(error),
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
