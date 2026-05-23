import { randomUUID } from "node:crypto";
import { db, eq, desc } from "@npanel/db";
import {
	nebAsset,
	nebDesign,
	nebDesignVersion,
	nebGenerationJob,
	nebMessage,
	nebSession,
} from "@npanel/db/schema/nisc-email-builder";
import Replicate from "replicate";
import { env } from "@npanel/env/server";

import {
	NEB_HTML_MODEL,
	NEB_PLANNER_MODEL,
	NEB_REVISION_MODEL,
} from "./constants";
import { generateNanoBananaPro } from "./nano-banana";
import type { NanoBananaAspectRatio } from "./nano-banana";
import {
	parseHtmlAgentResponse,
	parsePlannerResponse,
} from "./parse-responses";
import {
	patchImagePlaceholders,
	processEmailHtml,
} from "./pipeline";
import {
	buildBrandContext,
	buildHtmlArchitectSystemPrompt,
	buildHtmlArchitectUserPrompt,
	buildPlannerSystemPrompt,
	buildPlannerUserPrompt,
	buildRevisionSystemPrompt,
	buildRevisionUserPrompt,
} from "./prompts";
import { runAnthropicOnReplicate } from "./replicate-llm";
import type { NebBrief, NebHtmlArchitectOutput } from "./types";
import {
	htmlArchitectOutputSchema,
	revisionOutputSchema,
} from "./types";

export type RunNebBuildParams = {
	jobId: string;
	designId: string;
	brief: NebBrief;
	brandKit?: {
		colors?: Record<string, string> | null;
		footerLegal?: string | null;
		logoUrl?: string | null;
	};
	userId: string;
	teamId?: string | null;
};

export type RunNebRevisionParams = {
	jobId: string;
	designId: string;
	userMessage: string;
	currentHtml: string;
	brief: NebBrief;
	brandKit?: RunNebBuildParams["brandKit"];
	userId: string;
	teamId?: string | null;
};

async function nextVersionNumber(designId: string): Promise<number> {
	const latest = await db.query.nebDesignVersion.findFirst({
		where: eq(nebDesignVersion.designId, designId),
		orderBy: [desc(nebDesignVersion.versionNumber)],
	});
	return (latest?.versionNumber ?? 0) + 1;
}

async function saveVersion(params: {
	designId: string;
	html: string;
	text: string;
	trigger: string;
	changeSummary: string;
	messageId?: string;
	validationReport: unknown;
}): Promise<string> {
	const versionId = randomUUID();
	const versionNumber = await nextVersionNumber(params.designId);
	await db.insert(nebDesignVersion).values({
		id: versionId,
		designId: params.designId,
		versionNumber,
		htmlContent: params.html,
		textContent: params.text,
		changeSummary: params.changeSummary,
		trigger: params.trigger,
		messageId: params.messageId ?? null,
		validationReport: params.validationReport,
		createdAt: new Date(),
	});
	await db
		.update(nebDesign)
		.set({
			htmlContent: params.html,
			textContent: params.text,
			currentVersionId: versionId,
			status: "DRAFT",
			updatedAt: new Date(),
		})
		.where(eq(nebDesign.id, params.designId));
	return versionId;
}

async function hydrateImages(params: {
	designId: string;
	userId: string;
	teamId?: string | null;
	html: string;
	slots: Array<{
		key: string;
		prompt: string;
		alt: string;
		aspectRatio: "1:1" | "3:2" | "16:9" | "4:3" | "9:16";
		imageSize?: "1K" | "2K";
	}>;
	replicate: Replicate;
}): Promise<string> {
	const slots = params.slots ?? [];
	if (!slots.length) return params.html;

	await db
		.update(nebDesign)
		.set({ aiStatus: "HYDRATING_IMAGES", updatedAt: new Date() })
		.where(eq(nebDesign.id, params.designId));

	const replacements: Record<string, string> = {};

	for (const slot of slots) {
		const aspect = (slot.aspectRatio ?? "16:9") as NanoBananaAspectRatio;
		const { fileUrl, storageKey } = await generateNanoBananaPro(params.replicate, {
			prompt: slot.prompt,
			resolution: slot.imageSize === "1K" ? "1K" : "2K",
			aspectRatio: aspect,
			outputFormat: "jpg",
		});
		replacements[slot.key] = fileUrl;

		await db.insert(nebAsset).values({
			id: randomUUID(),
			userId: params.userId,
			teamId: params.teamId ?? null,
			designId: params.designId,
			kind: slot.key === "hero" ? "HERO" : "INLINE",
			fileUrl,
			storageKey: storageKey ?? null,
			mimeType: "image/jpeg",
			altText: slot.alt,
			prompt: slot.prompt,
			createdAt: new Date(),
		});
	}

	return patchImagePlaceholders(params.html, replacements);
}

