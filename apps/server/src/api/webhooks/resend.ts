import { Context } from "hono";
import { Webhook } from "svix";
import { db, eq } from "@npanel/db";
import {
  campaignRecipient,
  emailEvent,
  emailEventActivityLog
} from "@npanel/db/schema";
import {
  RESEND_EVENT_TYPE_TO_ENUM,
  type EmailEventType
} from "@npanel/api/routers/email-marketing/schemas";
import { randomUUID } from "node:crypto";
import { claimWebhookEvent } from "@npanel/api/lib/webhook-idempotency";

/** Resend webhook payload shape */
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
 */
export async function handleResendWebhook(c: Context) {
  const req = c.req.raw;
  try {
    const rawBody = await req.text();
    let payload: ResendWebhookPayload;

    const secret = process.env.RESEND_WEBHOOK_SECRET;
    const svixId = req.headers.get("svix-id");
    if (secret) {
      const headers = {
        "svix-id": svixId ?? "",
        "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
        "svix-signature": req.headers.get("svix-signature") ?? "",
      };
      try {
        const wh = new Webhook(secret);
        payload = wh.verify(rawBody, headers) as ResendWebhookPayload;
      } catch (err) {
        console.error("[Webhook][Resend] Invalid signature:", err);
        return c.json({ error: "Invalid webhook signature" }, 401);
      }
    } else {
      payload = JSON.parse(rawBody) as ResendWebhookPayload;
    }

    if (svixId) {
      const claimed = await claimWebhookEvent("resend", svixId);
      if (!claimed) {
        return c.json({ received: true, reason: "duplicate" }, 200);
      }
    }

    // Svix may wrap the event in { data: { type, created_at, data } }
    const eventPayload =
      payload?.data && typeof payload.data === "object" && "type" in payload.data && "data" in payload.data
        ? (payload.data as unknown as ResendWebhookPayload)
        : payload;

    const eventType = eventPayload?.type;
    const eventCreatedAtStr = eventPayload?.created_at;
    const data = eventPayload?.data;

    if (!eventType || !data) {
      return c.json({ received: true, reason: "missing type or data" }, 200);
    }

    const mappedType = RESEND_EVENT_TYPE_TO_ENUM[eventType] as EmailEventType | undefined;
    if (!mappedType) {
      return c.json({ received: true, reason: "unknown event type" }, 200);
    }

    const emailId = (data.email_id ?? data.id) as string | undefined;
    if (!emailId || typeof emailId !== "string") {
      return c.json({ received: true, reason: "missing email_id" }, 200);
    }

    const eventCreatedAt = eventCreatedAtStr ? new Date(eventCreatedAtStr) : new Date();

    const recipient = await db.query.campaignRecipient.findFirst({
      where: eq(campaignRecipient.resendId, emailId),
    });

    if (!recipient) {
      console.warn(`[Webhook][Resend] Recipient not found for resendId: ${emailId}`);
      return c.json({ received: true, reason: "recipient not found", email_id: emailId }, 200);
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      const emailEventId = randomUUID();
      await tx.insert(emailEvent).values({
        id: emailEventId,
        campaignRecipientId: recipient.id,
        type: mappedType,
        eventCreatedAt,
        resendEmailId: emailId,
        data: data as any,
        createdAt: now,
      });

      await tx.insert(emailEventActivityLog).values({
        id: randomUUID(),
        emailEventId: emailEventId,
        action: "RECEIVED",
        description: `Webhook ${eventType} received`,
        metadata: { type: eventType, email_id: emailId },
        createdAt: now,
      });
    });

    return c.json({ received: true, saved: true }, 200);
  } catch (error) {
    console.error("[Webhook][Resend] Unexpected failure:", error);
    return c.json({ received: true, reason: "error_handled" }, 200);
  }
}
