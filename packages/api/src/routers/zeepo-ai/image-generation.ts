/**
 * In-stream Gemini image generation for Zeepo AI tools.
 * Emits generation_start / generation_progress / generation SSE events.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	zeepoAiAttachment,
	zeepoAiGeneration,
	zeepoAiImageEditHistory,
	zeepoAiUsageEvent,
} from "@npanel/db/schema/zeepo-ai";
import { randomUUID } from "node:crypto";
import {
	createZeepoAiImage,
	fetchImageAsRef,
	mapWithConcurrency,
	persistZeepoAiImageBuffer,
	pickZeepoAiImageModel,
	ZEEPO_AI_IMAGE_PROVIDER,
	type ZeepoAiAspectRatio,
	type ZeepoAiImageRef,
} from "../../lib/zeepo-ai-gemini-image";
import {
	providerMicrosToCustomerTokens,
} from "../../lib/zeepo-ai-billing";
import {
	debitZeepoAiTokens,
	logZeepoAiAgencyUsage,
	shouldBillZeepoAiTokens,
} from "../../lib/zeepo-ai-tokens";
import type { CreateImagePresentationArgs, GenerateImagesArgs } from "./image-schemas";

const IMAGE_PARALLEL_THRESHOLD = 3;
const IMAGE_PARALLEL_CONCURRENCY = 3;

/** Subset of stream events emitted by image tools (avoids circular import with stream-turn). */
export type ZeepoAiImageStreamEvent =
	| {
			type: "generation_start";
			generationId: string;
			kind: "image";
			slot: number;
			total: number;
			title: string;
	  }
	| {
			type: "generation_progress";
			generationId: string;
			status: string;
			slot: number;
			total: number;
	  }
	| {
			type: "generation";
			generation: {
				id: string;
				kind: string;
				title: string;
				status: string;
				outputs: unknown;
			};
	  };

function estimateImageCostUsdMicros(modelId: string, usageTokens?: number): number {
	if (usageTokens && usageTokens > 0) {
		// Rough image-token pricing fallback (~$30 / 1M tokens for image models).
		return Math.max(1, Math.round((usageTokens / 1_000_000) * 30 * 1_000_000));
	}
	if (modelId.includes("pro")) return 40_000;
	if (modelId.includes("lite")) return 8_000;
	return 20_000;
}

async function resolveReferenceImages(
	attachmentIds: string[],
	sessionId: string,
): Promise<ZeepoAiImageRef[]> {
	if (!attachmentIds.length) return [];
	const rows = await db.query.zeepoAiAttachment.findMany({
		where: eq(zeepoAiAttachment.sessionId, sessionId),
	});
	const byId = new Map(rows.map((r) => [r.id, r]));
	const refs: ZeepoAiImageRef[] = [];
	for (const id of attachmentIds) {
		const att = byId.get(id);
		if (!att || !att.mimeType.startsWith("image/")) continue;
		refs.push(await fetchImageAsRef(att.url));
	}
	return refs;
}

type EmitFn = (event: ZeepoAiImageStreamEvent) => void | Promise<void>;

type RunContext = {
	sessionId: string;
	assistantMessageId: string;
	userId: string;
	teamId: string | null;
	userRole: string | null | undefined;
	emit: EmitFn;
	signal?: AbortSignal;
};

async function billImageGeneration(params: {
	ctx: RunContext;
	generationId: string;
	modelId: string;
	micros: number;
	interactionId: string | null;
}) {
	const tokens = providerMicrosToCustomerTokens(params.micros);
	const usageEventId = randomUUID();
	const bill = shouldBillZeepoAiTokens({
		teamId: params.ctx.teamId,
		userId: params.ctx.userId,
		userRole: params.ctx.userRole,
	});

	await db.insert(zeepoAiUsageEvent).values({
		id: usageEventId,
		teamId: params.ctx.teamId,
		userId: params.ctx.userId,
		sessionId: params.ctx.sessionId,
		messageId: params.ctx.assistantMessageId,
		generationId: params.generationId,
		eventType: "generation",
		provider: ZEEPO_AI_IMAGE_PROVIDER,
		modelId: params.modelId,
		kind: "image",
		status: "succeeded",
		tokensDebited: String(bill ? tokens : 0),
		providerCostUsdMicros: params.micros,
		metadata: { providerRequestId: params.interactionId },
	});

	if (bill && params.ctx.teamId && tokens > 0) {
		await debitZeepoAiTokens({
			teamId: params.ctx.teamId,
			userId: params.ctx.userId,
			sessionId: params.ctx.sessionId,
			tokens,
			operationType: "media_generation",
			description: "Image generation",
			providerCostUsdMicros: params.micros,
			providerRequestId: params.interactionId,
			modelId: params.modelId,
			generationId: params.generationId,
			usageEventId,
		});
	} else {
		await logZeepoAiAgencyUsage({
			userId: params.ctx.userId,
			teamId: params.ctx.teamId,
			sessionId: params.ctx.sessionId,
			usageEventId,
			estimatedTokens: tokens,
			operationType: "media_generation",
			providerCostUsdMicros: params.micros,
			modelId: params.modelId,
			providerRequestId: params.interactionId,
			metadata: { generationId: params.generationId },
		});
	}

	await db
		.update(zeepoAiGeneration)
		.set({
			tokensDebited: String(tokens),
			providerCostUsdMicros: params.micros,
		})
		.where(eq(zeepoAiGeneration.id, params.generationId));
}

