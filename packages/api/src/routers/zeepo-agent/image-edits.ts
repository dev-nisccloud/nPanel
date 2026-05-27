// @ts-nocheck
import { TRPCError } from "@trpc/server";
import { asc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import Replicate from "replicate";
import { db } from "@npanel/db";
import {
	zeepoAgentImageEditHistory,
	zeepoAgentGeneration,
	zeepoAgentSession,
} from "@npanel/db/schema/zeepo-agent";
import { env } from "@npanel/env/server";
import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import {
	editTextSchema,
	eraseObjectSchema,
	generateVariationsSchema,
	listImageEditHistorySchema,
	saveEditedImageSchema,
	styleTransferSchema,
	swapBackgroundSchema,
	upscaleImageSchema,
} from "./schemas";
import { UTApi } from "uploadthing/server";

// ── Shared helpers ─────────────────────────────────────────────────────────

const utapi = new UTApi();

/** Upload a URL (Replicate CDN or data URL) to UploadThing and return a durable URL. */
async function persistImageUrl(sourceUrlRaw: string | URL | unknown): Promise<string> {
	// Normalise to a plain string (guards against URL objects slipping through)
	const sourceUrl = sourceUrlRaw instanceof URL
		? sourceUrlRaw.href
		: String(sourceUrlRaw ?? "");

	// data URL → convert to blob buffer first
	if (sourceUrl.startsWith("data:")) {
		const [header, b64] = sourceUrl.split(",");
		const mimeMatch = header?.match(/data:([^;]+)/);
		const mime = mimeMatch?.[1] ?? "image/png";
		const buffer = Buffer.from(b64 ?? "", "base64");
		const blob = new Blob([buffer], { type: mime });
		const file = new File([blob], `edit-${Date.now()}.${mime.split("/")[1] ?? "png"}`, { type: mime });
		const res = await utapi.uploadFiles(file);
		const result = Array.isArray(res) ? res[0] : res;
		if (result?.data) return result.data.ufsUrl ?? result.data.url;
		throw new Error("UploadThing upload failed");
	}

	// Regular URL → use uploadFilesFromUrl
	const res = await utapi.uploadFilesFromUrl(sourceUrl);
	const result = Array.isArray(res) ? res[0] : res;
	if (result?.data) return result.data.ufsUrl ?? result.data.url;
	throw new Error("UploadThing upload failed");
}

/** Upload a base64 PNG data URL (canvas mask) to UploadThing and return a URL. */
async function persistMaskDataUrl(dataUrl: string): Promise<string> {
	return persistImageUrl(dataUrl);
}

/** Robustly extract the first image URL string from Replicate run() output.
 * Handles: plain string, string[], FileOutput (SDK ≥1.x), FileOutput[].
 * Always returns a plain string (never a URL object). */
function extractImageUrl(output: unknown): string | null {
	const items: unknown[] = Array.isArray(output) ? output : [output];
	for (const item of items) {
		if (!item) continue;

		// Plain string URL
		if (typeof item === "string" && item.startsWith("http")) return item;

		// Replicate FileOutput — .url() returns a URL object, .toString() returns href
		if (typeof item === "object" && item !== null) {
			// Try toString() first — Replicate FileOutput.toString() returns the CDN URL string
			const str = String(item);
			if (str.startsWith("http")) return str;

			// Fallback: explicit .url() method (older SDK or other shapes)
			const maybeUrl = (item as Record<string, unknown>).url;
			if (typeof maybeUrl === "function") {
				const resolved = maybeUrl.call(item);
				const s = resolved instanceof URL ? resolved.href : String(resolved ?? "");
				if (s.startsWith("http")) return s;
			}
		}
	}
	return null;
}

/** Authenticate + authorise the session, returns session row. */
async function authSession(userId: string, sessionId: string) {
	const session = await db.query.zeepoAgentSession.findFirst({
		where: eq(zeepoAgentSession.id, sessionId),
		columns: { id: true, userId: true },
	});
	if (!session || session.userId !== userId)
		throw new TRPCError({ code: "NOT_FOUND" });
	return session;
}

/** Persist an edit to the history table and return the record. */
async function saveHistory(params: {
	sessionId: string;
	generationId: string;
	parentId?: string;
	userId: string;
	imageUrl: string;
	operationType: string;
	label?: string;
	prompt?: string;
	metadata?: Record<string, unknown>;
}) {
	const id = randomUUID();
	await db.insert(zeepoAgentImageEditHistory).values({
		id,
		sessionId: params.sessionId,
		generationId: params.generationId,
		parentId: params.parentId ?? null,
		userId: params.userId,
		imageUrl: params.imageUrl,
		operationType: params.operationType,
		label: params.label ?? null,
		prompt: params.prompt ?? null,
		metadata: params.metadata ?? null,
	});
	return { id, ...params };
}

const withTimeout = <T>(p: Promise<T>, ms = 90_000): Promise<T> =>
	Promise.race([
		p,
		new Promise<never>((_, rej) =>
			setTimeout(() => rej(new Error(`Timed out after ${ms / 1000}s`)), ms),
		),
	]);

// ── Style preset → prompt map ──────────────────────────────────────────────

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

// ── Router ─────────────────────────────────────────────────────────────────

export const zeepoAgentImageEditsRouter = router({
	/**
	 * Return the full edit history for a given generation, oldest first.
	 */
	listEditHistory: zeepoAgentProcedure
		.input(listImageEditHistorySchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			// Verify the generation belongs to this user
			const gen = await db.query.zeepoAgentGeneration.findFirst({
				where: eq(zeepoAgentGeneration.id, input.generationId),
				columns: { id: true, userId: true },
			});
			if (!gen || gen.userId !== userId)
				throw new TRPCError({ code: "NOT_FOUND" });

			const history = await db.query.zeepoAgentImageEditHistory.findMany({
				where: eq(
					zeepoAgentImageEditHistory.generationId,
					input.generationId,
				),
				orderBy: [asc(zeepoAgentImageEditHistory.createdAt)],
			});

			return { history };
		}),

	/**
	 * Manually persist any image URL as a history entry.
	 * Used by the frontend after the first time an image is opened in the panel
	 * (creates the "original" snapshot) and after instruction edits via editImage.
	 */
	saveEditedImage: zeepoAgentProcedure
		.input(saveEditedImageSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const persistedUrl = await persistImageUrl(input.imageUrl);
			const record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: persistedUrl,
				operationType: input.operationType,
				label: input.label,
				prompt: input.prompt,
				metadata: input.metadata as Record<string, unknown> | undefined,
			});

			return { record, imageUrl: persistedUrl };
		}),

	/**
	 * Apply a style preset or custom style to an image using flux-2-pro
	 * image-to-image.
	 */
	styleTransfer: zeepoAgentProcedure
		.input(styleTransferSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const stylePrompt =
				input.customPrompt ?? STYLE_PROMPTS[input.style] ?? STYLE_PROMPTS["watercolor"];

			const output = await withTimeout(
				replicate.run("black-forest-labs/flux-2-pro", {
					input: {
						prompt: stylePrompt,
						input_images: [input.imageUrl],
						aspect_ratio: "match_input_image",
						resolution: input.resolution,
						output_format: input.outputFormat,
						output_quality: 90,
						safety_tolerance: 2,
					},
				}),
			);

			const rawUrl = extractImageUrl(output);
			if (!rawUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No image returned." });

			const persistedUrl = await persistImageUrl(rawUrl);
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
				imageUrl: persistedUrl,
				operationType: "style",
				label: styleLabels[input.style] ?? "Style Transfer",
				prompt: stylePrompt,
				metadata: { style: input.style },
			});

			return { imageUrl: persistedUrl, record };
		}),

	/**
	 * Erase an object from the image. The user paints a mask in the panel;
	 * white pixels indicate the region to erase.
	 * Uses bria/eraser — trained on licensed data, commercial-safe.
	 */
	eraseObject: zeepoAgentProcedure
		.input(eraseObjectSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			// bria/eraser requires real URLs, not data URLs — upload mask first
			const maskUrl = await persistMaskDataUrl(input.maskDataUrl);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const output = await withTimeout(
				replicate.run("bria/eraser", {
					input: {
						image_url: input.imageUrl,
						mask_url: maskUrl,
						mask_type: "manual",
						preserve_alpha: true,
						sync: true,
					},
				}),
				60_000,
			);

			const rawUrl = extractImageUrl(output) ?? (typeof output === "string" ? output : null);
			if (!rawUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No image returned." });

			const persistedUrl = await persistImageUrl(rawUrl);
			const record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: persistedUrl,
				operationType: "erase",
				label: "Object Erased",
			});

			return { imageUrl: persistedUrl, record };
		}),

	/**
	 * Swap the background of an image to a new scene described by bgPrompt.
	 * Uses bria/generate-background which handles foreground extraction internally.
	 */
	swapBackground: zeepoAgentProcedure
		.input(swapBackgroundSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const output = await withTimeout(
				replicate.run("bria/generate-background", {
					input: {
						image_url: input.imageUrl,
						bg_prompt: input.bgPrompt,
						refine_prompt: true,
						fast: true,
						sync: true,
					},
				}),
				90_000,
			);

			const rawUrl = extractImageUrl(output) ?? (typeof output === "string" ? output : null);
			if (!rawUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No image returned." });

			const persistedUrl = await persistImageUrl(rawUrl);
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
				imageUrl: persistedUrl,
				operationType: "background_swap",
				label: input.bgPreset
					? `BG: ${bgPresetLabels[input.bgPreset] ?? input.bgPreset}`
					: "Background Swap",
				prompt: input.bgPrompt,
				metadata: { bgPreset: input.bgPreset ?? null },
			});

			return { imageUrl: persistedUrl, record };
		}),

	/**
	 * Upscale and sharpen an image using recraft-ai/recraft-crisp-upscale.
	 * No prompt needed — simply pass the image URL.
	 */
	upscaleImage: zeepoAgentProcedure
		.input(upscaleImageSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const output = await withTimeout(
				replicate.run("recraft-ai/recraft-crisp-upscale", {
					input: {
						image: input.imageUrl,
					},
				}),
				120_000,
			);

			const rawUrl = extractImageUrl(output) ?? (typeof output === "string" ? output : null);
			if (!rawUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No image returned." });

			const persistedUrl = await persistImageUrl(rawUrl);
			const record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: persistedUrl,
				operationType: "upscale",
				label: "Upscaled & Enhanced",
			});

			return { imageUrl: persistedUrl, record };
		}),

	/**
	 * Edit text visible in an image using qwen/qwen-image-edit-2511.
	 * Prompt example: "Change 'GRAND OPENING' to 'SOLD OUT'"
	 */
	editText: zeepoAgentProcedure
		.input(editTextSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const output = await withTimeout(
				replicate.run("qwen/qwen-image-edit-2511", {
					input: {
						image: [input.imageUrl],
						prompt: input.prompt,
						output_format: "webp",
						output_quality: 90,
					},
				}),
				90_000,
			);

			const rawUrl = extractImageUrl(output);
			if (!rawUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No image returned." });

			const persistedUrl = await persistImageUrl(rawUrl);
			const record = await saveHistory({
				sessionId: input.sessionId,
				generationId: input.generationId,
				parentId: input.parentId,
				userId,
				imageUrl: persistedUrl,
				operationType: "text_edit",
				label: "Text Edited",
				prompt: input.prompt,
			});

			return { imageUrl: persistedUrl, record };
		}),

	/**
	 * Generate 3 variations of the current image using flux-2-pro with
	 * different seeds. Returns all three so the user can pick one.
	 */
	generateVariations: zeepoAgentProcedure
		.input(generateVariationsSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			await authSession(userId, input.sessionId);

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

			const seeds = [
				Math.floor(Math.random() * 1_000_000),
				Math.floor(Math.random() * 1_000_000),
				Math.floor(Math.random() * 1_000_000),
			];

			const basePrompt =
				input.prompt ??
				"Create a variation of this image. Preserve the overall composition and subject but introduce subtle creative differences in style, lighting, and detail.";

			const outputs = await withTimeout(
				Promise.all(
					seeds.map((seed) =>
						replicate.run("black-forest-labs/flux-2-pro", {
							input: {
								prompt: basePrompt,
								input_images: [input.imageUrl],
								aspect_ratio: "match_input_image",
								resolution: "1 MP",
								output_format: input.outputFormat,
								output_quality: 90,
								safety_tolerance: 2,
								seed,
							},
						}),
					),
				),
				120_000,
			);

			const variations = await Promise.all(
				outputs.map(async (output, i) => {
					const rawUrl = extractImageUrl(output);
					if (!rawUrl) return null;
					const persistedUrl = await persistImageUrl(rawUrl);
					const record = await saveHistory({
						sessionId: input.sessionId,
						generationId: input.generationId,
						parentId: input.parentId,
						userId,
						imageUrl: persistedUrl,
						operationType: "variation",
						label: `Variation ${i + 1}`,
						prompt: basePrompt,
						metadata: { seed: seeds[i], variationIndex: i + 1 },
					});
					return { imageUrl: persistedUrl, record };
				}),
			);

			return { variations: variations.filter(Boolean) };
		}),
});
