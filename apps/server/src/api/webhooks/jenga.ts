import { Context } from "hono";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { paymentTransaction } from "@npanel/db/schema";
import {
	applyJengaCallbackUpdate,
	applyJengaIpnUpdate,
	getJengaReturnRedirect,
	parseJengaMetadata,
} from "@npanel/api/routers/payment-gateway/jenga/apply-payment-update";
import {
	jengaCallbackQuerySchema,
	jengaIpnPayloadSchema,
} from "@npanel/api/routers/payment-gateway/jenga/types";
import { claimWebhookEvent } from "@npanel/api/lib/webhook-idempotency";
import { sendEmail } from "@npanel/api/lib/email";
import { renderPaymentReceiptEmail } from "@npanel/api/lib/email-templates";
import { resolveNiscCustomerNotificationRecipient } from "@npanel/api/lib/nisc-order-invoice-billing";

function verifyJengaIpnBasicAuth(authHeader: string | undefined): boolean {
	const username = process.env.JENGA_IPN_USERNAME;
	const password = process.env.JENGA_IPN_PASSWORD;
	if (!username || !password) {
		console.error("[Webhook][Jenga] IPN credentials not configured");
		return false;
	}
	if (!authHeader?.startsWith("Basic ")) {
		return false;
	}
	try {
		const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
		const sep = decoded.indexOf(":");
		if (sep < 0) return false;
		const userPart = decoded.slice(0, sep);
		const passPart = decoded.slice(sep + 1);
		return userPart === username && passPart === password;
	} catch {
		return false;
	}
}

/**
 * GET /api/webhooks/jenga/callback
 * Browser redirect after Jenga hosted checkout.
 */
export async function handleJengaCallback(c: Context) {
	try {
		const rawQuery = c.req.query();
		const parsed = jengaCallbackQuerySchema.safeParse(rawQuery);
		if (!parsed.success) {
			console.error("[Webhook][Jenga] Invalid callback query:", parsed.error.flatten());
			return c.redirect(
				getJengaReturnRedirect({
					metadata: null,
					orderReference: rawQuery.orderReference || "unknown",
					status: "FAILED",
				}),
			);
		}

		const query = parsed.data;
		const orderReference = query.orderReference?.trim() || "unknown";

		const idempotencyKey = `${orderReference}:${query.status || "unknown"}:${query.transactionId || "none"}`;
		const claimed = await claimWebhookEvent("jenga_callback", idempotencyKey);

		if (claimed) {
			await applyJengaCallbackUpdate(query);
		}

		const transaction = await db.query.paymentTransaction.findFirst({
			where: and(
				eq(paymentTransaction.checkoutRequestId, orderReference),
				eq(paymentTransaction.gateway, "JENGA"),
			),
		});

		const metadata = parseJengaMetadata(transaction?.metadata);
		const status =
			transaction?.status ||
			(query.status === "paid" ? "SUCCESS" : "FAILED");

		return c.redirect(
			getJengaReturnRedirect({
				metadata,
				orderReference,
				status,
			}),
		);
	} catch (error) {
		console.error("[Webhook][Jenga] Callback unexpected error:", error);
		return c.redirect(
			getJengaReturnRedirect({
				metadata: null,
				orderReference: c.req.query("orderReference") || "unknown",
				status: "FAILED",
			}),
		);
	}
}

/**
 * POST /api/webhooks/jenga/ipn
 * Instant Payment Notification with Basic Auth (durable source of truth).
 */
export async function handleJengaIpn(c: Context) {
	const req = c.req.raw;
	try {
		const authHeader = req.headers.get("authorization") || undefined;
		if (!verifyJengaIpnBasicAuth(authHeader)) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ received: true, error: "Invalid JSON" }, 200);
		}

		const parsed = jengaIpnPayloadSchema.safeParse(body);
		if (!parsed.success) {
			console.error("[Webhook][Jenga] Invalid IPN payload:", parsed.error.flatten());
			return c.json({ received: true, error: "Invalid payload" }, 200);
		}

		const payload = parsed.data;
		const orderReference =
			payload.transaction.billNumber?.trim() ||
			payload.customer.reference?.trim() ||
			"unknown";

		const idempotencyKey = `${orderReference}:${payload.transaction.status}:${payload.transaction.reference}`;
		const claimed = await claimWebhookEvent("jenga_ipn", idempotencyKey);
		if (!claimed) {
			return c.json({ received: true, duplicate: true }, 200);
		}

		const result = await applyJengaIpnUpdate(payload);
		if (!result.ok) {
			console.warn("[Webhook][Jenga] IPN apply failed:", result.reason);
			return c.json({ received: true, error: result.reason }, 200);
		}

		if (result.status === "SUCCESS" && !result.alreadyTerminal) {
			try {
				const transaction = await db.query.paymentTransaction.findFirst({
					where: eq(paymentTransaction.id, result.transactionId),
				});
				if (transaction) {
					const recipient = await resolveNiscCustomerNotificationRecipient({
						teamId: transaction.teamId,
						userId: transaction.userId,
					});
					if (recipient) {
						const formattedAmount = new Intl.NumberFormat("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						}).format(
							Number.parseFloat(
								transaction.paidAmount || transaction.amount || "0",
							),
						);
						const emailHtml = await renderPaymentReceiptEmail({
							customerName: recipient.name,
							receiptNumber:
								transaction.receiptNumber ||
								payload.transaction.reference ||
								"N/A",
							transactionDate: new Date().toLocaleString(),
							amount: formattedAmount,
							currency: transaction.currency || "KES",
							paymentMethod: "Card",
							supportEmail: "support@nisccloud.com",
							supportPhone: "+254 748 777 666",
						});
						await sendEmail({
							to: recipient.email,
							subject: `Payment Receipt - ${transaction.receiptNumber || payload.transaction.reference}`,
							html: emailHtml,
						});
					}
				}
			} catch (emailError) {
				console.error("[Webhook][Jenga] Failed to send receipt email:", emailError);
			}
		}

		return c.json({ received: true }, 200);
	} catch (error) {
		console.error("[Webhook][Jenga] IPN unexpected error:", error);
		return c.json({ received: true, error: "Processing failed" }, 200);
	}
}