async function runOneImageSlot(params: {
	ctx: RunContext;
	generationId: string;
	prompt: string;
	title: string;
	aspectRatio: ZeepoAiAspectRatio | string;
	intent: string;
	references: ZeepoAiImageRef[];
	slot: number;
	total: number;
}): Promise<{ generationId: string; imageUrl: string | null; ok: boolean; error?: string }> {
	const { ctx } = params;
	const modelId = pickZeepoAiImageModel({
		intent: params.intent,
		count: params.total,
		hasReferences: params.references.length > 0,
	});

	await ctx.emit({
		type: "generation_progress",
		generationId: params.generationId,
		status: "PROCESSING",
		slot: params.slot,
		total: params.total,
	});

	try {
		if (ctx.signal?.aborted) throw new Error("Cancelled");

		const result = await createZeepoAiImage({
			prompt: params.prompt,
			modelId,
			aspectRatio: params.aspectRatio,
			references: params.references,
			intent: params.intent,
		});

		const persisted = await persistZeepoAiImageBuffer({
			buffer: result.buffer,
			mimeType: result.mimeType,
			userId: ctx.userId,
		});

		const outputs = {
			imageUrl: persisted.fileUrl,
			storageKey: persisted.storageKey,
			mimeType: result.mimeType,
		};
		const completedAt = new Date();
		await db
			.update(zeepoAiGeneration)
			.set({
				status: "COMPLETED",
				providerRequestId: result.interactionId,
				modelId: result.modelId,
				outputs,
				completedAt,
				updatedAt: completedAt,
				errorMessage: null,
			})
			.where(eq(zeepoAiGeneration.id, params.generationId));

		// Seed original edit-history row
		await db.insert(zeepoAiImageEditHistory).values({
			id: randomUUID(),
			sessionId: ctx.sessionId,
			generationId: params.generationId,
			parentId: null,
			userId: ctx.userId,
			imageUrl: persisted.fileUrl,
			operationType: "original",
			label: "Original",
			prompt: params.prompt,
			provider: ZEEPO_AI_IMAGE_PROVIDER,
			modelId: result.modelId,
			providerRequestId: result.interactionId,
		});

		const micros = estimateImageCostUsdMicros(
			result.modelId,
			result.usage?.totalTokens,
		);
		await billImageGeneration({
			ctx,
			generationId: params.generationId,
			modelId: result.modelId,
			micros,
			interactionId: result.interactionId,
		});

		await ctx.emit({
			type: "generation_progress",
			generationId: params.generationId,
			status: "COMPLETED",
			slot: params.slot,
			total: params.total,
		});
		await ctx.emit({
			type: "generation",
			generation: {
				id: params.generationId,
				kind: "image",
				title: params.title,
				status: "COMPLETED",
				outputs,
			},
		});

		return { generationId: params.generationId, imageUrl: persisted.fileUrl, ok: true };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Image generation failed";
		const failedAt = new Date();
		await db
			.update(zeepoAiGeneration)
			.set({
				status: "FAILED",
				errorMessage: message,
				completedAt: failedAt,
				updatedAt: failedAt,
			})
			.where(eq(zeepoAiGeneration.id, params.generationId));

		await ctx.emit({
			type: "generation_progress",
			generationId: params.generationId,
			status: "FAILED",
			slot: params.slot,
			total: params.total,
		});
		await ctx.emit({
			type: "generation",
			generation: {
				id: params.generationId,
				kind: "image",
				title: params.title,
				status: "FAILED",
				outputs: { error: message },
			},
		});

		return { generationId: params.generationId, imageUrl: null, ok: false, error: message };
	}
}

