import { getQStashClient } from "./client";

const INVOICE_KRA_SYNC_WORKER_PATH = "/api/workers/invoice-kra-sync";

export type InvoiceKraSyncJobPayload = {
	invoiceId: string;
};

export type InvoiceKraSyncJobResult = {
	messageId: string;
};

/**
 * Resolve the QStash worker URL for invoice KRA sync jobs.
 */
function getWorkerEndpoint(): string {
	if (process.env.QSTASH_INVOICE_KRA_SYNC_WORKER_ENDPOINT) {
		return process.env.QSTASH_INVOICE_KRA_SYNC_WORKER_ENDPOINT.replace(/\/$/, "");
	}
	const baseUrl =
		process.env.VITE_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
	if (baseUrl) {
		return baseUrl.replace(/\/$/, "") + INVOICE_KRA_SYNC_WORKER_PATH;
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

const KRA_SYNC_ELIGIBLE_STATUSES = new Set(["SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]);

/**
 * Enqueue async KRA eTIMS sync for an invoice. Never throws — logs on failure.
 */
export async function scheduleInvoiceKraSyncAfterCreate(
	invoiceId: string,
	options?: { status?: string | null },
): Promise<void> {
	const status = options?.status;
	if (status && !KRA_SYNC_ELIGIBLE_STATUSES.has(status)) {
		return;
	}

	try {
		await enqueueInvoiceKraSync(invoiceId);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn("[invoice-kra-sync] enqueue failed:", invoiceId, msg);
	}
}

export async function enqueueInvoiceKraSync(invoiceId: string): Promise<InvoiceKraSyncJobResult | null> {
	const url = getWorkerEndpoint();
	if (!url) {
		console.warn(
			"[invoice-kra-sync] worker URL not configured; invoice remains PENDING. Set QSTASH_INVOICE_KRA_SYNC_WORKER_ENDPOINT or VITE_PUBLIC_APP_URL.",
		);
		return null;
	}
	if (isLoopbackUrl(url)) {
		console.warn(
			"[invoice-kra-sync] QStash cannot call localhost; invoice remains PENDING.",
		);
		return null;
	}

	const client = getQStashClient();
	const payload: InvoiceKraSyncJobPayload = { invoiceId };
	const retries =
		process.env.QSTASH_INVOICE_KRA_SYNC_RETRIES !== undefined
			? Number(process.env.QSTASH_INVOICE_KRA_SYNC_RETRIES) || 2
			: 2;

	const result = await client.publishJSON({
		url,
		body: payload,
		retries,
	});

	return { messageId: result.messageId };
}
