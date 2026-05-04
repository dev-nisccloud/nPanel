import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { emailBuilderDesign } from "@npanel/db/schema";
import Replicate from "replicate";
import { env } from "@npanel/env/server";
import {
    AiEmailOutput,
    IMAGE_MODEL,
    normalizeAiEmailDocument,
    validateEmailDocument,
    FALLBACK_IMAGE_URL,
    ImageRequest,
} from "../ai/email-builder-logic";

export async function handleEmailBuilderAiWebhook(c: Context) {
    try {
        const designId = c.req.query("designId");
        const phase = c.req.query("phase"); // 'layout' or 'image'
        const blockId = c.req.query("blockId"); // only for phase='image'

        if (!designId || !phase) {
            return c.json({ error: "Missing designId or phase" }, 400);
        }

        const body = await c.req.json();
        const status = body.status;

        // If not successful, handle failures
        if (status !== "succeeded") {
            if (status === "failed" || status === "canceled") {
                console.error(`[EmailBuilderAI][Webhook] Prediction ${status} for ${designId} (Phase: ${phase})`);
                
                // If an image failed, we still want to try the rest or finish
                if (phase === "image") {
                    await handleImageFailure(designId, blockId);
                } else {
                    await db.update(emailBuilderDesign)
                        .set({ aiStatus: "FAILED", updatedAt: new Date() })
                        .where(eq(emailBuilderDesign.id, designId));
                }
            }
            return c.json({ success: true });
        }

        const design = await db.query.emailBuilderDesign.findFirst({
            where: eq(emailBuilderDesign.id, designId),
        });

        if (!design) return c.json({ error: "Design not found" }, 404);

        const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
        const webhookUrl = env.REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL;

        if (phase === "layout") {
            // --- Phase 1: Layout Processing ---
            const rawOutput = Array.isArray(body.output) ? body.output.join("") : String(body.output);
            
            // Robust JSON extraction: look for the first '{' and the last '}'
            const startIdx = rawOutput.indexOf('{');
            const endIdx = rawOutput.lastIndexOf('}');
            
            if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
                console.error("[EmailBuilderAI][Layout] Could not find JSON bounds in output:", rawOutput);
                throw new Error("Could not extract JSON from AI output (missing braces)");
            }

            const jsonStr = rawOutput.substring(startIdx, endIdx + 1);
            let aiOutput: AiEmailOutput;
            
            try {
                aiOutput = JSON.parse(jsonStr) as AiEmailOutput;
            } catch (e) {
                console.error("[EmailBuilderAI][Layout] JSON parse failed. Raw string:", jsonStr);
                throw new Error("Invalid JSON format from AI output");
            }
            
            // Normalize to exact native waypoint schema
            const normalizedDoc = normalizeAiEmailDocument(aiOutput.emailDocument);
            validateEmailDocument(normalizedDoc);

            const pendingImages = aiOutput.imageRequests || [];
            const hasImages = pendingImages.length > 0;

            // Save initial document and start the hydration process
            await db.update(emailBuilderDesign)
                .set({
                    json: JSON.stringify(normalizedDoc),
                    aiContext: { 
                        ...(design.aiContext as any || {}), 
                        pendingImages: pendingImages.slice(1) // Queue the rest
                    },
                    aiStatus: hasImages ? "HYDRATING" : "COMPLETED",
                    isAiGenerated: !hasImages,
                    updatedAt: new Date() 
                })
                .where(eq(emailBuilderDesign.id, designId));

            if (hasImages) {
                // Trigger ONLY the first image
                const firstReq = pendingImages[0];
                await triggerImageGeneration(replicate, webhookUrl!, designId, firstReq);
            }
        } else if (phase === "image") {
            // --- Phase 2: Image Processing (Sequential) ---
            if (!blockId) throw new Error("Missing blockId for image phase");

            const imageUrl = Array.isArray(body.output) ? body.output[0] : body.output;
            const currentJson = JSON.parse(design.json);

            // Patch the image URL into the document
            if (currentJson[blockId]) {
                const block = currentJson[blockId];
                if (!block.data) block.data = {};
                if (!block.data.props) block.data.props = {};
                block.data.props.url = imageUrl || FALLBACK_IMAGE_URL;
            }

            const context = design.aiContext as any;
            const pendingImages = (context?.pendingImages || []) as ImageRequest[];
            const hasMore = pendingImages.length > 0;

            if (hasMore) {
                // Trigger the NEXT image in the queue
                const nextReq = pendingImages[0];
                await triggerImageGeneration(replicate, webhookUrl!, designId, nextReq);

                // Update DB: Save progress and pop the queue
                await db.update(emailBuilderDesign)
                    .set({ 
                        json: JSON.stringify(currentJson),
                        aiContext: { ...context, pendingImages: pendingImages.slice(1) },
                        aiStatus: "HYDRATING",
                        updatedAt: new Date() 
                    })
                    .where(eq(emailBuilderDesign.id, designId));
            } else {
                // Final image finished!
                await db.update(emailBuilderDesign)
                    .set({ 
                        json: JSON.stringify(currentJson),
                        aiContext: { ...context, pendingImages: [] },
                        aiStatus: "COMPLETED",
                        isAiGenerated: true,
                        updatedAt: new Date() 
                    })
                    .where(eq(emailBuilderDesign.id, designId));
            }
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("[EmailBuilderAI][Webhook] Error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
}

/**
 * Helper to trigger a single image generation via Replicate with a completion webhook.
 * Includes a delay to stay within rate limits.
 */
async function triggerImageGeneration(replicate: Replicate, webhookUrl: string, designId: string, req: ImageRequest) {
    // Replicate's burst limit is tight (1 request). Wait a bit before triggering to be safe.
    console.log(`[EmailBuilderAI][Image] Waiting 2.5s before triggering block ${req.blockId}...`);
    await new Promise(resolve => setTimeout(resolve, 2500));

    const enrichedPrompt = [
        req.prompt,
        "professional photography",
        "ultra high quality",
        "clean background, no text",
        req.darkStyle ? "dark moody atmospheric lighting" : "bright clean modern lighting",
    ].join(", ");

    console.log(`[EmailBuilderAI][Image] Triggering for block ${req.blockId} in design ${designId}`);

    // If blockId is missing (AI mistake), try to find the first Image block that needs hydration
    let targetBlockId = req.blockId;
    if (!targetBlockId || targetBlockId === "undefined") {
        console.warn(`[EmailBuilderAI][Image] blockId was undefined in request. Attempting fallback...`);
        const design = await db.query.emailBuilderDesign.findFirst({
            where: eq(emailBuilderDesign.id, designId),
        });
        if (design) {
            const doc = JSON.parse(design.json);
            const firstImageBlock = Object.entries(doc).find(([_, b]: any) => 
                b.type === "Image" && (b.data?.props?.url === "__IMAGE_PLACEHOLDER__" || !b.data?.props?.url)
            );
            if (firstImageBlock) {
                targetBlockId = firstImageBlock[0];
                console.log(`[EmailBuilderAI][Image] Fallback found target blockId: ${targetBlockId}`);
            }
        }
    }

    if (!targetBlockId || targetBlockId === "undefined") {
        console.error(`[EmailBuilderAI][Image] Could not determine target blockId for prompt: "${req.prompt}". Skipping.`);
        return;
    }

    await replicate.predictions.create({
        model: IMAGE_MODEL,
        input: {
            prompt: enrichedPrompt,
            aspect_ratio: req.aspectRatio || "3:2",
            output_format: "png",
        },
        webhook: `${webhookUrl}?designId=${designId}&phase=image&blockId=${targetBlockId}`,
        webhook_events_filter: ["completed"],
    });
}

/**
 * Helper to handle image failure by falling back and moving to the next image.
 */
async function handleImageFailure(designId: string, blockId: string | undefined) {
    const design = await db.query.emailBuilderDesign.findFirst({
        where: eq(emailBuilderDesign.id, designId),
    });
    if (!design) return;

    const currentJson = JSON.parse(design.json);
    if (blockId && currentJson[blockId]) {
        if (!currentJson[blockId].data) currentJson[blockId].data = {};
        if (!currentJson[blockId].data.props) currentJson[blockId].data.props = {};
        currentJson[blockId].data.props.url = FALLBACK_IMAGE_URL;
    }

    const context = design.aiContext as any;
    const pendingImages = (context?.pendingImages || []) as ImageRequest[];
    const hasMore = pendingImages.length > 0;

    if (hasMore) {
        const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
        const webhookUrl = env.REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL;
        const nextReq = pendingImages[0];
        
        // Update DB first to pop the queue, then trigger
        await db.update(emailBuilderDesign)
            .set({ 
                json: JSON.stringify(currentJson),
                aiContext: { ...context, pendingImages: pendingImages.slice(1) },
                updatedAt: new Date() 
            })
            .where(eq(emailBuilderDesign.id, designId));

        await triggerImageGeneration(replicate, webhookUrl!, designId, nextReq);
    } else {
        await db.update(emailBuilderDesign)
            .set({ 
                json: JSON.stringify(currentJson),
                aiContext: { ...context, pendingImages: [] },
                aiStatus: "COMPLETED",
                isAiGenerated: true,
                updatedAt: new Date() 
            })
            .where(eq(emailBuilderDesign.id, designId));
    }
}
