import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { metaAdsCampaignAnalysis } from "@npanel/db/schema";

export async function handleMetaAdsAnalysisWebhook(c: Context) {
	const url = new URL(c.req.url);
	const analysisId = url.searchParams.get("analysisId");

	if (!analysisId) {
		return c.json({ error: "Missing analysisId in webhook URL" }, 400);
	}

	let body: any;
	try {
		body = await c.req.json();
	} catch (err) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { status, output, error } = body;

	console.info(`[Webhook][MetaAdsAnalysis] Received status update for ${analysisId}: ${status}`);

	if (status === "succeeded") {
		// Output from Claude on Replicate is usually an array of strings or a single string
		const analysisText = Array.isArray(output) ? output.join("") : output;

		await db
			.update(metaAdsCampaignAnalysis)
			.set({
				status: "COMPLETED",
				analysis: analysisText,
				updatedAt: new Date(),
			})
			.where(eq(metaAdsCampaignAnalysis.id, analysisId));

		return c.json({ success: true });
	}

	if (status === "failed") {
		console.error(`[Webhook][MetaAdsAnalysis] Prediction failed for ${analysisId}:`, error);
		await db
			.update(metaAdsCampaignAnalysis)
			.set({
				status: "FAILED",
				errorMessage: typeof error === "string" ? error : JSON.stringify(error),
				updatedAt: new Date(),
			})
			.where(eq(metaAdsCampaignAnalysis.id, analysisId));

		return c.json({ success: true });
	}

	return c.json({ message: `Status ${status} ignored` });
}
