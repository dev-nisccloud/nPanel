import prisma from "@nPanel/db";
import { getResendClient } from "./resend-client";

const BATCH_SIZE = 100;

export interface ExecuteCampaignSendResult {
	sentCount: number;
	failedCount: number;
	totalRecipients: number;
}

/** Options for executeCampaignSend (e.g. from QStash worker). */
export interface ExecuteCampaignSendOptions {
	/** When set, Resend batch requests use this + batch index as idempotency key so retries don't duplicate sends. */
	sendJobId?: string;
}

/**
 * Execute the actual campaign send: Resend batches + update CampaignRecipient.resendId.
 * Does NOT update EmailCampaign status or EmailCampaignSendJob status (caller does that).
 * Pass sendJobId so each batch uses an idempotency key (campaign-send/${sendJobId}/${batchIndex}); Resend returns cached response on retry and does not re-send.
 * @throws if campaign not found, no content, domain not verified, or no recipients
 */
export async function executeCampaignSend(
	campaignId: string,
	options?: ExecuteCampaignSendOptions,
): Promise<ExecuteCampaignSendResult> {
	const campaign = await prisma.emailCampaign.findUnique({
		where: { id: campaignId },
		include: { recipients: true },
	});

	if (!campaign) {
		throw new Error("Campaign not found");
	}

	if (!campaign.htmlContent && !campaign.textContent) {
		throw new Error("Campaign must have HTML or text content");
	}

	if (campaign.emailDomainId) {
		const domain = await prisma.emailDomain.findUnique({
			where: { id: campaign.emailDomainId },
		});
		if (!domain || domain.status !== "VERIFIED") {
			throw new Error("Email domain must be verified");
		}
	}

	const recipients = campaign.recipients;
	if (recipients.length === 0) {
		throw new Error("Campaign has no recipients");
	}

	const resend = getResendClient();
	const fromDisplay =
		campaign.fromName != null
			? `${campaign.fromName} <${campaign.fromEmail}>`
			: campaign.fromEmail;

	let sentCount = 0;
	let failedCount = 0;

	for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
		const batch = recipients.slice(i, i + BATCH_SIZE);
		const batchEmails = batch.map((r) => {
			let html = campaign.htmlContent ?? undefined;
			let text = campaign.textContent ?? undefined;
			if (html) html = html.replace(/\{\{email\}\}/g, r.toEmail);
			if (text) text = text.replace(/\{\{email\}\}/g, r.toEmail);
			return {
				from: fromDisplay,
				to: [r.toEmail],
				subject: campaign.subject,
				...(html && { html }),
				...(text && { text }),
			};
		});

		try {
			// Resend batch.send request: [{ from, html, subject, to: [email] }, ...]
			// Resend response: { data: [{ id: "resend-email-id" }, ...] } in the SAME order as request.
			// We map by index only when lengths match so an id is never assigned to the wrong recipient.
			// Idempotency: one key per batch (Resend batch API). Key = campaign-send/${sendJobId}/${batchIndex}; retries get same response, no duplicate sends.
			const batchIndex = Math.floor(i / BATCH_SIZE);
			const sendOptions =
				options?.sendJobId != null
					? { idempotencyKey: `campaign-send/${options.sendJobId}/${batchIndex}` }
					: undefined;
			const resendResponse = await resend.batch.send(
				batchEmails as Parameters<typeof resend.batch.send>[0],
				sendOptions as Parameters<typeof resend.batch.send>[1],
			);

			if (resendResponse.error) {
				throw new Error(resendResponse.error.message);
			}

			// Resend SDK returns { data: <full API body>, error }. Batch API body is { data: [{ id }, ...] }, so IDs are at .data.data
			const rawData = resendResponse.data as { data?: Array<{ id: string }> } | null;
			const results: Array<{ id: string }> = Array.isArray(rawData?.data)
				? rawData.data
				: [];

			if (results.length !== batch.length) {
				throw new Error(
					`Resend batch response length (${results.length}) does not match request length (${batch.length}); refusing to map IDs to avoid wrong recipient.`,
				);
			}

			const now = new Date();
			// Safe to map by index: results[j] is the Resend id for batch[j] (same-order guarantee + length check).
			await prisma.$transaction(
				batch.map((recipient, j) => {
					const result = results[j];
					const resendId = result?.id ?? null;
					if (resendId) sentCount++;
					else failedCount++;
					return prisma.campaignRecipient.update({
						where: { id: recipient.id },
						data: { resendId, updatedAt: now },
					});
				}),
			);

			if (i + BATCH_SIZE < recipients.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} catch (error) {
			failedCount += batch.length;
			throw error;
		}
	}

	return {
		sentCount,
		failedCount,
		totalRecipients: recipients.length,
	};
}
