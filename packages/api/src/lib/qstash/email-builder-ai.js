import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
function getWorkerEndpoint() {
    const url = env.QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT;
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
 * Enqueue an AI generation job for Email Builder via QStash.
 * Delivers immediately. The worker will handle the async orchestration.
 */
export async function enqueueEmailBuilderAiGeneration(designId) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Email Builder AI worker URL not configured. Set QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. For local development set QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT to a public URL (e.g. from ngrok).");
    }
    const client = getQStashClient();
    const payload = { designId };
    // Email generation can be slow (Claude + multiple images)
    // We set a high timeout (900s is QStash max)
    const timeout = 900;
    const result = await client.publishJSON({
        url,
        body: payload,
        timeout,
        retries: 0, // Don't retry AI generation automatically as it's expensive
    });
    const messageId = "messageId" in result && typeof result.messageId === "string"
        ? result.messageId
        : "";
    return { messageId };
}
