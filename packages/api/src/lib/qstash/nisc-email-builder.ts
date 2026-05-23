import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
import type { NebBuildJobPayload, NebBuildJobResult } from "./types";

function getWorkerEndpoint(): string {
	const url = env.QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT;
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

export async function enqueueNebBuildJob(
	jobId: string,
): Promise<NebBuildJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"Nisc Email Builder worker URL not configured. Set QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT.",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. Set QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT to a public URL (e.g. ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: NebBuildJobPayload = { jobId };

	const result = await client.publishJSON({
		url,
		body: payload,
		timeout: 900,
		retries: 0,
	});

	const messageId =
		"messageId" in result && typeof (result as { messageId?: string }).messageId === "string"
			? (result as { messageId: string }).messageId
			: "";

	return { messageId };
}
