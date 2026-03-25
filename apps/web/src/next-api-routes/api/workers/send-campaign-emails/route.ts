import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from "@npanel/db";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { executeCampaignSend } from "@npanel/api/lib/campaign-send-executor";
import { sendEmail } from "@npanel/api/lib/email";
import { renderCampaignCompletedEmail } from "@npanel/api/lib/email-templates";

interface CampaignSendPayload {
	campaignId: string;
	sendJobId: string;
}

/**
 * Worker: send campaign emails (immediate or scheduled via QStash).
 * Verifies QStash signature, loads job + campaign, runs send, updates job and campaign status.
 */
export async function POST(request: Request) {
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		return Response.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { campaignId, sendJobId } = body as CampaignSendPayload;
	if (!campaignId || !sendJobId) {
		return Response.json(
			{ error: "Missing campaignId or sendJobId" },
			{ status: 400 },
		);
	}

	const now = new Date();

	const job = await prisma.emailCampaignSendJob.findUnique({
		where: { id: sendJobId },
		include: { campaign: true },
	});

	if (!job) {
		return Response.json(
			{ error: "Send job not found" },
			{ status: 404 },
		);
	}

	if (job.campaignId !== campaignId) {
		return Response.json(
			{ error: "Campaign ID does not match job" },
			{ status: 400 },
		);
	}

	if (job.status !== "QUEUED") {
		return Response.json(
			{ message: "Job already processed", status: job.status },
			{ status: 200 },
		);
	}

	const campaign = job.campaign;
	const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"] as const;
	if (terminalStatuses.includes(campaign.status as (typeof terminalStatuses)[number])) {
		await prisma.emailCampaignSendJob.update({
			where: { id: sendJobId },
			data: {
				status: "CANCELLED",
				errorMessage: "Campaign already in terminal state",
				updatedAt: now,
			},
		});
		return Response.json(
			{ message: "Campaign already in terminal state" },
			{ status: 200 },
		);
	}

	await prisma.emailCampaignSendJob.update({
		where: { id: sendJobId },
		data: { status: "RUNNING", startedAt: now, updatedAt: now },
	});

	try {
		const result = await executeCampaignSend(campaignId, { sendJobId });

		const campaignStatus =
			result.sentCount === 0 && result.failedCount === result.totalRecipients
				? "FAILED"
				: "COMPLETED";
		const completedAt = new Date();

		await prisma.$transaction([
			prisma.emailCampaignSendJob.update({
				where: { id: sendJobId },
				data: {
					status: campaignStatus === "COMPLETED" ? "COMPLETED" : "FAILED",
					completedAt,
					errorMessage:
						campaignStatus === "FAILED"
							? "All recipients failed to send"
							: null,
					updatedAt: completedAt,
				},
			}),
			prisma.emailCampaign.update({
				where: { id: campaignId },
				data: {
					status: campaignStatus,
					sentAt: result.sentCount > 0 ? completedAt : null,
					updatedAt: completedAt,
				},
			}),
		]);

		// Notify campaign owner: completed email + in-app notification (use VITE_PUBLIC_APP_URL as-is)
		try {
			const base = (process.env.VITE_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
			const viewCampaignLink = `${base}/agency/email-marketing/campaigns/${campaignId}`;
			const campaignWithUser = await prisma.emailCampaign.findUnique({
				where: { id: campaignId },
				include: { user: { select: { email: true, name: true } } },
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
				await prisma.notification.create({
					data: {
						id: crypto.randomUUID(),
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
					},
				});
			}
		} catch (notifyErr) {
			console.error("Campaign completed notification/email failed:", notifyErr);
		}

		return Response.json({
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

		await prisma.$transaction([
			prisma.emailCampaignSendJob.update({
				where: { id: sendJobId },
				data: {
					status: "FAILED",
					completedAt,
					errorMessage: errorMessage.slice(0, 2000),
					updatedAt: completedAt,
				},
			}),
			prisma.emailCampaign.update({
				where: { id: campaignId },
				data: {
					status: "FAILED",
					updatedAt: completedAt,
				},
			}),
		]);

		const isRetryable =
			errorMessage.includes("rate") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("network");
		return Response.json(
			{
				error: errorMessage,
				campaignId,
				sendJobId,
				retryable: isRetryable,
			},
			{ status: isRetryable ? 500 : 200 },
		);
	}
}
