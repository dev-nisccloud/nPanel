import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
function getWorkerEndpoint() {
    const url = env.QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT;
    return url ? url.replace(/\/$/, "") : "";
}
function isLoopbackUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        return (host === "localhost" ||
            host === "127.0.0.1" ||
            host === "::1" ||
            host === "[::1]");
    }
    catch {
        return false;
    }
}
/**
 * Enqueue an AI analysis job for Meta Ads via QStash.
 */
export async function enqueueMetaAdsAnalysis(analysisId, data) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Meta Ads analysis worker URL not configured. Set QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. For local development set QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT to a public URL (e.g. from ngrok).");
    }
    const client = getQStashClient();
    const payload = { analysisId, data };
    const result = await client.publishJSON({
        url,
        body: payload,
        timeout: 900,
        retries: 0,
    });
    const messageId = "messageId" in result && typeof result.messageId === "string"
        ? result.messageId
        : "";
    return { messageId };
}