export type RunNebBuildEmailParams = RunNebBuildParams & {
	creativeDesignUrl: string;
	designNotes?: string;
	webContext?: string | null;
};

export async function runNebBuildEmail(params: RunNebBuildEmailParams): Promise<{
	assistantText: string;
	subject: string;
	preheader: string;
}> {
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
	const brandBlock = buildBrandContext(params.brief, params.brandKit);

	await db
		.update(nebGenerationJob)
		.set({ status: "RUNNING" })
		.where(eq(nebGenerationJob.id, params.jobId));

	await db
		.update(nebDesign)
		.set({
			aiStatus: "GENERATING",
			workflowPhase: "BUILDING",
			updatedAt: new Date(),
		})
		.where(eq(nebDesign.id, params.designId));

	try {
		const creativeContext = `APPROVED CREATIVE MOCKUP URL: ${params.creativeDesignUrl}
DESIGN NOTES FROM CREATIVE PHASE:
${params.designNotes ?? "Match the approved mockup layout, colors, and hierarchy."}
Implement the email to faithfully match this visual comp.`;

		// Agent 1: Planner (uses approved creative as guideline)
		const plannerRaw = await runAnthropicOnReplicate({
			replicate,
			model: NEB_PLANNER_MODEL,
			systemPrompt: buildPlannerSystemPrompt(),
			userPrompt: `${creativeContext}\n\n${buildPlannerUserPrompt(params.brief, brandBlock, params.webContext)}`,
			maxTokens: 4096,
		});
		const plan = parsePlannerResponse(plannerRaw);

		await db
			.update(nebDesign)
			.set({ designPlan: plan, updatedAt: new Date() })
			.where(eq(nebDesign.id, params.designId));

		// Agent 2: HTML architect
		const htmlRaw = await runAnthropicOnReplicate({
			replicate,
			model: NEB_HTML_MODEL,
			systemPrompt: buildHtmlArchitectSystemPrompt(),
			userPrompt: buildHtmlArchitectUserPrompt({
				planJson: JSON.stringify(plan),
				brandBlock,
				brief: params.brief,
				creativeContext,
				webContext: params.webContext,
			}),
			maxTokens: 16000,
		});
		let built = parseHtmlAgentResponse(
			htmlRaw,
			htmlArchitectOutputSchema,
			"HTML architect",
		) as NebHtmlArchitectOutput;

		if (!built.html.includes("</html>")) {
			const repairRaw = await runAnthropicOnReplicate({
				replicate,
				model: NEB_HTML_MODEL,
				systemPrompt: buildHtmlArchitectSystemPrompt(),
				userPrompt: `Your previous response was incomplete (missing closing </html>). Re-emit the COMPLETE email using the delimiter format.\n\n${buildHtmlArchitectUserPrompt({
					planJson: JSON.stringify(plan),
					brandBlock,
					brief: params.brief,
					creativeContext,
					webContext: params.webContext,
				})}`,
				maxTokens: 16000,
			});
			built = parseHtmlAgentResponse(
				repairRaw,
				htmlArchitectOutputSchema,
				"HTML architect (repair)",
			) as NebHtmlArchitectOutput;
		}

		const processed = processEmailHtml(built.html);
		if (!processed.validation.ok) {
			throw new Error(processed.validation.errors.join("; "));
		}

		let html = processed.html;

		const planImageSlots = plan.image_slots ?? [];
		if (planImageSlots.length > 0) {
			html = await hydrateImages({
				designId: params.designId,
				userId: params.userId,
				teamId: params.teamId,
				html,
				slots: planImageSlots,
				replicate,
			});
		}

		const finalProcessed = processEmailHtml(html);

		const job = await db.query.nebGenerationJob.findFirst({
			where: eq(nebGenerationJob.id, params.jobId),
		});

		await saveVersion({
			designId: params.designId,
			html: finalProcessed.html,
			text: finalProcessed.text,
			trigger: "INITIAL",
			changeSummary: built.change_summary,
			messageId: job?.messageId ?? undefined,
			validationReport: finalProcessed.validation,
		});

		await db
			.update(nebDesign)
			.set({
				subject: plan.subject,
				preheader: plan.preheader,
				brief: params.brief,
				workflowPhase: "READY",
				aiStatus: "IDLE",
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));

		await db
			.update(nebGenerationJob)
			.set({
				status: "SUCCEEDED",
				output: { plan, changeSummary: built.change_summary },
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));

		return {
			assistantText: built.assistant_text || plan.assistant_summary,
			subject: plan.subject,
			preheader: plan.preheader,
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await db
			.update(nebDesign)
			.set({
				aiStatus: "FAILED",
				workflowPhase: "FAILED",
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));
		await db
			.update(nebGenerationJob)
			.set({
				status: "FAILED",
				errorMessage: msg.slice(0, 500),
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));
		throw e;
	}
}

export async function runNebRevision(
	params: RunNebRevisionParams,
): Promise<{ assistantText: string }> {
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
	const brandBlock = buildBrandContext(params.brief, params.brandKit);

	const session = await db.query.nebSession.findFirst({
		where: eq(nebSession.designId, params.designId),
	});
	const recentMessages = session
		? await db.query.nebMessage.findMany({
				where: eq(nebMessage.sessionId, session.id),
				orderBy: [desc(nebMessage.createdAt)],
				limit: 8,
			})
		: [];
	const transcript = [...recentMessages]
		.reverse()
		.map((m) => `[${m.role}]: ${m.content}`)
		.join("\n");

	await db
		.update(nebGenerationJob)
		.set({ status: "RUNNING" })
		.where(eq(nebGenerationJob.id, params.jobId));

	await db
		.update(nebDesign)
		.set({ aiStatus: "GENERATING", updatedAt: new Date() })
		.where(eq(nebDesign.id, params.designId));

	try {
		const raw = await runAnthropicOnReplicate({
			replicate,
			model: NEB_REVISION_MODEL,
			systemPrompt: buildRevisionSystemPrompt(),
			userPrompt: buildRevisionUserPrompt({
				currentHtml: params.currentHtml,
				userMessage: params.userMessage,
				brandBlock,
				recentTranscript: transcript,
			}),
			maxTokens: 12000,
		});
		const revised = parseHtmlAgentResponse(
			raw,
			revisionOutputSchema,
			"Revision",
		) as Awaited<ReturnType<typeof revisionOutputSchema.parse>>;
		const processed = processEmailHtml(revised.html);
		if (!processed.validation.ok) {
			throw new Error(processed.validation.errors.join("; "));
		}

		let html = processed.html;
		const slots = revised.image_slots ?? [];
		if (slots.length > 0) {
			html = await hydrateImages({
				designId: params.designId,
				userId: params.userId,
				teamId: params.teamId,
				html,
				slots,
				replicate,
			});
		}

		const finalProcessed = processEmailHtml(html);
		const job = await db.query.nebGenerationJob.findFirst({
			where: eq(nebGenerationJob.id, params.jobId),
		});

		await saveVersion({
			designId: params.designId,
			html: finalProcessed.html,
			text: finalProcessed.text,
			trigger: "CHAT_REVISION",
			changeSummary: revised.change_summary,
			messageId: job?.messageId ?? undefined,
			validationReport: finalProcessed.validation,
		});

		await db
			.update(nebDesign)
			.set({
				aiStatus: "IDLE",
				workflowPhase: "READY",
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));

		await db
			.update(nebGenerationJob)
			.set({
				status: "SUCCEEDED",
				output: { changeSummary: revised.change_summary },
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));

		return { assistantText: revised.assistant_text };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await db
			.update(nebDesign)
			.set({
				aiStatus: "FAILED",
				workflowPhase: "FAILED",
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));
		await db
			.update(nebGenerationJob)
			.set({
				status: "FAILED",
				errorMessage: msg.slice(0, 500),
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));
		throw e;
	}
}
