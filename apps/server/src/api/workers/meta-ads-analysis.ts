import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { metaAdsCampaignAnalysis } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";
import { verifySignature } from "../../lib/qstash-verify";
import { env } from "@npanel/env/server";
import { 
    CLAUDE_MODEL, 
    buildCampaignAnalysisSystemPrompt, 
    buildCampaignAnalysisUserPrompt 
} from "../ai/meta-ads-analysis-logic";

export async function handleMetaAdsAnalysis(c: Context) {
	// ── 1. Verify QStash signature ──────────────────────────────────────────
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(c.req.raw, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[MetaAdsAnalysis] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	// ── 2. Parse & validate payload ─────────────────────────────────────────
	let body: { analysisId: string; data: any };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { analysisId, data } = body;
	if (!analysisId) return c.json({ error: "Missing analysisId" }, 400);

	// ── 3. Load analysis record ─────────────────────────────────────────────
	const analysisRecord = await db.query.metaAdsCampaignAnalysis.findFirst({
		where: eq(metaAdsCampaignAnalysis.id, analysisId),
	});

	if (!analysisRecord) {
		console.error(`[MetaAdsAnalysis] Analysis ${analysisId} not found`);
		return c.json({ error: "Analysis record not found" }, 404);
	}

	// Guard against re-entrant runs
	if (analysisRecord.status === "COMPLETED") {
		return c.json({ message: "Analysis already completed" });
	}

	console.info(`[MetaAdsAnalysis] Starting analysis for ${analysisId}`);

	// ── 4. Trigger Replicate Prediction (Claude) ─────────────────────────────
	try {
		const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

		const systemPrompt = buildCampaignAnalysisSystemPrompt();
		const userPrompt = buildCampaignAnalysisUserPrompt(data);
		const webhookUrl = env.REPLICATE_META_ADS_ANALYSIS_WEBHOOK_URL;

		if (!webhookUrl) {
			throw new Error("REPLICATE_META_ADS_ANALYSIS_WEBHOOK_URL is not configured");
		}

		console.info(`[MetaAdsAnalysis] Creating Replicate prediction for ${analysisId} using ${CLAUDE_MODEL}`);
		
		const prediction = await replicate.predictions.create({
			model: CLAUDE_MODEL,
			input: {
				system_prompt: systemPrompt,
				prompt: userPrompt,
				max_tokens: 4096,
			},
			webhook: `${webhookUrl}?analysisId=${analysisId}`,
			webhook_events_filter: ["completed"],
		});

		console.info(`[MetaAdsAnalysis] Prediction created: ${prediction.id}`);

		return c.json({ success: true, predictionId: prediction.id });
	} catch (error) {
		console.error("[MetaAdsAnalysis] Failed to trigger analysis:", error);
		await db
			.update(metaAdsCampaignAnalysis)
			.set({ 
                status: "FAILED", 
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                updatedAt: new Date() 
            })
			.where(eq(metaAdsCampaignAnalysis.id, analysisId));
		return c.json({ error: "Failed to start AI analysis" }, 500);
	}
}
