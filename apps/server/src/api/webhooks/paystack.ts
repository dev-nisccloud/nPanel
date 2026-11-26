import type { Context } from "hono";
import { claimWebhookEvent } from "@npanel/api/lib/webhook-idempotency";
import { reconcilePaystackPayment } from "@npanel/api/routers/payment-gateway/paystack/reconcile";
import { verifyPaystackWebhookSignature } from "@npanel/api/lib/paystack-signature";

export async function handlePaystackWebhook(c: Context) {
	try {
		const rawBody = await c.req.text();
		if (
			!verifyPaystackWebhookSignature(
				rawBody,
				c.req.raw.headers.get("x-paystack-signature"),
			)
		) {
			return c.json({ error: "Invalid signature" }, 401);
		}

		const event = JSON.parse(rawBody) as {
			event?: string;
			data?: { reference?: string };
		};
		if (event.event !== "charge.success") {
			return c.json({ received: true }, 200);
		}
		const reference = event.data?.reference?.trim();
		if (!reference) {
			return c.json({ received: true, error: "Missing reference" }, 200);
		}

		const eventId = `${event.event}:${reference}`;
		const claimed = await claimWebhookEvent("paystack", eventId);
		const result = await reconcilePaystackPayment(reference);
		if (result.status === "REJECTED") {
			return c.json({ received: true, verified: false }, 200);
		}
		return c.json(
			{ received: true, duplicate: !claimed, status: result.status },
			200,
		);
	} catch (error) {
		console.error("[Webhook][Paystack] processing failed", error);
		return c.json({ received: false, error: "Processing failed" }, 503);
	}
}
