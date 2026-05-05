import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
import type { MetaAdsAnalysisJobPayload, MetaAdsAnalysisJobResult } from "./types";

function getWorkerEndpoint(): string {
	const url = env.QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT;
	return url ? url.replace(/\/$/, "") : "";
}

function isLoopbackUrl(url: string): boolean {
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase();
		return (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host === "::1" ||
			host === "[::1]"
		);
	} catch {
		return false;
	}
}

/**
 * Enqueue an AI analysis job for Meta Ads via QStash.
 */
export async function enqueueMetaAdsAnalysis(
	analysisId: string,
    data: any
): Promise<MetaAdsAnalysisJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"Meta Ads analysis worker URL not configured. Set QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT.",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. For local development set QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT to a public URL (e.g. from ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: MetaAdsAnalysisJobPayload = { analysisId, data };

	const result = await client.publishJSON({
		url,
		body: payload,
		timeout: 900,
		retries: 0,
	});

	const messageId =
		"messageId" in result && typeof (result as any).messageId === "string"
			? (result as any).messageId
			: "";
			
	return { messageId };
}