export async function executeGenerateImagesTool(
	args: GenerateImagesArgs,
	ctx: RunContext,
): Promise<Record<string, unknown>> {
	const count = args.count;
	const titleBase = args.title?.trim() || args.prompt.slice(0, 80);
	const references = await resolveReferenceImages(
		args.reference_attachment_ids ?? [],
		ctx.sessionId,
	);
	const modelId = pickZeepoAiImageModel({
		intent: args.intent,
		count,
		hasReferences: references.length > 0,
	});

	const slots = Array.from({ length: count }, (_, i) => {
		const id = randomUUID();
		const title = count === 1 ? titleBase : `${titleBase} (${i + 1}/${count})`;
		return { id, title, index: i };
	});

	const now = new Date();
	
	// Batch create all generation records upfront for instant UI feedback
	await db.insert(zeepoAiGeneration).values(
		slots.map((slot) => ({
			id: slot.id,
			sessionId: ctx.sessionId,
			messageId: ctx.assistantMessageId,
			userId: ctx.userId,
			teamId: ctx.teamId,
			kind: "image" as const,
			provider: ZEEPO_AI_IMAGE_PROVIDER,
			modelId,
			status: "PROCESSING" as const,
			prompt: args.prompt,
			inputs: {
				aspect_ratio: args.aspect_ratio,
				intent: args.intent,
				count,
				slot: slot.index + 1,
				reference_attachment_ids: args.reference_attachment_ids ?? [],
			},
			outputs: {},
			startedAt: now,
			createdAt: now,
			updatedAt: now,
		}))
	);

	// Emit all events in parallel for instant loader display
	await Promise.all(
		slots.flatMap((slot) => [
			ctx.emit({
				type: "generation_start",
				generationId: slot.id,
				kind: "image",
				slot: slot.index + 1,
				total: count,
				title: slot.title,
			}),
			ctx.emit({
				type: "generation",
				generation: {
					id: slot.id,
					kind: "image",
					title: slot.title,
					status: "PROCESSING",
					outputs: {},
				},
			}),
		])
	);

	const runSlot = (slot: (typeof slots)[number]) =>
		runOneImageSlot({
			ctx,
			generationId: slot.id,
			prompt: args.prompt,
			title: slot.title,
			aspectRatio: args.aspect_ratio,
			intent: args.intent,
			references,
			slot: slot.index + 1,
			total: count,
		});

	const results =
		count <= IMAGE_PARALLEL_THRESHOLD
			? await (async () => {
					const out = [];
					for (const slot of slots) {
						out.push(await runSlot(slot));
					}
					return out;
				})()
			: await mapWithConcurrency(slots, IMAGE_PARALLEL_CONCURRENCY, (slot) => runSlot(slot));

	const succeeded = results.filter((r) => r.ok);
	const failed = results.filter((r) => !r.ok);

	return {
		status: failed.length === 0 ? "COMPLETED" : succeeded.length ? "PARTIAL" : "FAILED",
		count,
		succeeded: succeeded.length,
		failed: failed.length,
		generationIds: results.map((r) => r.generationId),
		imageUrls: succeeded.map((r) => r.imageUrl).filter(Boolean),
		message:
			failed.length === 0
				? `${succeeded.length} image(s) ready in the panel.`
				: `${succeeded.length} succeeded, ${failed.length} failed. Tell the user plainly without technical details.`,
	};
}

