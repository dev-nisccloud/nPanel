import { randomUUID } from "node:crypto";
import { db, eq } from "@npanel/db";
import {
	nebAsset,
	nebDesign,
	nebGenerationJob,
} from "@npanel/db/schema/nisc-email-builder";
import Replicate from "replicate";
import { env } from "@npanel/env/server";
import { z } from "zod";

import { NEB_CREATIVE_DIRECTOR_MODEL } from "./constants";
import { generateNanoBananaPro } from "./nano-banana";
import { parseJsonFromModel } from "./json-parse";
import {
	buildCreativeDirectorSystemPrompt,
	buildCreativeDirectorUserPrompt,
	buildChatOrchestratorSystemPrompt,
} from "./prompts-creative";
import { buildBrandContext } from "./prompts";
import {
	buildNanoBananaLogoDirective,
	mirrorNebBriefLogoIfNeeded,
} from "./logo";
import { runAnthropicOnReplicate } from "./replicate-llm";
import type { NebBrief } from "./types";

const creativeDirectorSchema = z.object({
	image_prompt: z.string(),
	assistant_text: z.string(),
	design_notes: z.string(),
});

const chatOrchestratorSchema = z.object({
	assistant_text: z.string(),
	action: z.enum(["none", "regenerate_design", "ready_to_build"]),
});

export type RunCreativeDesignParams = {
	jobId: string;
	designId: string;
	brief: NebBrief;
	brandKit?: Parameters<typeof buildBrandContext>[1];
	userId: string;
	teamId?: string | null;
	userFeedback?: string;
	webContext?: string | null;
};

export type DesignVariation = {
	id: string;
	url: string;
	prompt: string;
	notes: string;
	createdAt: string;
};

function mergeMetadata(
	existing: unknown,
	patch: Record<string, unknown>,
): Record<string, unknown> {
	const base =
		existing && typeof existing === "object" ? (existing as Record<string, unknown>) : {};
	return { ...base, ...patch };
}

export async function runNebCreativeDesign(
	params: RunCreativeDesignParams,
): Promise<{ assistantText: string; creativeDesignUrl: string }> {
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
			workflowPhase: "DESIGNING",
			updatedAt: new Date(),
		})
		.where(eq(nebDesign.id, params.designId));

	try {
		const directorRaw = await runAnthropicOnReplicate({
			replicate,
			model: NEB_CREATIVE_DIRECTOR_MODEL,
			systemPrompt: buildCreativeDirectorSystemPrompt(),
			userPrompt: buildCreativeDirectorUserPrompt(
				params.brief,
				brandBlock,
				params.userFeedback,
				params.webContext,
			),
			maxTokens: 8192,
		});

		const directed = parseJsonFromModel(directorRaw, creativeDirectorSchema);

		const { brief: briefWithLogo, replicateLogoUrl } =
			await mirrorNebBriefLogoIfNeeded(params.brief, params.brandKit);
		if (briefWithLogo.logoUrl !== params.brief.logoUrl) {
			await db
				.update(nebDesign)
				.set({ brief: briefWithLogo, updatedAt: new Date() })
				.where(eq(nebDesign.id, params.designId));
		}

		const imagePrompt = replicateLogoUrl
			? `${directed.image_prompt}${buildNanoBananaLogoDirective(replicateLogoUrl)}`
			: directed.image_prompt;

		const { fileUrl, storageKey } = await generateNanoBananaPro(replicate, {
			prompt: imagePrompt,
			resolution: "2K",
			aspectRatio: "9:16",
			outputFormat: "png",
			imageInput: replicateLogoUrl ? [replicateLogoUrl] : undefined,
		});

		const assetId = randomUUID();
		await db.insert(nebAsset).values({
			id: assetId,
			userId: params.userId,
			teamId: params.teamId ?? null,
			designId: params.designId,
			kind: "CREATIVE_MOCKUP",
			fileUrl,
			storageKey: storageKey ?? null,
			mimeType: "image/png",
			altText: "Email creative design",
			prompt: directed.image_prompt,
			createdAt: new Date(),
		});

		// Load existing metadata so we can append the variation without wiping other fields
		const existing = await db.query.nebDesign.findFirst({
			columns: { metadata: true },
			where: eq(nebDesign.id, params.designId),
		});
		const existingMeta =
			existing?.metadata && typeof existing.metadata === "object"
				? (existing.metadata as Record<string, unknown>)
				: {};
		const existingVariations: DesignVariation[] = Array.isArray(
			existingMeta.designVariations,
		)
			? (existingMeta.designVariations as DesignVariation[])
			: [];

		const newVariation: DesignVariation = {
			id: assetId,
			url: fileUrl,
			prompt: directed.image_prompt,
			notes: directed.design_notes,
			createdAt: new Date().toISOString(),
		};

		const designVariations = [...existingVariations, newVariation];

		const approvalAsk =
			"\n\n---\n**Are you happy with this creative direction?** Click **Approve & build email** to implement it as a production HTML template, or ask for changes — I'll revise the design.";
		const assistantText = directed.assistant_text + approvalAsk;

		await db
			.update(nebDesign)
			.set({
				creativeDesignUrl: fileUrl,
				creativeDesignPrompt: directed.image_prompt,
				thumbnailUrl: fileUrl,
				metadata: mergeMetadata(existingMeta, {
					design_notes: directed.design_notes,
					designVariations,
				}),
				workflowPhase: "AWAITING_APPROVAL",
				aiStatus: "IDLE",
				updatedAt: new Date(),
			})
			.where(eq(nebDesign.id, params.designId));

		await db
			.update(nebGenerationJob)
			.set({
				status: "SUCCEEDED",
				output: { directed, fileUrl },
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));

		return { assistantText, creativeDesignUrl: fileUrl };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await db
			.update(nebDesign)
			.set({
				workflowPhase: "FAILED",
				aiStatus: "FAILED",
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

export async function runNebChatDuringApproval(params: {
	jobId: string;
	designId: string;
	brief: NebBrief;
	userMessage: string;
	recentTranscript: string;
	creativeDesignUrl?: string | null;
	designNotes?: string;
}): Promise<{
	assistantText: string;
	action: "none" | "regenerate_design" | "ready_to_build";
}> {
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

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
			model: NEB_CREATIVE_DIRECTOR_MODEL,
			systemPrompt: buildChatOrchestratorSystemPrompt(),
			userPrompt: `CREATIVE MOCKUP URL: ${params.creativeDesignUrl ?? "none"}
DESIGN NOTES: ${params.designNotes ?? ""}

RECENT CHAT:
${params.recentTranscript}

USER:
${params.userMessage}`,
			maxTokens: 2048,
		});

		const parsed = parseJsonFromModel(raw, chatOrchestratorSchema);

		await db
			.update(nebGenerationJob)
			.set({
				status: "SUCCEEDED",
				output: parsed,
				completedAt: new Date(),
			})
			.where(eq(nebGenerationJob.id, params.jobId));

		await db
			.update(nebDesign)
			.set({ aiStatus: "IDLE", updatedAt: new Date() })
			.where(eq(nebDesign.id, params.designId));

		return {
			assistantText: parsed.assistant_text,
			action: parsed.action,
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await db
			.update(nebDesign)
			.set({ aiStatus: "FAILED", updatedAt: new Date() })
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
