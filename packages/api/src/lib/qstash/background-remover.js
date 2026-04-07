import { getQStashClient } from "./client";
/**
 * Worker URL must be set explicitly (Option A).
 * Use QSTASH_BACKGROUND_REMOVER_WORKER_ENDPOINT, e.g.:
 * - Production: https://app.yourdomain.com/api/workers/background-remover
 * - Local (ngrok): https://your-subdomain.ngrok.io/api/workers/background-remover
 */
function getWorkerEndpoint() {
    const url = process.env.QSTASH_BACKGROUND_REMOVER_WORKER_ENDPOINT?.trim();
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
 * Enqueue a background-removal job for processing via QStash.
 * Delivers immediately (no schedule); worker processes at once.
 */
export async function enqueueBackgroundRemoval(generationId) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Background remover worker URL not configured. Set QSTASH_BACKGROUND_REMOVER_WORKER_ENDPOINT (e.g. https://your-app.com/api/workers/background-remover).");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. For local development set QSTASH_BACKGROUND_REMOVER_WORKER_ENDPOINT to a public URL (e.g. from ngrok).");
    }
    const client = getQStashClient();
    const payload = { generationId };
    const configuredTimeout = process.env.QSTASH_BACKGROUND_REMOVER_TIMEOUT !== undefined
        ? Number(process.env.QSTASH_BACKGROUND_REMOVER_TIMEOUT) || 300
        : 300;
    const timeout = Math.min(configuredTimeout, 900);
    const retries = process.env.QSTASH_BACKGROUND_REMOVER_RETRIES !== undefined
        ? Number(process.env.QSTASH_BACKGROUND_REMOVER_RETRIES) || 0
        : undefined;
    const result = await client.publishJSON({
        url,
        body: payload,
        timeout,
        ...(retries !== undefined ? { retries } : {}),
    });
    const messageId = "messageId" in result && typeof result.messageId === "string"
        ? result.messageId
        : "";
    return { messageId };
}
