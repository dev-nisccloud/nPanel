import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@npanel/db";
import { RESEND_EVENT_TYPE_TO_ENUM } from "@nPanel/api/routers/email-marketing/schemas";
import type { EmailEventType } from "@nPanel/api/routers/email-marketing/schemas";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Resend webhook payload shape (top-level or inside Svix envelope) */
interface ResendWebhookPayload {
	type?: string;
	created_at?: string;
	data?: {
		email_id?: string;
		id?: string; // some payloads use "id" for the Resend email id
		created_at?: string;
		[key: string]: unknown;
	};
}

/**
 * Resend Webhook Handler
 *
 * Receives events from Resend (email.sent, email.delivered, email.bounced, etc.).
 * Creates EmailEvent and EmailEventActivityLog when the recipient is found by resendId.
 * Always returns 200 OK so Resend does not retry (per Resend docs).
 *
 * Set RESEND_WEBHOOK_SECRET in .env to the webhook's signing secret (from Resend dashboard
 * or create/list webhook API). When set, requests are verified with Svix; invalid signatures return 401.
 *
 * Resend webhook IPs (for allowlisting): 44.228.126.217, 50.112.21.217, 52.24.126.164, 54.148.139.208, 2600:1f24:64:8000::/52
 */
export async function POST(req: NextRequest) {
	try {
		const rawBody = await req.text();
		let payload: ResendWebhookPayload;

		const secret = process.env.RESEND_WEBHOOK_SECRET;
		if (secret) {
			const headers = {
				"svix-id": req.headers.get("svix-id") ?? "",
				"svix-timestamp": req.headers.get("svix-timestamp") ?? "",
				"svix-signature": req.headers.get("svix-signature") ?? "",
			};
			try {
				const wh = new Webhook(secret);
				payload = wh.verify(rawBody, headers) as ResendWebhookPayload;
			} catch {
				return NextResponse.json(
					{ error: "Invalid webhook signature" },
					{ status: 401 },
				);
			}
		} else {
			payload = JSON.parse(rawBody) as ResendWebhookPayload;
		}

		// Svix may wrap the event in { data: { type, created_at, data } }; use inner payload if present
		const eventPayload =
			payload?.data && typeof payload.data === "object" && "type" in payload.data && "data" in payload.data
				? (payload.data as unknown as ResendWebhookPayload)
				: payload;

		const eventType = eventPayload?.type;
		const eventCreatedAtStr = eventPayload?.created_at;
		const data = eventPayload?.data;

		if (!eventType || !data) {
			return NextResponse.json(
				{ received: true, reason: "missing type or data" },
				{ status: 200 },
			);
		}

		const mappedType = RESEND_EVENT_TYPE_TO_ENUM[eventType] as
			| EmailEventType
			| undefined;
		if (!mappedType) {
			return NextResponse.json(
				{ received: true, reason: "unknown event type" },
				{ status: 200 },
			);
		}

		// Resend sends data.email_id; accept data.id as fallback
		const emailId = (data.email_id ?? data.id) as string | undefined;
		if (!emailId || typeof emailId !== "string") {
			return NextResponse.json(
				{ received: true, reason: "missing data.email_id or data.id" },
				{ status: 200 },
			);
		}

		const eventCreatedAt = eventCreatedAtStr
			? new Date(eventCreatedAtStr)
			: new Date();

		const recipient = await prisma.campaignRecipient.findFirst({
			where: { resendId: emailId },
		});

		if (!recipient) {
			console.warn("[Resend webhook] recipient not found for resendId:", emailId, "eventType:", eventType);
			return NextResponse.json(
				{ received: true, reason: "recipient not found", email_id: emailId },
				{ status: 200 },
			);
		}

		const now = new Date();
		await prisma.$transaction(async (tx) => {
			const emailEvent = await tx.emailEvent.create({
				data: {
					id: crypto.randomUUID(),
					campaignRecipientId: recipient.id,
					type: mappedType,
					eventCreatedAt,
					resendEmailId: emailId,
					data: data as object,
					createdAt: now,
				},
			});

			await tx.emailEventActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					emailEventId: emailEvent.id,
					action: "RECEIVED",
					description: `Webhook ${eventType} received`,
					metadata: { type: eventType, email_id: emailId },
					createdAt: now,
				},
			});
		});

		return NextResponse.json({ received: true, saved: true }, { status: 200 });
	} catch (error) {
		// Always 200 so Resend does not retry; log so you can see why DB save failed
		console.error("[Resend webhook] failed to save event:", error);
		return NextResponse.json(
			{ received: true, reason: "error_handled" },
			{ status: 200 },
		);
	}
}
