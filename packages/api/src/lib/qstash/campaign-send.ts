import { getQStashClient } from "./client";
import type {
	CampaignSendJobPayload,
	CampaignSendJobResult,
} from "./types";

const CAMPAIGN_SEND_WORKER_PATH = "/api/workers/send-campaign-emails";

function getWorkerEndpoint(): string {
	// Explicit public URL (e.g. ngrok for local dev) – QStash cannot call localhost
	if (process.env.QSTASH_CAMPAIGN_WORKER_ENDPOINT) {
		return process.env.QSTASH_CAMPAIGN_WORKER_ENDPOINT.replace(/\/$/, "");
	}
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
	if (baseUrl) {
		return baseUrl.replace(/\/$/, "") + CAMPAIGN_SEND_WORKER_PATH;
	}
	return "";
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
 * Enqueue a campaign send job with QStash.
 * - If scheduledFor is provided and in the future, uses notBefore for that time.
 * - Otherwise delivers immediately.
 */
export async function enqueueCampaignSend(
	campaignId: string,
	sendJobId: string,
	scheduledFor?: Date | null,
): Promise<CampaignSendJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"Campaign send worker URL not configured. Set QSTASH_CAMPAIGN_WORKER_ENDPOINT, NEXT_PUBLIC_APP_URL, or VERCEL_URL.",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. For local development set QSTASH_CAMPAIGN_WORKER_ENDPOINT to a public URL (e.g. from ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: CampaignSendJobPayload = { campaignId, sendJobId };

	const now = Date.now();
	const scheduledMs = scheduledFor?.getTime() ?? 0;
	const isScheduled = scheduledFor != null && scheduledMs > now;

	if (isScheduled) {
		const result = await client.publishJSON({
			url,
			body: payload,
			notBefore: Math.floor(scheduledMs / 1000),
		});
		return {
			messageId: result.messageId,
			scheduledFor: scheduledMs,
		};
	}

	const result = await client.publishJSON({
		url,
		body: payload,
	});
	return { messageId: result.messageId };
}

/**
 * Cancel a scheduled campaign send (QStash message).
 * Does not throw if message is not found (e.g. already executed).
 */
export async function cancelCampaignSend(messageId: string): Promise<void> {
	const client = getQStashClient();
	try {
		await client.messages.delete(messageId);
	} catch (error: unknown) {
		const err = error as { status?: number; message?: string };
		if (err?.status === 404 || err?.message?.toLowerCase().includes("not found")) {
			return;
		}
		throw error;
	}
}
