import { getQStashClient } from "./client";
const NISC_EM_DISPATCH_WORKER_PATH = "/api/workers/nisc-em-dispatch";
function getWorkerEndpoint() {
    if (process.env.QSTASH_NISC_EM_DISPATCH_WORKER_ENDPOINT) {
        return process.env.QSTASH_NISC_EM_DISPATCH_WORKER_ENDPOINT.replace(/\/$/, "");
    }
    const baseUrl = process.env.VITE_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    if (baseUrl) {
        return baseUrl.replace(/\/$/, "") + NISC_EM_DISPATCH_WORKER_PATH;
    }
    return "";
}
function isLoopbackUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
    }
    catch {
        return false;
    }
}
/**
 * Enqueue a campaign-scoped Nisc email marketing dispatcher run.
 */
export async function enqueueNiscEmDispatch(campaignId, scheduledFor) {
    const url = getWorkerEndpoint();
    if (!url) {
        throw new Error("Nisc EM dispatch worker URL not configured. Set QSTASH_NISC_EM_DISPATCH_WORKER_ENDPOINT, VITE_PUBLIC_APP_URL, or VERCEL_URL.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. For local development set QSTASH_NISC_EM_DISPATCH_WORKER_ENDPOINT to a public URL (e.g. from ngrok).");
    }
    const client = getQStashClient();
    const payload = { kind: "NISC_EM_DISPATCH", campaignId };
    const now = Date.now();
    const scheduledMs = scheduledFor?.getTime() ?? 0;
    const isScheduled = scheduledFor != null && scheduledMs > now;
    if (isScheduled) {
        const result = await client.publishJSON({
            url,
            body: payload,
            notBefore: Math.floor(scheduledMs / 1000),
        });
        return { messageId: result.messageId, scheduledFor: scheduledMs };
    }
    const result = await client.publishJSON({ url, body: payload });
    return { messageId: result.messageId };
}
