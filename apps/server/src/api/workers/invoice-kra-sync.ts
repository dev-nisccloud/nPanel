import type { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { processInvoiceKraSync } from "@npanel/api/lib/invoice-kra-sync";
import { verifySignature } from "../../lib/qstash-verify";

interface InvoiceKraSyncPayload {
	invoiceId: string;
}

export async function handleInvoiceKraSync(c: Context) {
	const request = c.req.raw;

	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch {
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: InvoiceKraSyncPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { invoiceId } = body;
	if (!invoiceId) {
		return c.json({ error: "Missing invoiceId" }, 400);
	}

	const result = await processInvoiceKraSync(invoiceId);

	if ("skipped" in result && result.skipped) {
		return c.json({ ok: true, skipped: true, reason: result.reason });
	}

	return c.json(result);
}
