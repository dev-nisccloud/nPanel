import { Context } from "hono";
import { randomUUID } from "node:crypto";
import { db, desc, eq } from "@npanel/db";
import {
	nebBrandKit,
	nebDesign,
	nebGenerationJob,
	nebMessage,
	nebSession,
} from "@npanel/db/schema/nisc-email-builder";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { enqueueNebBuildJob } from "@npanel/api/lib/qstash/nisc-email-builder";
import {
	runNebBuildEmail,
	runNebRevision,
} from "@npanel/api/lib/nisc-email-builder/run-build";
import {
	runNebChatDuringApproval,
	runNebCreativeDesign,
} from "@npanel/api/lib/nisc-email-builder/run-creative";
import type { NebBrief } from "@npanel/api/lib/nisc-email-builder/types";
import { verifySignature } from "../../lib/qstash-verify";

interface NebWorkerPayload {
	jobId: string;
}

function designNotesFromMetadata(metadata: unknown): string | undefined {
	if (!metadata || typeof metadata !== "object") return undefined;
	const notes = (metadata as { design_notes?: string }).design_notes;
	return typeof notes === "string" ? notes : undefined;
}

export async function handleNiscEmailBuilder(c: Context) {
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(c.req.raw, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[NebWorker] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: NebWorkerPayload;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { jobId } = body;
	if (!jobId) return c.json({ error: "Missing jobId" }, 400);

	const job = await db.query.nebGenerationJob.findFirst({
		where: eq(nebGenerationJob.id, jobId),
	});

	if (!job) return c.json({ error: "Job not found" }, 404);

	if (job.status === "SUCCEEDED" || job.status === "FAILED") {
		return c.json({ message: "Job already terminal", status: job.status });
	}

	const design = await db.query.nebDesign.findFirst({
		where: eq(nebDesign.id, job.designId),
	});

	if (!design) return c.json({ error: "Design not found" }, 404);

	let brandKit: {
		colors?: Record<string, string> | null;
		footerLegal?: string | null;
		logoUrl?: string | null;
	} | undefined;

	if (design.brandKitId) {
		const kit = await db.query.nebBrandKit.findFirst({
			where: eq(nebBrandKit.id, design.brandKitId),
		});
		if (kit) {
			brandKit = {
				colors: kit.colors as Record<string, string> | null,
				footerLegal: kit.footerLegal,
				logoUrl: null,
			};
		}
	}

	const jobInput = job.input as { brief?: NebBrief; webContext?: string | null };
	const brief = jobInput.brief ?? (design.brief as NebBrief) ?? {};
	const webContext = jobInput.webContext ?? null;

	const session = await db.query.nebSession.findFirst({
		where: eq(nebSession.designId, design.id),
	});

	const appendAssistant = async (
		content: string,
		metadata?: Record<string, unknown>,
	) => {
		if (!session) return;
		await db.insert(nebMessage).values({
			id: randomUUID(),
			sessionId: session.id,
			role: "assistant",
			content,
			metadata: { jobId, ...metadata },
			createdAt: new Date(),
		});
	};

	try {
		if (job.type === "CREATIVE_DESIGN" || job.type === "FULL_BUILD") {
			const feedback = (job.input as { userFeedback?: string })?.userFeedback;
			const result = await runNebCreativeDesign({
				jobId,
				designId: design.id,
				brief,
				brandKit,
				userId: design.userId,
				teamId: design.teamId,
				userFeedback: feedback,
				webContext,
			});
			await appendAssistant(result.assistantText, {
				creativeDesignUrl: result.creativeDesignUrl,
			});
		} else if (job.type === "BUILD_EMAIL") {
			if (!design.creativeDesignUrl) {
				throw new Error("Creative design must be approved before building HTML");
			}
			const result = await runNebBuildEmail({
				jobId,
				designId: design.id,
				brief,
				brandKit,
				userId: design.userId,
				teamId: design.teamId,
				creativeDesignUrl: design.creativeDesignUrl,
				designNotes: designNotesFromMetadata(design.metadata),
				webContext,
			});
			await appendAssistant(
				`${result.assistantText}\n\nYour HTML email is ready in the **Email preview** tab.`,
			);
		} else if (job.type === "CHAT") {
			const message = (job.input as { message?: string })?.message ?? "";
			const recent = session
				? await db.query.nebMessage.findMany({
						where: eq(nebMessage.sessionId, session.id),
						orderBy: [desc(nebMessage.createdAt)],
						limit: 10,
					})
				: [];
			const transcript = [...recent]
				.reverse()
				.map((m) => `[${m.role}]: ${m.content}`)
				.join("\n");

			const chat = await runNebChatDuringApproval({
				jobId,
				designId: design.id,
				brief,
				userMessage: message,
				recentTranscript: transcript,
				creativeDesignUrl: design.creativeDesignUrl,
				designNotes: designNotesFromMetadata(design.metadata),
			});

			if (chat.action === "regenerate_design") {
				await appendAssistant(chat.assistantText, { action: chat.action });
				const regenJobId = randomUUID();
				await db.insert(nebGenerationJob).values({
					id: regenJobId,
					designId: design.id,
					type: "CREATIVE_DESIGN",
					status: "QUEUED",
					input: { brief, userFeedback: message, webContext },
					createdAt: new Date(),
				});
				await db
					.update(nebDesign)
					.set({ aiStatus: "GENERATING", workflowPhase: "DESIGNING", updatedAt: new Date() })
					.where(eq(nebDesign.id, design.id));
				await enqueueNebBuildJob(regenJobId);
			} else if (chat.action === "ready_to_build") {
				await appendAssistant(
					`${chat.assistant_text}\n\nClick **Approve & build email** when you're ready — I'll implement the HTML template.`,
					{ action: chat.action },
				);
			} else {
				await appendAssistant(chat.assistantText, { action: chat.action });
			}
		} else if (job.type === "REVISION") {
			const fresh = await db.query.nebDesign.findFirst({
				where: eq(nebDesign.id, design.id),
			});
			const message = (job.input as { message?: string })?.message ?? "";
			const result = await runNebRevision({
				jobId,
				designId: design.id,
				userMessage: message,
				currentHtml: fresh?.htmlContent ?? design.htmlContent,
				brief,
				brandKit,
				userId: design.userId,
				teamId: design.teamId,
			});
			await appendAssistant(result.assistantText);
		} else {
			throw new Error(`Unsupported job type: ${job.type}`);
		}

		return c.json({ success: true });
	} catch (error) {
		console.error("[NebWorker] Build failed:", error);
		return c.json({ error: "Build failed" }, 500);
	}
}
