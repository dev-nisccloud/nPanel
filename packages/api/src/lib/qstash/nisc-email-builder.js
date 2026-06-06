import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
function getWorkerEndpoint() {
    const url = env.QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT;
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
export async function enqueueNebBuildJob(jobId) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Nisc Email Builder worker URL not configured. Set QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. Set QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT to a public URL (e.g. ngrok).");
    }
    const client = getQStashClient();
    const payload = { jobId };
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
