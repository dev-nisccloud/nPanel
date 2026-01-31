import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@nPanel/db";
import { getQStashSigningKeys } from "@nPanel/api/lib/qstash/client";
import { executeCampaignSend } from "@nPanel/api/lib/campaign-send-executor";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min for large campaigns

interface CampaignSendPayload {
	campaignId: string;
	sendJobId: string;
}

/**
 * Worker: send campaign emails (immediate or scheduled via QStash).
 * Verifies QStash signature, loads job + campaign, runs send, updates job and campaign status.
 */
export async function POST(request: NextRequest) {
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { campaignId, sendJobId } = body as CampaignSendPayload;
	if (!campaignId || !sendJobId) {
		return NextResponse.json(
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
		return NextResponse.json(
			{ error: "Send job not found" },
			{ status: 404 },
		);
	}

	if (job.campaignId !== campaignId) {
		return NextResponse.json(
			{ error: "Campaign ID does not match job" },
			{ status: 400 },
		);
	}

	if (job.status !== "QUEUED") {
		return NextResponse.json(
			{ message: "Job already processed", status: job.status },
			{ status: 200 },
		);
	}

	const campaign = job.campaign;
	if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
		await prisma.emailCampaignSendJob.update({
			where: { id: sendJobId },
			data: {
				status: "CANCELLED",
				errorMessage: "Campaign already in terminal state",
				updatedAt: now,
			},
		});
		return NextResponse.json(
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

		return NextResponse.json({
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
		return NextResponse.json(
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
