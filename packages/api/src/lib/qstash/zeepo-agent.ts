import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";
import type { ZeepoAgentJobPayload, ZeepoAgentJobResult } from "./types";

function getWorkerEndpoint(): string {
	const url = env.QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT;
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

export async function enqueueZeepoAgentGeneration(
	generationId: string,
): Promise<ZeepoAgentJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"Zeepo Agent worker URL not configured. Set QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT.",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. For local development set QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT to a public URL (e.g. from ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: ZeepoAgentJobPayload = { generationId };

	const configuredTimeout =
		process.env.QSTASH_ZEEPO_AGENT_TIMEOUT !== undefined
			? Number(process.env.QSTASH_ZEEPO_AGENT_TIMEOUT) || 900
			: 900;
	const timeout = Math.min(configuredTimeout, 900);
	const retries =
		process.env.QSTASH_ZEEPO_AGENT_RETRIES !== undefined
			? Number(process.env.QSTASH_ZEEPO_AGENT_RETRIES) || 0
			: undefined;

	const result = await client.publishJSON({
		url,
		body: payload,
		timeout,
		...(retries !== undefined ? { retries } : {}),
	});

	const messageId =
		"messageId" in result && typeof (result as any).messageId === "string"
			? (result as any).messageId
			: "";

	return { messageId };
}
