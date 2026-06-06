import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
function getWorkerEndpoint() {
    const url = env.QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT;
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
 * Enqueue an AI generation job for Zeepo Canvas via QStash.
 * Delivers immediately. The worker will make the async request to Replicate.
 */
export async function enqueueZeepoCanvasGeneration(generationId) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Zeepo Canvas worker URL not configured. Set QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. For local development set QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT to a public URL (e.g. from ngrok).");
    }
    const client = getQStashClient();
    const payload = { generationId };
    const configuredTimeout = process.env.QSTASH_ZEEPO_CANVAS_TIMEOUT !== undefined
        ? Number(process.env.QSTASH_ZEEPO_CANVAS_TIMEOUT) || 900
        : 900;
    const timeout = Math.min(configuredTimeout, 900);
    const retries = process.env.QSTASH_ZEEPO_CANVAS_RETRIES !== undefined
        ? Number(process.env.QSTASH_ZEEPO_CANVAS_RETRIES) || 0
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
