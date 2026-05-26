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

import { NEB_HTML_MODEL, NEB_REVISION_MODEL } from "./constants";
import { generateCreativeDesignSpec } from "./creative-spec";
import { generateNanoBananaPro } from "./nano-banana";
import type { NanoBananaAspectRatio } from "./nano-banana";
import { parseHtmlAgentResponse } from "./parse-responses";
import { patchImagePlaceholders, processEmailHtml } from "./pipeline";
import { buildBrandContext, buildHtmlArchitectSystemPrompt, buildRevisionSystemPrompt, buildRevisionUserPrompt } from "./prompts";
import { buildHtmlContinuationPrompt, buildHtmlFromSpecPrompt } from "./prompts-build";
import { mirrorNebBriefLogoIfNeeded } from "./logo";
import { runAnthropicOnReplicate } from "./replicate-llm";
import type { NebBrief, NebHtmlArchitectOutput, NebImageSlot } from "./types";
import { htmlArchitectOutputSchema, revisionOutputSchema } from "./types";

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

function isIconSlot(slot: NebImageSlot): boolean {
	return slot.kind === "icon" || slot.key.startsWith("icon_");
}

async function hydrateImages(params: {
	designId: string;
	userId: string;
	teamId?: string | null;
	html: string;
	slots: NebImageSlot[];
	replicate: Replicate;
	creativeDesignUrl?: string | null;
}): Promise<string> {
	const slots = params.slots ?? [];
	if (!slots.length) return params.html;

	await db
		.update(nebDesign)
		.set({ aiStatus: "HYDRATING_IMAGES", updatedAt: new Date() })
		.where(eq(nebDesign.id, params.designId));

	const replacements: Record<string, string> = {};
	const compRef = params.creativeDesignUrl?.trim();

	for (const slot of slots) {
		const isIcon = isIconSlot(slot);
		const aspect = (isIcon ? "1:1" : (slot.aspectRatio ?? "16:9")) as NanoBananaAspectRatio;
		const compRefLine = compRef
			? `\nReference image_input[0] is the approved email comp. Recreate the "${slot.key}" element exactly as shown.`
			: "";

		const slotPrompt = isIcon
			? `${slot.prompt}${compRefLine}\nIsolated icon only on plain white background. NO TEXT. NO EMOJI. Flat line-art style matching the comp.`
			: `${slot.prompt}${compRefLine}`;

		const { fileUrl, storageKey } = await generateNanoBananaPro(params.replicate, {
			prompt: slotPrompt,
			resolution: slot.imageSize === "1K" ? "1K" : "2K",
			aspectRatio: aspect,
			outputFormat: isIcon ? "png" : "jpg",
			imageInput: compRef ? [compRef] : undefined,
		});
		replacements[slot.key] = fileUrl;

		await db.insert(nebAsset).values({
			id: randomUUID(),
			userId: params.userId,
			teamId: params.teamId ?? null,
			designId: params.designId,
			kind: isIcon ? "INLINE" : slot.key === "hero" ? "HERO" : "INLINE",
			fileUrl,
			storageKey: storageKey ?? null,
			mimeType: isIcon ? "image/png" : "image/jpeg",
			altText: slot.alt,
			prompt: slot.prompt,
			createdAt: new Date(),
		});
	}

	return patchImagePlaceholders(params.html, replacements);
}

const MAX_HTML_CONTINUATIONS = 2;