export async function executeCreateImagePresentationTool(
	args: CreateImagePresentationArgs,
	ctx: RunContext,
): Promise<Record<string, unknown>> {
	const slidesNeedingGen = args.slides.filter((s) => !s.imageUrl);
	const imageResults: Array<{ prompt: string; imageUrl: string | null; caption?: string; notes?: string }> =
		[];

	// Generate missing slide images first
	if (slidesNeedingGen.length > 0) {
		const slots = slidesNeedingGen.map((slide, i) => ({
			slide,
			id: randomUUID(),
			index: i,
			title: `${args.title} — slide ${i + 1}`,
		}));
		const modelId = pickZeepoAiImageModel({ intent: "design", count: slots.length });
		const now = new Date();

		// Batch create all generation records upfront for instant UI feedback
		await db.insert(zeepoAiGeneration).values(
			slots.map((slot) => ({
				id: slot.id,
				sessionId: ctx.sessionId,
				messageId: ctx.assistantMessageId,
				userId: ctx.userId,
				teamId: ctx.teamId,
				kind: "image" as const,
				provider: ZEEPO_AI_IMAGE_PROVIDER,
				modelId,
				status: "PROCESSING" as const,
				prompt: slot.slide.prompt,
				inputs: {
					aspect_ratio: args.aspect_ratio,
					intent: "design",
					presentationTitle: args.title,
					slot: slot.index + 1,
				},
				outputs: {},
				startedAt: now,
				createdAt: now,
				updatedAt: now,
			}))
		);

		// Emit all events in parallel for instant loader display
		await Promise.all(
			slots.flatMap((slot) => [
				ctx.emit({
					type: "generation_start",
					generationId: slot.id,
					kind: "image",
					slot: slot.index + 1,
					total: slots.length,
					title: slot.title,
				}),
				ctx.emit({
					type: "generation",
					generation: {
						id: slot.id,
						kind: "image",
						title: slot.title,
						status: "PROCESSING",
						outputs: {},
					},
				}),
			])
		);

		const runSlot = (slot: (typeof slots)[number]) =>
			runOneImageSlot({
				ctx,
				generationId: slot.id,
				prompt: slot.slide.prompt,
				title: slot.title,
				aspectRatio: args.aspect_ratio,
				intent: "design",
				references: [],
				slot: slot.index + 1,
				total: slots.length,
			});

		const results =
			slots.length <= IMAGE_PARALLEL_THRESHOLD
				? await (async () => {
						const out = [];
						for (const slot of slots) out.push(await runSlot(slot));
						return out;
					})()
				: await mapWithConcurrency(slots, IMAGE_PARALLEL_CONCURRENCY, (slot) => runSlot(slot));

		for (let i = 0; i < slots.length; i++) {
			imageResults.push({
				prompt: slots[i]!.slide.prompt,
				imageUrl: results[i]?.imageUrl ?? null,
				caption: slots[i]!.slide.caption,
				notes: slots[i]!.slide.notes,
			});
		}
	}

	// Consume imageResults in order for slides without a pre-supplied URL
	let genIdx = 0;
	const orderedSlides = args.slides.map((slide) => {
		if (slide.imageUrl) {
			return {
				prompt: slide.prompt,
				imageUrl: slide.imageUrl,
				caption: slide.caption,
				notes: slide.notes,
			};
		}
		const generated = imageResults[genIdx++];
		return {
			prompt: slide.prompt,
			imageUrl: generated?.imageUrl ?? undefined,
			caption: slide.caption ?? generated?.caption,
			notes: slide.notes ?? generated?.notes,
		};
	});

	const presentationId = randomUUID();
	const outputs = {
		presentation: {
			title: args.title,
			slides: orderedSlides,
		},
	};
	const now = new Date();
	const readyCount = orderedSlides.filter((s) => s.imageUrl).length;
	await db.insert(zeepoAiGeneration).values({
		id: presentationId,
		sessionId: ctx.sessionId,
		messageId: ctx.assistantMessageId,
		userId: ctx.userId,
		teamId: ctx.teamId,
		kind: "image-presentation",
		provider: ZEEPO_AI_IMAGE_PROVIDER,
		modelId: pickZeepoAiImageModel({ intent: "design" }),
		status: readyCount === orderedSlides.length ? "COMPLETED" : "FAILED",
		prompt: args.title,
		inputs: { aspect_ratio: args.aspect_ratio, slideCount: orderedSlides.length },
		outputs,
		startedAt: now,
		completedAt: now,
		createdAt: now,
		updatedAt: now,
		errorMessage:
			readyCount === orderedSlides.length
				? null
				: `${orderedSlides.length - readyCount} slide image(s) failed`,
	});

	await ctx.emit({
		type: "generation",
		generation: {
			id: presentationId,
			kind: "image-presentation",
			title: args.title,
			status: readyCount === orderedSlides.length ? "COMPLETED" : "FAILED",
			outputs,
		},
	});

	return {
		status: readyCount === orderedSlides.length ? "COMPLETED" : "PARTIAL",
		generationId: presentationId,
		title: args.title,
		slideCount: orderedSlides.length,
		readySlides: readyCount,
		message: `Image presentation with ${readyCount}/${orderedSlides.length} slides is ready in the panel.`,
	};
}

/** Mark orphan PROCESSING generations older than maxAgeMs as FAILED. */
export async function failStaleZeepoAiGenerations(
	sessionId: string,
	maxAgeMs = 120_000,
): Promise<number> {
	const rows = await db.query.zeepoAiGeneration.findMany({
		where: eq(zeepoAiGeneration.sessionId, sessionId),
		columns: { id: true, status: true, startedAt: true, createdAt: true },
	});
	const cutoff = Date.now() - maxAgeMs;
	let n = 0;
	for (const row of rows) {
		if (row.status !== "PROCESSING" && row.status !== "QUEUED") continue;
		const started = (row.startedAt ?? row.createdAt)?.getTime() ?? 0;
		if (started > cutoff) continue;
		await db
			.update(zeepoAiGeneration)
			.set({
				status: "FAILED",
				errorMessage: "Generation timed out. Please try again.",
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(zeepoAiGeneration.id, row.id));
		n += 1;
	}
	return n;
}
