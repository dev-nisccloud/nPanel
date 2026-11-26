import * as crypto from "node:crypto";
import { db } from "@npanel/db";
import { webhookEvent } from "@npanel/db/schema/webhook-events";

/**
 * Claim a webhook/event id exactly once in Postgres. The unique constraint is
 * the durable authority across restarts and concurrent server instances.
 */
export async function claimWebhookEvent(
  namespace: string,
  eventId: string,
  _ttlSec = 86_400,
): Promise<boolean> {
  try {
    const inserted = await db
      .insert(webhookEvent)
      .values({
        id: crypto.randomUUID(),
        namespace,
        eventId,
        createdAt: new Date(),
      })
      .onConflictDoNothing({
        target: [webhookEvent.namespace, webhookEvent.eventId],
      })
      .returning({ id: webhookEvent.id });
    return inserted.length === 1;
  } catch (error) {
    console.error("[webhook-idempotency] claim failed:", namespace, eventId, error);
    throw error;
  }
}
