/**
 * In-stream Gemini image generation for Zeepo AI tools.
 * Emits generation_start / generation_progress / generation SSE events.
 */
import { and, eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { zeepoAiAttachment, zeepoAiGeneration, zeepoAiImageEditHistory, zeepoAiUsageEvent, } from "@npanel/db/schema/zeepo-ai";
import { randomUUID } from "node:crypto";
import { createZeepoAiImage, fetchImageAsRef, mapWithConcurrency, persistZeepoAiImageBuffer, pickZeepoAiImageModel, ZEEPO_AI_IMAGE_PROVIDER, } from "../../lib/zeepo-ai-gemini-image";
import { providerMicrosToCustomerTokens, } from "../../lib/zeepo-ai-billing";
import { estimateZeepoAiGeminiImageCostUsdMicros, splitZeepoAiGeminiImageUsage, } from "../../lib/zeepo-ai-gemini-pricing";
import { debitZeepoAiTokens, logZeepoAiAgencyUsage, shouldBillZeepoAiTokens, } from "../../lib/zeepo-ai-tokens";
import { resolveGenerateImageSlotPrompts } from "./image-schemas";
const IMAGE_PARALLEL_THRESHOLD = 3;
const IMAGE_PARALLEL_CONCURRENCY = 3;
/** Reuse early-reserved IDs for the first `count` slots; return unused extras to drop. */
export function takeReservedGenerationIds(reserved, count) {
    const src = reserved ?? [];
    const ids = [];
    for (let i = 0; i < count; i++) {
        ids.push(src[i] ?? randomUUID());
    }
    const surplus = src.length > count ? src.slice(count) : [];
    return { ids, surplus };
}
async function emitSurplusDrops(emit, surplus) {
    if (surplus.length === 0)
        return;
    await emit({ type: "generation_drop", generationIds: surplus });
}
async function resolveReferenceImages(attachmentIds, sessionId) {
    if (!attachmentIds.length)
        return [];
    const rows = await db.query.zeepoAiAttachment.findMany({
        where: eq(zeepoAiAttachment.sessionId, sessionId),
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const refs = [];
    for (const id of attachmentIds) {
        const att = byId.get(id);
        if (!att || !att.mimeType.startsWith("image/"))
            continue;
        refs.push(await fetchImageAsRef(att.url));
    }
    return refs;
}
async function billImageGeneration(params) {
    const split = splitZeepoAiGeminiImageUsage({
        usage: params.usage,
        modelId: params.modelId,
        imageSize: params.imageSize,
    });
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
        inputTokens: split.inputTokens || null,
        outputTokens: split.outputTokensForDisplay || null,
        providerCostUsdMicros: params.micros,
        metadata: {
            providerRequestId: params.interactionId,
            thoughtTokens: split.thoughtTokens || undefined,
            imageOutputTokens: split.imageOutputTokens || undefined,
            imageSize: params.imageSize,
            totalTokens: params.usage?.totalTokens ?? undefined,
            pricingSource: "https://ai.google.dev/gemini-api/docs/pricing",
        },
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
    }
    else {
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
async function runOneImageSlot(params) {
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
        if (ctx.signal?.aborted)
            throw new Error("Cancelled");
        const result = await createZeepoAiImage({
            prompt: params.prompt,
            modelId,
            aspectRatio: params.aspectRatio,
            references: params.references,
            intent: params.intent,
            signal: ctx.signal,
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
        const micros = estimateZeepoAiGeminiImageCostUsdMicros({
            modelId: result.modelId,
            usage: result.usage,
            imageSize: result.imageSize,
        });
        await billImageGeneration({
            ctx,
            generationId: params.generationId,
            modelId: result.modelId,
            micros,
            interactionId: result.interactionId,
            usage: result.usage,
            imageSize: result.imageSize,
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
    }
    catch (err) {
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
export async function executeGenerateImagesTool(args, ctx) {
    const { count, prompts: slotPrompts, titles: slotTitles } = resolveGenerateImageSlotPrompts(args);
    const modelId = pickZeepoAiImageModel({
        intent: args.intent,
        count,
        hasReferences: (args.reference_attachment_ids?.length ?? 0) > 0,
    });
    const reserved = ctx.reservedGenerationIds;
    const { ids: slotIds, surplus } = takeReservedGenerationIds(reserved, count);
    const slots = Array.from({ length: count }, (_, i) => {
        return {
            id: slotIds[i],
            title: slotTitles[i] ?? `Image (${i + 1}/${count})`,
            prompt: slotPrompts[i] ?? slotPrompts[0] ?? "",
            index: i,
        };
    });
    const now = new Date();
    // Emit loaders FIRST  before any network (reference fetch) or DB work
    const emitPromise = Promise.all([
        emitSurplusDrops(ctx.emit, surplus),
        ...slots.flatMap((slot) => [
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
        ]),
    ]);
    const dbPromise = db.insert(zeepoAiGeneration).values(slots.map((slot) => ({
        id: slot.id,
        sessionId: ctx.sessionId,
        messageId: ctx.assistantMessageId,
        userId: ctx.userId,
        teamId: ctx.teamId,
        kind: "image",
        provider: ZEEPO_AI_IMAGE_PROVIDER,
        modelId,
        status: "PROCESSING",
        prompt: slot.prompt,
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
    })));
    // Kick off reference fetch in parallel with emit + DB  never block loaders on it
    const refsPromise = resolveReferenceImages(args.reference_attachment_ids ?? [], ctx.sessionId);
    await Promise.all([emitPromise, dbPromise]);
    const references = await refsPromise;
    const runSlot = (slot) => runOneImageSlot({
        ctx,
        generationId: slot.id,
        prompt: slot.prompt,
        title: slot.title,
        aspectRatio: args.aspect_ratio,
        intent: args.intent,
        references,
        slot: slot.index + 1,
        total: count,
    });
    const results = count <= IMAGE_PARALLEL_THRESHOLD
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
        message: failed.length === 0
            ? `${succeeded.length} image(s) ready in the panel.`
            : `${succeeded.length} succeeded, ${failed.length} failed. Tell the user plainly without technical details.`,
    };
}
export async function executeCreateImagePresentationTool(args, ctx) {
    const slidesNeedingGen = args.slides.filter((s) => !s.imageUrl);
    const imageResults = [];
    // Generate missing slide images first
    if (slidesNeedingGen.length > 0) {
        const { ids: slotIds, surplus } = takeReservedGenerationIds(ctx.reservedGenerationIds, slidesNeedingGen.length);
        const slots = slidesNeedingGen.map((slide, i) => ({
            slide,
            id: slotIds[i],
            index: i,
            title: `${args.title}  slide ${i + 1}`,
        }));
        const modelId = pickZeepoAiImageModel({ intent: "design", count: slots.length });
        const now = new Date();
        // Emit loaders FIRST for instant UI  don't block on DB writes
        const emitPromise = Promise.all([
            emitSurplusDrops(ctx.emit, surplus),
            ...slots.flatMap((slot) => [
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
            ]),
        ]);
        // Persist to DB in parallel with UI updates  instant loader appearance
        const dbPromise = db.insert(zeepoAiGeneration).values(slots.map((slot) => ({
            id: slot.id,
            sessionId: ctx.sessionId,
            messageId: ctx.assistantMessageId,
            userId: ctx.userId,
            teamId: ctx.teamId,
            kind: "image",
            provider: ZEEPO_AI_IMAGE_PROVIDER,
            modelId,
            status: "PROCESSING",
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
        })));
        // Wait for both to complete before starting actual generation
        await Promise.all([emitPromise, dbPromise]);
        const runSlot = (slot) => runOneImageSlot({
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
        const results = slots.length <= IMAGE_PARALLEL_THRESHOLD
            ? await (async () => {
                const out = [];
                for (const slot of slots)
                    out.push(await runSlot(slot));
                return out;
            })()
            : await mapWithConcurrency(slots, IMAGE_PARALLEL_CONCURRENCY, (slot) => runSlot(slot));
        for (let i = 0; i < slots.length; i++) {
            imageResults.push({
                prompt: slots[i].slide.prompt,
                imageUrl: results[i]?.imageUrl ?? null,
                caption: slots[i].slide.caption,
                notes: slots[i].slide.notes,
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
    const finalStatus = readyCount === orderedSlides.length ? "COMPLETED" : "FAILED";
    // Emit to UI instantly  don't block on DB
    const emitPromise = ctx.emit({
        type: "generation",
        generation: {
            id: presentationId,
            kind: "image-presentation",
            title: args.title,
            status: finalStatus,
            outputs,
        },
    });
    const dbPromise = db.insert(zeepoAiGeneration).values({
        id: presentationId,
        sessionId: ctx.sessionId,
        messageId: ctx.assistantMessageId,
        userId: ctx.userId,
        teamId: ctx.teamId,
        kind: "image-presentation",
        provider: ZEEPO_AI_IMAGE_PROVIDER,
        modelId: pickZeepoAiImageModel({ intent: "design" }),
        status: finalStatus,
        prompt: args.title,
        inputs: { aspect_ratio: args.aspect_ratio, slideCount: orderedSlides.length },
        outputs,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        errorMessage: readyCount === orderedSlides.length
            ? null
            : `${orderedSlides.length - readyCount} slide image(s) failed`,
    });
    await Promise.all([emitPromise, dbPromise]);
    return {
        status: readyCount === orderedSlides.length ? "COMPLETED" : "PARTIAL",
        generationId: presentationId,
        title: args.title,
        slideCount: orderedSlides.length,
        readySlides: readyCount,
        message: `Image presentation with ${readyCount}/${orderedSlides.length} slides is ready in the panel.`,
    };
}
/** Mark orphan PROCESSING/QUEUED generations older than maxAgeMs as FAILED. */
export async function failStaleZeepoAiGenerations(sessionId, 
/** Align with ~30m SSE proxy budget (+ buffer). */
maxAgeMs = 35 * 60 * 1000) {
    const rows = await db.query.zeepoAiGeneration.findMany({
        where: and(eq(zeepoAiGeneration.sessionId, sessionId), inArray(zeepoAiGeneration.status, ["PROCESSING", "QUEUED"])),
        columns: { id: true, status: true, startedAt: true, createdAt: true },
    });
    const cutoff = Date.now() - maxAgeMs;
    let n = 0;
    for (const row of rows) {
        const started = (row.startedAt ?? row.createdAt)?.getTime() ?? 0;
        if (started > cutoff)
            continue;
        // Conditional update  never overwrite COMPLETED/FAILED if status raced.
        await db
            .update(zeepoAiGeneration)
            .set({
            status: "FAILED",
            errorMessage: "Generation timed out. Please try again.",
            completedAt: new Date(),
            updatedAt: new Date(),
        })
            .where(and(eq(zeepoAiGeneration.id, row.id), inArray(zeepoAiGeneration.status, ["PROCESSING", "QUEUED"])));
        n += 1;
    }
    return n;
}