async function buildHtmlFromSpec(params: {
	replicate: Replicate;
	designSpecification: string;
	specMetaJson: string;
	brandBlock: string;
	creativeDesignUrl: string;
}): Promise<NebHtmlArchitectOutput> {
	const htmlUserPrompt = buildHtmlFromSpecPrompt({
		designSpecification: params.designSpecification,
		specMetaJson: params.specMetaJson,
		brandBlock: params.brandBlock,
		creativeDesignUrl: params.creativeDesignUrl,
	});

	let htmlRaw = await runAnthropicOnReplicate({
		replicate: params.replicate,
		model: NEB_HTML_MODEL,
		systemPrompt: buildHtmlArchitectSystemPrompt(),
		userPrompt: htmlUserPrompt,
		maxTokens: 24000,
	});

	let built = parseHtmlAgentResponse(
		htmlRaw,
		htmlArchitectOutputSchema,
		"HTML architect",
	) as NebHtmlArchitectOutput;

	for (let i = 0; i < MAX_HTML_CONTINUATIONS && !built.html.includes("</html>"); i++) {
		const contRaw = await runAnthropicOnReplicate({
			replicate: params.replicate,
			model: NEB_HTML_MODEL,
			systemPrompt: buildHtmlArchitectSystemPrompt(),
			userPrompt: buildHtmlContinuationPrompt({
				designSpecification: params.designSpecification,
				specMetaJson: params.specMetaJson,
				brandBlock: params.brandBlock,
				partialHtml: built.html,
			}),
			maxTokens: 24000,
		});
		const cont = parseHtmlAgentResponse(
			contRaw,
			htmlArchitectOutputSchema,
			"HTML architect (continuation)",
		) as NebHtmlArchitectOutput;
		built = {
			...cont,
			html: built.html + cont.html,
			change_summary: cont.change_summary || built.change_summary,
			assistant_text: cont.assistant_text || built.assistant_text,
		};
	}

	return built;
}

export type RunNebBuildEmailParams = RunNebBuildParams & {
	creativeDesignUrl: string;
	designNotes?: string;
	webContext?: string | null;
	/** INITIAL first build, BUILD_RETRY regeneration from approved creative */
	buildTrigger?: "INITIAL" | "BUILD_RETRY";
};

export async function runNebBuildEmail(params: RunNebBuildEmailParams): Promise<{
	assistantText: string;
	subject: string;
	preheader: string;
}> {
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
	const buildTrigger = params.buildTrigger ?? "INITIAL";

	const { brief: briefWithLogo } = await mirrorNebBriefLogoIfNeeded(
		params.brief,
		params.brandKit,
	);
	if (briefWithLogo.logoUrl !== params.brief.logoUrl) {
		await db
			.update(nebDesign)
			.set({ brief: briefWithLogo, updatedAt: new Date() })
			.where(eq(nebDesign.id, params.designId));
	}
	params = { ...params, brief: briefWithLogo };

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
		// Step 1: Single vision call — exhaustive design specification (+ continuation if truncated)
		const creativeSpec = await generateCreativeDesignSpec({
			replicate,
			brief: params.brief,
			brandBlock,
			creativeDesignUrl: params.creativeDesignUrl,
			designNotes: params.designNotes,
			webContext: params.webContext,
		});

		const specMetaJson = JSON.stringify({
			subject: creativeSpec.subject,
			preheader: creativeSpec.preheader,
			image_slots: creativeSpec.imageSlots,
		});

		await db
			.update(nebDesign)
			.set({
				designPlan: {
					subject: creativeSpec.subject,
					preheader: creativeSpec.preheader,
					image_slots: creativeSpec.imageSlots,
					designSpecification: creativeSpec.designSpecification,
				},
				subject: creativeSpec.subject,
				preheader: creativeSpec.preheader,
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));

		// Step 2: HTML from specification only (no vision — spec is the source of truth)
		const built = await buildHtmlFromSpec({
			replicate,
			designSpecification: creativeSpec.designSpecification,
			specMetaJson,
			brandBlock,
			creativeDesignUrl: params.creativeDesignUrl,
		});

		const processed = processEmailHtml(built.html);
		if (!processed.validation.ok) {
			throw new Error(processed.validation.errors.join("; "));
		}

		let html = processed.html;

		if (creativeSpec.imageSlots.length > 0) {
			html = await hydrateImages({
				designId: params.designId,
				userId: params.userId,
				teamId: params.teamId,
				html,
				slots: creativeSpec.imageSlots,
				replicate,
				creativeDesignUrl: params.creativeDesignUrl,
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
			trigger: buildTrigger,
			changeSummary: built.change_summary,
			messageId: job?.messageId ?? undefined,
			validationReport: finalProcessed.validation,
		});

		await db
			.update(nebDesign)
			.set({
				subject: creativeSpec.subject,
				preheader: creativeSpec.preheader,
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
				output: {
					subject: creativeSpec.subject,
					changeSummary: built.change_summary,
				},
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));

		return {
			assistantText: built.assistant_text,
			subject: creativeSpec.subject,
			preheader: creativeSpec.preheader,
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
