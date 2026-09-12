import type { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import {
	enqueueSubscriptionRenewalReminders,
} from "@npanel/api/lib/qstash/subscription-renewal-reminders";
import {
	markRenewalReminderContinuationFailed,
	isRenewalReminderCronEnabled,
	processSubscriptionRenewalReminders,
	type SubscriptionRenewalRemindersPayload,
} from "@npanel/api/lib/subscription-renewal-reminders";
import { verifySignature } from "../../lib/qstash-verify";

export async function handleSubscriptionRenewalReminders(c: Context) {
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

	let body: SubscriptionRenewalRemindersPayload = {};
	try {
		const parsed = await request.clone().json();
		if (parsed && typeof parsed === "object") {
			body = parsed as SubscriptionRenewalRemindersPayload;
		}
	} catch {
		body = {};
	}

	if (!(await isRenewalReminderCronEnabled())) {
		return c.json({ ok: true, skipped: true, reason: "disabled" });
	}

	const source = body.source ?? "schedule";
	const result = await processSubscriptionRenewalReminders({
		...body,
		source,
	});

	if (result.hasMore) {
		try {
			const { messageId } = await enqueueSubscriptionRenewalReminders({
				offset: result.nextOffset,
				triggeredByUserId: body.triggeredByUserId ?? null,
				source: "continuation",
				runId: result.runId,
			});
			return c.json({
				ok: true,
				...result,
				continued: true,
				continuationMessageId: messageId,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(
				"[subscription-renewal-reminders] Failed to enqueue continuation:",
				err,
			);
			await markRenewalReminderContinuationFailed(result.runId, message);
			return c.json({
				ok: false,
				...result,
				continued: false,
				continuationError: message,
			}, 500);
		}
	}

	return c.json({ ok: true, ...result, continued: false });
}
