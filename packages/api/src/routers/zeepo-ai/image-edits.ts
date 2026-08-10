/**
 * Zeepo AI image edits — Gemini Interactions (no Replicate).
 * Mirrors Agent image-edit surface for the live edit panel.
 */
import { TRPCError } from "@trpc/server";
import { asc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import {
	zeepoAiGeneration,
	zeepoAiImageEditHistory,
	zeepoAiSession,
	zeepoAiUsageEvent,
} from "@npanel/db/schema/zeepo-ai";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import {
	createZeepoAiImage,
	editZeepoAiImage,
	fetchImageAsRef,
	persistZeepoAiImageBuffer,
	ZEEPO_AI_IMAGE_MODELS,
	ZEEPO_AI_IMAGE_PROVIDER,
} from "../../lib/zeepo-ai-gemini-image";
import { providerMicrosToCustomerTokens } from "../../lib/zeepo-ai-billing";
import {
	debitZeepoAiTokens,
	logZeepoAiAgencyUsage,
	shouldBillZeepoAiTokens,
} from "../../lib/zeepo-ai-tokens";
import {
	editTextSchema,
	eraseObjectSchema,
	generateVariationsSchema,
	instructImageEditSchema,
	listZeepoAiImageEditHistorySchema,
	saveZeepoAiEditedImageSchema,
	styleTransferSchema,
	swapBackgroundSchema,
	upscaleImageSchema,
} from "./image-schemas";

const STYLE_PROMPTS: Record<string, string> = {
	watercolor:
		"Transform this image into a soft watercolour painting. Preserve the composition and subjects. Paint-like washes, visible brush strokes, white paper showing through, gentle colour bleeding.",
	oil_painting:
		"Transform this image into a rich oil painting. Preserve the composition. Thick impasto brushwork, deep saturated colours, canvas texture, museum-quality fine art style.",
	cinematic:
		"Transform this image to cinematic film look. Preserve the composition. Anamorphic lens flare, teal and orange colour grade, shallow depth of field, 35mm film grain, Hollywood blockbuster aesthetic.",
	anime:
		"Transform this image to high-quality anime illustration style. Preserve the composition and subjects. Clean line art, flat cell shading, vibrant colours, Studio Ghibli or Makoto Shinkai aesthetic.",
	pixel_art:
		"Transform this image to pixel art style. Preserve the composition. Retro 16-bit look, visible pixel grid, limited colour palette, crisp hard edges.",
	neon:
		"Transform this image to a neon-glow dark aesthetic. Preserve the composition. Deep black background, vibrant neon pink/blue/green glow, synthwave retro-futurism, light trails.",
	pencil_sketch:
		"Transform this image to a detailed pencil sketch drawing. Preserve the composition. Fine graphite lines, cross-hatching for shadows, white paper background, hand-drawn realism.",
	vintage:
		"Transform this image to vintage 1970s photograph style. Preserve the composition. Kodachrome warm film tones, faded yellows and browns, subtle vignette, authentic analogue grain.",
};

async function authSession(userId: string, sessionId: string) {
	const session = await db.query.zeepoAiSession.findFirst({
		where: eq(zeepoAiSession.id, sessionId),
		columns: { id: true, userId: true, teamId: true },
	});
	if (!session || session.userId !== userId) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return session;
}

async function saveHistory(params: {
	sessionId: string;
	generationId: string;
	parentId?: string | null;
	userId: string;
	imageUrl: string;
	operationType: string;
	label?: string;
	prompt?: string;
	provider?: string;
	modelId?: string;
	providerRequestId?: string | null;
	metadata?: Record<string, unknown>;
}) {
	const id = randomUUID();
	await db.insert(zeepoAiImageEditHistory).values({
		id,
		sessionId: params.sessionId,
		generationId: params.generationId,
		parentId: params.parentId ?? null,
		userId: params.userId,
		imageUrl: params.imageUrl,
		operationType: params.operationType,
		label: params.label ?? null,
		prompt: params.prompt ?? null,
		provider: params.provider ?? ZEEPO_AI_IMAGE_PROVIDER,
		modelId: params.modelId ?? null,
		providerRequestId: params.providerRequestId ?? null,
		metadata: params.metadata ?? null,
	});
	return { id, ...params, createdAt: new Date().toISOString() };
}

async function updateGenerationImageUrl(generationId: string, imageUrl: string) {
	const gen = await db.query.zeepoAiGeneration.findFirst({
		where: eq(zeepoAiGeneration.id, generationId),
		columns: { id: true, outputs: true },
	});
	if (!gen) return;
	const prev =
		gen.outputs && typeof gen.outputs === "object"
			? (gen.outputs as Record<string, unknown>)
			: {};
	await db
		.update(zeepoAiGeneration)
		.set({
			outputs: { ...prev, imageUrl },
			updatedAt: new Date(),
		})
		.where(eq(zeepoAiGeneration.id, generationId));
}

async function billEdit(params: {
	teamId: string | null;
	userId: string;
	userRole?: string | null;
	sessionId: string;
	generationId: string;
	modelId: string;
	interactionId: string | null;
	operationType: string;
}) {
	const micros = 25_000;
	const tokens = providerMicrosToCustomerTokens(micros);
	const usageEventId = randomUUID();
	const bill = shouldBillZeepoAiTokens({
		teamId: params.teamId,
		userId: params.userId,
		userRole: params.userRole,
	});

	await db.insert(zeepoAiUsageEvent).values({
		id: usageEventId,
		teamId: params.teamId,
		userId: params.userId,
		sessionId: params.sessionId,
		generationId: params.generationId,
		eventType: "image_edit",
		provider: ZEEPO_AI_IMAGE_PROVIDER,
		modelId: params.modelId,
		kind: "image",
		status: "succeeded",
		tokensDebited: String(bill ? tokens : 0),
		providerCostUsdMicros: micros,
		metadata: { operationType: params.operationType },
	});

	if (bill && params.teamId && tokens > 0) {
		await debitZeepoAiTokens({
			teamId: params.teamId,
			userId: params.userId,
			sessionId: params.sessionId,
			tokens,
			operationType: "image_edit",
			description: params.operationType,
			providerCostUsdMicros: micros,
			providerRequestId: params.interactionId,
			modelId: params.modelId,
			generationId: params.generationId,
			usageEventId,
		});
	} else {
		await logZeepoAiAgencyUsage({
			teamId: params.teamId,
			userId: params.userId,
			sessionId: params.sessionId,
			usageEventId,
			estimatedTokens: tokens,
			operationType: "image_edit",
			providerCostUsdMicros: micros,
			modelId: params.modelId,
			providerRequestId: params.interactionId,
			metadata: { generationId: params.generationId },
		});
	}
}

async function runGeminiEdit(params: {
	prompt: string;
	imageUrl: string;
	maskDataUrl?: string | null;
	previousInteractionId?: string | null;
}) {
	const source = await fetchImageAsRef(params.imageUrl);
	const mask = params.maskDataUrl ? await fetchImageAsRef(params.maskDataUrl) : null;
	const result = await editZeepoAiImage({
		prompt: params.prompt,
		sourceImage: source,
		maskImage: mask,
		modelId: ZEEPO_AI_IMAGE_MODELS.pro,
		previousInteractionId: params.previousInteractionId,
	});
	const persisted = await persistZeepoAiImageBuffer({
		buffer: result.buffer,
		mimeType: result.mimeType,
	});
	return {
		imageUrl: persisted.fileUrl,
		modelId: result.modelId,
		interactionId: result.interactionId,
	};
}

export const zeepoAiImageEditsRouter = router({
	listEditHistory: zeepoAiProcedure
		.input(listZeepoAiImageEditHistorySchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const gen = await db.query.zeepoAiGeneration.findFirst({
				where: eq(zeepoAiGeneration.id, input.generationId),
				columns: { id: true, userId: true },
			});
			if (!gen || gen.userId !== userId) throw new TRPCError({ code: "NOT_FOUND" });

			const history = await db.query.zeepoAiImageEditHistory.findMany({
				where: eq(zeepoAiImageEditHistory.generationId, input.generationId),
				orderBy: [asc(zeepoAiImageEditHistory.createdAt)],
			});
			return { history };
		}),

	saveEditedImage: zeepoAiProcedure
		.input(saveZeepoAiEditedImageSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: input.imageUrl,
				operationType: input.operationType,
				label: input.label,
				prompt: input.prompt,
				metadata: input.metadata as Record<string, unknown> | undefined,
			});

			if (input.operationType !== "original") {
				await updateGenerationImageUrl(input.generationId, input.imageUrl);
			}

			return { record, imageUrl: input.imageUrl };
		}),

	instruct: zeepoAiProcedure.input(instructImageEditSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);
		if (!process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Image editing is temporarily unavailable.",
			});
		}

		const prompt = input.maskDataUrl
			? `Edit only the highlighted/selected region: ${input.prompt}`
			: input.prompt;

		const edited = await runGeminiEdit({
			prompt,
			imageUrl: input.imageUrl,
			maskDataUrl: input.maskDataUrl,
		});

		let record = null;
		if (input.generationId) {
			record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: edited.imageUrl,
				operationType: "instruction",
				label: input.maskDataUrl ? "Region Edit" : "Instruction Edit",
				prompt: input.prompt,
				modelId: edited.modelId,
				providerRequestId: edited.interactionId,
			});
			await updateGenerationImageUrl(input.generationId, edited.imageUrl);
			await billEdit({
				teamId: session.teamId,
				userId,
				userRole: ctx.session?.user?.role,
				sessionId: input.sessionId,
				generationId: input.generationId,
				modelId: edited.modelId,
				interactionId: edited.interactionId,
				operationType: "instruction",
			});
		}

		return { imageUrl: edited.imageUrl, record };
	}),

	styleTransfer: zeepoAiProcedure.input(styleTransferSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);

		const stylePrompt =
			input.customPrompt ?? STYLE_PROMPTS[input.style] ?? STYLE_PROMPTS.watercolor!;
		const edited = await runGeminiEdit({
			prompt: stylePrompt,
			imageUrl: input.imageUrl,
		});

		const styleLabels: Record<string, string> = {
			watercolor: "Watercolor",
			oil_painting: "Oil Painting",
			cinematic: "Cinematic",
			anime: "Anime",
			pixel_art: "Pixel Art",
			neon: "Neon Glow",
			pencil_sketch: "Pencil Sketch",
			vintage: "Vintage Film",
		};

		const record = await saveHistory({
			sessionId: input.sessionId,
			generationId: input.generationId,
			parentId: input.parentId,
			userId,
			imageUrl: edited.imageUrl,
			operationType: "style",
			label: styleLabels[input.style] ?? "Style Transfer",
			prompt: stylePrompt,
			modelId: edited.modelId,
			providerRequestId: edited.interactionId,
			metadata: { style: input.style },
		});
		await updateGenerationImageUrl(input.generationId, edited.imageUrl);
		await billEdit({
			teamId: session.teamId,
			userId,
			userRole: ctx.session?.user?.role,
			sessionId: input.sessionId,
			generationId: input.generationId,
			modelId: edited.modelId,
			interactionId: edited.interactionId,
			operationType: "style",
		});

		return { imageUrl: edited.imageUrl, record };
	}),

	eraseObject: zeepoAiProcedure.input(eraseObjectSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);

		const edited = await runGeminiEdit({
			prompt:
				"Remove the object or region marked in the mask. Fill the area naturally so it looks like the object was never there. Preserve everything outside the mask.",
			imageUrl: input.imageUrl,
			maskDataUrl: input.maskDataUrl,
		});

		const record = await saveHistory({
			sessionId: input.sessionId,
			generationId: input.generationId,
			parentId: input.parentId,
			userId,
			imageUrl: edited.imageUrl,
			operationType: "erase",
			label: "Object Erased",
			modelId: edited.modelId,
			providerRequestId: edited.interactionId,
		});
		await updateGenerationImageUrl(input.generationId, edited.imageUrl);
		await billEdit({
			teamId: session.teamId,
			userId,
			userRole: ctx.session?.user?.role,
			sessionId: input.sessionId,
			generationId: input.generationId,
			modelId: edited.modelId,
			interactionId: edited.interactionId,
			operationType: "erase",
		});

		return { imageUrl: edited.imageUrl, record };
	}),

	swapBackground: zeepoAiProcedure.input(swapBackgroundSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);

		const edited = await runGeminiEdit({
			prompt: `Replace the background of this image with: ${input.bgPrompt}. Keep the main subject(s) sharp and naturally composited into the new scene. Match lighting and colour grade.`,
			imageUrl: input.imageUrl,
		});

		const bgPresetLabels: Record<string, string> = {
			studio_white: "Studio White",
			gradient_blue: "Gradient Blue",
			outdoor_park: "Outdoor Park",
			office_desk: "Office Desk",
			abstract_dark: "Abstract Dark",
			sunset_beach: "Sunset Beach",
		};

		const record = await saveHistory({
			sessionId: input.sessionId,
			generationId: input.generationId,
			parentId: input.parentId,
			userId,
			imageUrl: edited.imageUrl,
			operationType: "background_swap",
			label: input.bgPreset
				? `BG: ${bgPresetLabels[input.bgPreset] ?? input.bgPreset}`
				: "Background Swap",
			prompt: input.bgPrompt,
			modelId: edited.modelId,
			providerRequestId: edited.interactionId,
			metadata: { bgPreset: input.bgPreset ?? null },
		});
		await updateGenerationImageUrl(input.generationId, edited.imageUrl);
		await billEdit({
			teamId: session.teamId,
			userId,
			userRole: ctx.session?.user?.role,
			sessionId: input.sessionId,
			generationId: input.generationId,
			modelId: edited.modelId,
			interactionId: edited.interactionId,
			operationType: "background_swap",
		});

		return { imageUrl: edited.imageUrl, record };
	}),

	upscaleImage: zeepoAiProcedure.input(upscaleImageSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);

		const edited = await runGeminiEdit({
			prompt:
				"Upscale and enhance this image: sharper detail, cleaner edges, reduced noise, preserve composition and colours. Output a high-fidelity version suitable for print.",
			imageUrl: input.imageUrl,
		});

		const record = await saveHistory({
			sessionId: input.sessionId,
			generationId: input.generationId,
			parentId: input.parentId,
			userId,
			imageUrl: edited.imageUrl,
			operationType: "upscale",
			label: "Upscaled & Enhanced",
			modelId: edited.modelId,
			providerRequestId: edited.interactionId,
		});
		await updateGenerationImageUrl(input.generationId, edited.imageUrl);
		await billEdit({
			teamId: session.teamId,
			userId,
			userRole: ctx.session?.user?.role,
			sessionId: input.sessionId,
			generationId: input.generationId,
			modelId: edited.modelId,
			interactionId: edited.interactionId,
			operationType: "upscale",
		});

		return { imageUrl: edited.imageUrl, record };
	}),

	editText: zeepoAiProcedure.input(editTextSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const session = await authSession(userId, input.sessionId);

		const edited = await runGeminiEdit({
			prompt: `Edit the text visible in this image as follows: ${input.prompt}. Keep layout, style, and surrounding design consistent.`,
			imageUrl: input.imageUrl,
		});

		const record = await saveHistory({
			sessionId: input.sessionId,
			generationId: input.generationId,
			parentId: input.parentId,
			userId,
			imageUrl: edited.imageUrl,
			operationType: "text_edit",
			label: "Text Edited",
			prompt: input.prompt,
			modelId: edited.modelId,
			providerRequestId: edited.interactionId,
		});
		await updateGenerationImageUrl(input.generationId, edited.imageUrl);
		await billEdit({
			teamId: session.teamId,
			userId,
			userRole: ctx.session?.user?.role,
			sessionId: input.sessionId,
			generationId: input.generationId,
			modelId: edited.modelId,
			interactionId: edited.interactionId,
			operationType: "text_edit",
		});

		return { imageUrl: edited.imageUrl, record };
	}),

	generateVariations: zeepoAiProcedure
		.input(generateVariationsSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			const session = await authSession(userId, input.sessionId);

			const basePrompt =
				input.prompt ??
				"Create a variation of this image. Preserve the overall composition and subject but introduce subtle creative differences in style, lighting, and detail.";

			const count = input.count ?? 3;
			const source = await fetchImageAsRef(input.imageUrl);

			const variations = await Promise.all(
				Array.from({ length: count }, async (_, i) => {
					const result = await createZeepoAiImage({
						prompt: `${basePrompt} Variation ${i + 1}.`,
						modelId: ZEEPO_AI_IMAGE_MODELS.pro,
						references: [source],
						intent: "edit",
					});
					const persisted = await persistZeepoAiImageBuffer({
						buffer: result.buffer,
						mimeType: result.mimeType,
					});
					const record = await saveHistory({
						sessionId: input.sessionId,
						generationId: input.generationId,
						parentId: input.parentId,
						userId,
						imageUrl: persisted.fileUrl,
						operationType: "variation",
						label: `Variation ${i + 1}`,
						prompt: basePrompt,
						modelId: result.modelId,
						providerRequestId: result.interactionId,
						metadata: { variationIndex: i + 1 },
					});
					await billEdit({
						teamId: session.teamId,
						userId,
						userRole: ctx.session?.user?.role,
						sessionId: input.sessionId,
						generationId: input.generationId,
						modelId: result.modelId,
						interactionId: result.interactionId,
						operationType: "variation",
					});
					return { imageUrl: persisted.fileUrl, record };
				}),
			);

			return { variations };
		}),
});
