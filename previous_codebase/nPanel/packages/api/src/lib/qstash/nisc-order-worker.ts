import { getQStashClient } from "./client";
import type { NiscOrderJobPayload, NiscOrderJobResult } from "./types";
import { niscLog } from "../nisc-order-logger";

const NISC_ORDER_WORKER_PATH = "/api/workers/process-nisc-order";

function getWorkerEndpoint(): string {
	if (process.env.QSTASH_NISC_ORDER_WORKER_ENDPOINT) {
		return process.env.QSTASH_NISC_ORDER_WORKER_ENDPOINT.replace(/\/$/, "");
	}
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
	if (baseUrl) {
		return baseUrl.replace(/\/$/, "") + NISC_ORDER_WORKER_PATH;
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
 * Enqueue a NISC order for background processing via QStash.
 * Delivers immediately (no scheduling).
 */
export async function enqueueNiscOrderProcessing(
	niscOrderId: string,
): Promise<NiscOrderJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"NISC order worker URL not configured. Set QSTASH_NISC_ORDER_WORKER_ENDPOINT, NEXT_PUBLIC_APP_URL, or VERCEL_URL.",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. For local development set QSTASH_NISC_ORDER_WORKER_ENDPOINT to a public URL (e.g. from ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: NiscOrderJobPayload = { niscOrderId };

	await niscLog("enqueue_start", { niscOrderId, workerUrl: url });
	const result = await client.publishJSON({
		url,
		body: payload,
	});
	await niscLog("enqueue_success", { niscOrderId, qstashMessageId: result.messageId });
	return { messageId: result.messageId };
}
