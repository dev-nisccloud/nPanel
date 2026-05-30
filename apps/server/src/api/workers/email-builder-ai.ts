import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { emailBuilderDesign } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";
import { verifySignature } from "../../lib/qstash-verify";
import { env } from "@npanel/env/server";
import { 
    AiContext, 
    LLM_MODEL, 
    buildSystemPrompt, 
    buildUserPrompt 
} from "../ai/email-builder-logic";

export async function handleEmailBuilderAi(c: Context) {
	// ── 1. Verify QStash signature ──────────────────────────────────────────
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(c.req.raw, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[EmailBuilderAI] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	// ── 2. Parse & validate payload ─────────────────────────────────────────
	let body: { designId: string };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { designId } = body;
	if (!designId) return c.json({ error: "Missing designId" }, 400);

	// ── 3. Load design ──────────────────────────────────────────────────────
	const design = await db.query.emailBuilderDesign.findFirst({
		where: eq(emailBuilderDesign.id, designId),
	});

	if (!design) {
		console.error(`[EmailBuilderAI] Design ${designId} not found`);
		return c.json({ error: "Design not found" }, 404);
	}

	// Guard against re-entrant runs (Stale check: Only skip if COMPLETED)
	if (design.aiStatus === "COMPLETED") {
		console.info(`[EmailBuilderAI] Design ${designId} already completed - skipping`);
		return c.json({ message: "AI generation already completed" });
	}

	console.info(`[EmailBuilderAI] Starting generation for ${designId}. Current Status: ${design.aiStatus}`);

	// ── 4. Mark as PROCESSING ───────────────────────────────────────────────
	await db
		.update(emailBuilderDesign)
		.set({ aiStatus: "PROCESSING", updatedAt: new Date() })
		.where(eq(emailBuilderDesign.id, designId));

	// ── 5. Trigger Phase 1: Layout Generation (Claude) ──────────────────────
	try {
		const context = (design.aiContext as AiContext) ?? {};
		const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

		const systemPrompt = buildSystemPrompt(context);
		const userPrompt = buildUserPrompt(context);
		const webhookUrl = env.REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL;

		if (!webhookUrl) {
			throw new Error("REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL is not configured");
		}

		console.info(`[EmailBuilderAI] Creating Replicate prediction for ${designId} using ${LLM_MODEL}`);
		
		// Trigger Claude as a prediction with a webhook
		const prediction = await replicate.predictions.create({
			model: LLM_MODEL,
			input: {
				system_prompt: systemPrompt,
				prompt: userPrompt,
				max_tokens: 8192,
			},
			webhook: `${webhookUrl}?designId=${designId}&phase=layout`,
			webhook_events_filter: ["completed"],
		});

		console.info(`[EmailBuilderAI] Prediction created: ${prediction.id}`);

		console.info(`[EmailBuilderAI] Triggered layout generation for ${designId}`);
		return c.json({ success: true, phase: "layout_triggered" });
	} catch (error) {
		console.error("[EmailBuilderAI] Failed to trigger layout phase:", error);
		await db
			.update(emailBuilderDesign)
			.set({ aiStatus: "FAILED", updatedAt: new Date() })
			.where(eq(emailBuilderDesign.id, designId));
		return c.json({ error: "Failed to start AI generation" }, 500);
	}
}