import { randomUUID } from "node:crypto";
import { db, eq, desc } from "@npanel/db";
import { nebAsset, nebDesign, nebDesignVersion, nebGenerationJob, nebMessage, nebSession, } from "@npanel/db/schema/nisc-email-builder";
import Replicate from "replicate";
import { env } from "@npanel/env/server";
import { NEB_DIRECT_HTML_MODEL, NEB_HTML_MODEL, NEB_REVISION_MODEL } from "./constants";
import { generateCreativeDesignSpec } from "./creative-spec";
import { generateImagen4Ultra } from "./imagen";
import { generateNanoBananaPro } from "./nano-banana";
import { parseDirectBuildResponse, parseHtmlAgentResponse } from "./parse-responses";
import { patchImagePlaceholders, processEmailHtml } from "./pipeline";
import { buildBrandContext, buildHtmlArchitectSystemPrompt, buildRevisionSystemPrompt, buildRevisionUserPrompt } from "./prompts";
import { buildDirectHtmlContinuationPrompt, buildDirectHtmlSystemPrompt, buildDirectHtmlUserPrompt, buildHtmlContinuationPrompt, buildHtmlFromSpecPrompt, } from "./prompts-build";
import { mirrorNebBriefLogoIfNeeded } from "./logo";
import { saveToNebMediaLibrary } from "./media-library-persist";
import { buildIconImagePrompt } from "./icon-image-prompt";
import { runAnthropicOnReplicate } from "./replicate-llm";
import { pickTemplates, loadTemplateHtml } from "./template-picker";
import { clearRevisionRedoStack, pushRevisionUndoSnapshot, } from "./revision-cache";
import { htmlArchitectOutputSchema, revisionOutputSchema } from "./types";
async function nextVersionNumber(designId) {
    const latest = await db.query.nebDesignVersion.findFirst({
        where: eq(nebDesignVersion.designId, designId),
        orderBy: [desc(nebDesignVersion.versionNumber)],
    });
    return (latest?.versionNumber ?? 0) + 1;
}
async function saveVersion(params) {
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
function isIconSlot(slot) {
    return slot.kind === "icon" || slot.key.startsWith("icon_");
}
/** Returns a placehold.co URL sized to match the slot's aspect ratio and kind. */
function getPlaceholderUrl(slot) {
    if (isIconSlot(slot)) {
        return "https://placehold.co/56x56/e2e8f0/94a3b8?text=icon";
    }
    const ratioMap = {
        "16:9": "600x338",
        "3:2": "600x400",
        "4:3": "600x450",
        "1:1": "600x600",
        "3:4": "600x800",
        "4:5": "600x750",
        "9:16": "600x1067",
        "2:3": "600x900",
    };
    const dims = ratioMap[slot.aspectRatio ?? "16:9"] ?? "600x400";
    return `https://placehold.co/${dims}/e2e8f0/94a3b8?text=image`;
}
async function hydrateImages(params) {
    const slots = params.slots ?? [];
    if (!slots.length)
        return params.html;
    await db
        .update(nebDesign)
        .set({ aiStatus: "HYDRATING_IMAGES", updatedAt: new Date() })
        .where(eq(nebDesign.id, params.designId));
    const replacements = {};
    const compRef = params.creativeDesignUrl?.trim();
    for (const slot of slots) {
        const isIcon = isIconSlot(slot);
        const aspect = (isIcon ? "1:1" : (slot.aspectRatio ?? "16:9"));
        const compRefLine = compRef
            ? `\nReference image_input[0] is the approved email comp. Recreate the "${slot.key}" element exactly as shown.`
            : "";
        const slotPrompt = isIcon
            ? buildIconImagePrompt({
                prompt: slot.prompt,
                backgroundColorHex: slot.backgroundColor,
                compRefLine: compRefLine || undefined,
            })
            : `${slot.prompt}${compRefLine}`;
        let fileUrl;
        let storageKey;
        try {
            let result;
            if (isIcon) {
                // Icons use Imagen 4 Ultra for sharper, cleaner icon rendering
                result = await generateImagen4Ultra(params.replicate, {
                    prompt: slotPrompt,
                    imageSize: slot.imageSize ?? "1K",
                    aspectRatio: "1:1",
                    outputFormat: "png",
                });
            }
            else {
                // Photos and hero images use Nano Banana Pro
                result = await generateNanoBananaPro(params.replicate, {
                    prompt: slotPrompt,
                    resolution: slot.imageSize === "1K" ? "1K" : "2K",
                    aspectRatio: aspect,
                    outputFormat: "jpg",
                    imageInput: compRef ? [compRef] : undefined,
                });
            }
            fileUrl = result.fileUrl;
            storageKey = result.storageKey;
        }
        catch (imgErr) {
            // A single slot failure must not crash the entire build - use a sized placeholder instead.
            console.warn(`[hydrateImages] Slot "${slot.key}" failed, using placeholder: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`);
            fileUrl = getPlaceholderUrl(slot);
            storageKey = undefined;
        }
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
        const mimeType = isIcon ? "image/png" : "image/jpeg";
        const ext = isIcon ? "png" : "jpg";
        await saveToNebMediaLibrary({
            userId: params.userId,
            teamId: params.teamId,
            fileName: `email-${slot.key}.${ext}`,
            fileSize: 0,
            mimeType,
            fileUrl,
            storageKey,
            description: slot.alt ?? null,
            metadata: {
                source: "neb-image-hydration",
                designId: params.designId,
                slotKey: slot.key,
                kind: isIcon ? "icon" : slot.key === "hero" ? "hero" : "inline",
            },
        });
    }
    return patchImagePlaceholders(params.html, replacements);
}
const MAX_HTML_CONTINUATIONS = 2;
async function buildHtmlFromSpec(params) {
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
    let built = parseHtmlAgentResponse(htmlRaw, htmlArchitectOutputSchema, "HTML architect");
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
        const cont = parseHtmlAgentResponse(contRaw, htmlArchitectOutputSchema, "HTML architect (continuation)");
        built = {
            ...cont,
            html: built.html + cont.html,
            change_summary: cont.change_summary || built.change_summary,
            assistant_text: cont.assistant_text || built.assistant_text,
        };
    }
    return built;
}
export async function runNebBuildEmail(params) {
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
    const buildTrigger = params.buildTrigger ?? "INITIAL";
    const { brief: briefWithLogo } = await mirrorNebBriefLogoIfNeeded(params.brief, params.brandKit);
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
        // Step 1: Single vision call - exhaustive design specification (+ continuation if truncated)
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
        // Step 2: HTML from specification only (no vision - spec is the source of truth)
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
    }
    catch (e) {
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
/**
 * Directly build an HTML email from the user's brief using template references
 * as the design quality benchmark. Skips creative mockup generation entirely.
 *
 * Flow:
 *   1. Pick 1-2 reference templates via Haiku (fast, cheap)
 *   2. Build HTML from brief + templates in a single Sonnet call
 *   3. Hydrate image slots with Nano Banana
 *   4. Save version and set READY
 */
export async function runNebDirectBuild(params) {
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
    const { brief: briefWithLogo } = await mirrorNebBriefLogoIfNeeded(params.brief, params.brandKit);
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
        // Step 1: Pick best-matching reference templates (Haiku - fast & cheap)
        const selectedTemplateInfos = await pickTemplates(params.brief, replicate);
        const templateRefs = loadTemplateHtml(selectedTemplateInfos);
        const selectedTemplates = selectedTemplateInfos.map((t) => t.filename);
        console.log(`[DirectBuild] Using templates: ${selectedTemplates.join(", ")} for designId=${params.designId}`);
        // Step 2: Generate HTML directly using template references
        const userPrompt = buildDirectHtmlUserPrompt({
            brief: params.brief,
            brandBlock,
            webContext: params.webContext,
            templateRefs,
        });
        const htmlRaw = await runAnthropicOnReplicate({
            replicate,
            model: NEB_DIRECT_HTML_MODEL,
            systemPrompt: buildDirectHtmlSystemPrompt(),
            userPrompt,
            maxTokens: 24000,
        });
        let built = parseDirectBuildResponse(htmlRaw);
        // Continuation passes if HTML was truncated
        const briefSummary = [
            params.brief.companyName && `Company: ${params.brief.companyName}`,
            params.brief.goal && `Goal: ${params.brief.goal}`,
        ]
            .filter(Boolean)
            .join(", ");
        for (let i = 0; i < MAX_HTML_CONTINUATIONS && !built.html.includes("</html>"); i++) {
            const contRaw = await runAnthropicOnReplicate({
                replicate,
                model: NEB_DIRECT_HTML_MODEL,
                systemPrompt: buildDirectHtmlSystemPrompt(),
                userPrompt: buildDirectHtmlContinuationPrompt({
                    briefSummary,
                    brandBlock,
                    partialHtml: built.html,
                }),
                maxTokens: 24000,
            });
            const cont = parseDirectBuildResponse(contRaw);
            built = {
                ...cont,
                html: built.html + cont.html,
                change_summary: cont.change_summary || built.change_summary,
                assistant_text: cont.assistant_text || built.assistant_text,
                // Keep subject/preheader/slots from the initial parse if continuation omits them
                subject: built.subject ?? cont.subject,
                preheader: built.preheader ?? cont.preheader,
                image_slots: (built.image_slots?.length ? built.image_slots : null) ?? cont.image_slots ?? [],
            };
        }
        const processed = processEmailHtml(built.html);
        if (!processed.validation.ok) {
            throw new Error(processed.validation.errors.join("; "));
        }
        let html = processed.html;
        // Step 3: Hydrate image slots
        const imageSlots = built.image_slots ?? [];
        if (imageSlots.length > 0) {
            html = await hydrateImages({
                designId: params.designId,
                userId: params.userId,
                teamId: params.teamId,
                html,
                slots: imageSlots,
                replicate,
            });
        }
        const finalProcessed = processEmailHtml(html);
        const subject = built.subject?.trim() || `${params.brief.companyName ?? "Email"} Campaign`;
        const preheader = built.preheader?.trim() ?? "";
        await db
            .update(nebDesign)
            .set({
            designPlan: {
                subject,
                preheader,
                image_slots: imageSlots,
                selectedTemplates,
            },
            subject,
            preheader,
            updatedAt: new Date(),
        })
            .where(eq(nebDesign.id, params.designId));
        const job = await db.query.nebGenerationJob.findFirst({
            where: eq(nebGenerationJob.id, params.jobId),
        });
        await saveVersion({
            designId: params.designId,
            html: finalProcessed.html,
            text: finalProcessed.text,
            trigger: "DIRECT_BUILD",
            changeSummary: built.change_summary,
            messageId: job?.messageId ?? undefined,
            validationReport: finalProcessed.validation,
        });
        await db
            .update(nebDesign)
            .set({
            subject,
            preheader,
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
            output: { subject, changeSummary: built.change_summary, selectedTemplates },
            completedAt: new Date(),
        })
            .where(eq(nebGenerationJob.id, params.jobId));
        return {
            assistantText: built.assistant_text,
            subject,
            preheader,
            selectedTemplates,
        };
    }
    catch (e) {
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
/** Full rebuild from brief + user revamp instructions; replaces current HTML. */
export async function runNebChatFullRevamp(params) {
    if (params.previousHtml.trim()) {
        await pushRevisionUndoSnapshot(params.designId, params.previousHtml);
        await clearRevisionRedoStack(params.designId);
    }
    const mergedBrief = {
        ...params.brief,
        instructions: [
            params.brief.instructions,
            `The user requested a complete email revamp (not a small edit). Rebuild the email accordingly:\n${params.userMessage}`,
        ]
            .filter(Boolean)
            .join("\n\n"),
    };
    return runNebDirectBuild({ ...params, brief: mergedBrief });
}
export async function runNebRevision(params) {
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
    const brandBlock = buildBrandContext(params.brief, params.brandKit);
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
                sessionHistory: params.sessionHistory,
                intent: params.intent,
            }),
            maxTokens: 12000,
        });
        const revised = parseHtmlAgentResponse(raw, revisionOutputSchema, "Revision");
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
        if (params.currentHtml.trim()) {
            await pushRevisionUndoSnapshot(params.designId, params.currentHtml);
            await clearRevisionRedoStack(params.designId);
        }
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
    }
    catch (e) {
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
