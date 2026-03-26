import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { emailCampaign, emailCampaignSendJob, notification } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { executeCampaignSend } from "@npanel/api/lib/campaign-send-executor";
import { sendEmail } from "@npanel/api/lib/email";
import { renderCampaignCompletedEmail } from "@npanel/api/lib/email-templates";
import { verifySignature } from "../../lib/qstash-verify";
import { randomUUID } from "node:crypto";

interface CampaignSendPayload {
	campaignId: string;
	sendJobId: string;
}

export async function handleSendCampaignEmails(c: Context) {
	const request = c.req.raw;
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: CampaignSendPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { campaignId, sendJobId } = body;
	if (!campaignId || !sendJobId) {
		return c.json({ error: "Missing campaignId or sendJobId" }, 400);
	}

	const now = new Date();

	const job = await db.query.emailCampaignSendJob.findFirst({
		where: eq(emailCampaignSendJob.id, sendJobId),
		with: { campaign: true },
	});

	if (!job) {
		return c.json({ error: "Send job not found" }, 404);
	}

	if (job.campaignId !== campaignId) {
		return c.json({ error: "Campaign ID does not match job" }, 400);
	}

	if (job.status !== "QUEUED") {
		return c.json({ message: "Job already processed", status: job.status }, 200);
	}

	const campaign = job.campaign;
	const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"];
	if (terminalStatuses.includes(campaign.status)) {
		await db.update(emailCampaignSendJob)
			.set({
				status: "CANCELLED",
				errorMessage: "Campaign already in terminal state",
				updatedAt: now,
			})
			.where(eq(emailCampaignSendJob.id, sendJobId));
		return c.json({ message: "Campaign already in terminal state" }, 200);
	}

	await db.update(emailCampaignSendJob)
		.set({ status: "RUNNING", startedAt: now, updatedAt: now })
		.where(eq(emailCampaignSendJob.id, sendJobId));

	try {
		const result = await executeCampaignSend(campaignId, { sendJobId });

		const campaignStatus =
			result.sentCount === 0 && result.failedCount === result.totalRecipients
				? "FAILED"
				: "COMPLETED";
		const completedAt = new Date();

		await db.transaction(async (tx) => {
			await tx.update(emailCampaignSendJob)
				.set({
					status: campaignStatus === "COMPLETED" ? "COMPLETED" : "FAILED",
					completedAt,
					errorMessage:
						campaignStatus === "FAILED"
							? "All recipients failed to send"
							: null,
					updatedAt: completedAt,
				})
				.where(eq(emailCampaignSendJob.id, sendJobId));

			await tx.update(emailCampaign)
				.set({
					status: campaignStatus,
					sentAt: result.sentCount > 0 ? completedAt : null,
					updatedAt: completedAt,
				})
				.where(eq(emailCampaign.id, campaignId));
		});

		try {
			const base = (process.env.VITE_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
			const viewCampaignLink = `${base}/agency/email-marketing/campaigns/${campaignId}`;
			const campaignWithUser = await db.query.emailCampaign.findFirst({
				where: eq(emailCampaign.id, campaignId),
				with: { user: { columns: { email: true, name: true } } },
			});
			if (campaignWithUser?.user?.email) {
				const sentAtFormatted = completedAt.toLocaleString(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				});
				const html = await renderCampaignCompletedEmail({
					recipientName: campaignWithUser.user.name ?? undefined,
					campaignName: campaignWithUser.name,
					subject: campaignWithUser.subject,
					sentAt: sentAtFormatted,
					totalRecipients: result.totalRecipients,
					viewCampaignLink,
				});
				await sendEmail({
					to: campaignWithUser.user.email,
					subject: `Campaign completed: ${campaignWithUser.name}`,
					html,
				});
			}
			if (campaignWithUser?.userId) {
				await db.insert(notification).values({
					id: randomUUID(),
					userId: campaignWithUser.userId,
					teamId: campaignWithUser.teamId ?? null,
					type: "EMAIL_MARKETING",
					priority: "NORMAL",
					title: "Campaign completed",
					message: `Your campaign "${campaignWithUser.name}" has finished sending. Log in to see the full report.`,
					link: viewCampaignLink,
					seen: false,
					createdAt: completedAt,
					updatedAt: completedAt,
				});
			}
		} catch (notifyErr) {
			console.error("Campaign completed notification/email failed:", notifyErr);
		}

		return c.json({
			success: true,
			campaignId,
			sendJobId,
			sentCount: result.sentCount,
			failedCount: result.failedCount,
			totalRecipients: result.totalRecipients,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const completedAt = new Date();

		await db.transaction(async (tx) => {
			await tx.update(emailCampaignSendJob)
				.set({
					status: "FAILED",
					completedAt,
					errorMessage: errorMessage.slice(0, 2000),
					updatedAt: completedAt,
				})
				.where(eq(emailCampaignSendJob.id, sendJobId));

			await tx.update(emailCampaign)
				.set({
					status: "FAILED",
					updatedAt: completedAt,
				})
				.where(eq(emailCampaign.id, campaignId));
		});

		const isRetryable =
			errorMessage.includes("rate") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("network");
		return c.json(
			{
				error: errorMessage,
				campaignId,
				sendJobId,
				retryable: isRetryable,
			},
			isRetryable ? 500 : 200
		);
	}
}
