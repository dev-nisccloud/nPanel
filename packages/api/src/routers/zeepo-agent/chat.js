// @ts-nocheck
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import Replicate from "replicate";
import { db } from "@npanel/db";
import { zeepoAgentActivityLog, zeepoAgentGeneration, zeepoAgentMessage, zeepoAgentSession, } from "@npanel/db/schema/zeepo-agent";
import { user as userTable } from "@npanel/db/schema/auth";
import { userProfile as userProfileTable } from "@npanel/db/schema/auth-extras";
import { team as teamTable } from "@npanel/db/schema/teams";
import { env } from "@npanel/env/server";
import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import { formatZeepoAgentToolError, resolveZeepoAgentOrchestrationClientMessage, resolveZeepoAgentPublicMessage, } from "../../lib/zeepo-agent-errors";
import { generateSessionTitleSchema, imageEditSchema, sendMessageSchema } from "./schemas";
import { zeepoAgentImageEditHistory } from "@npanel/db/schema/zeepo-agent";
import { persistRemoteUrlToObjectStorage } from "../../lib/object-storage/persist";
import { insertAndEnqueueAgentGeneration } from "./generate";
import { getZeepoAgentOrchestrationModel, listModelsForTool, pickModelForGeneration, } from "./model-helpers";
import { getZeepoAgentSkillById } from "./skills-catalog";
import { checkDomainAvailabilityArgsSchema, createDocumentArgsSchema, createImagePresentationArgsSchema, createPresentationArgsSchema, getDomainsPortfolioArgsSchema, getDomainDetailArgsSchema, getHostingResourcesArgsSchema, getHostingDetailArgsSchema, getSessionInfoArgsSchema, getWebHostingPlansArgsSchema, getEmailHostingPlansArgsSchema, listModelsArgsSchema, runMediaGenerationArgsSchema, webSearchArgsSchema, } from "./agent-tools";
import { agentCheckDomainAvailability, agentGetDomainsPortfolio, agentGetDomainDetail, agentGetHostingResources, agentGetHostingDetail, agentGetWebHostingPlans, agentGetEmailHostingPlans, DEFAULT_DOMAIN_EXTENSIONS, DEFAULT_DISPLAY_CURRENCY, } from "../../lib/agent-internal-tools";
import { callBraveLlmContext } from "../../lib/brave-search";
import { buildAgentIdentityPrompt, buildRecentGenerationsBlock, buildSessionAssetsBlock, buildSessionContextBlock, buildSkillSystemBlock, } from "./prompts";
import { collectTextOutput, runOrchestrationTurnWithRepair, toolCallSignature, } from "./replicate-agent-orchestration";
import { isReplicateHostedMediaUrl } from "../../lib/replicate-hosted-url";
import { billZeepoAgentPrediction } from "../../lib/zeepo-agent-bill-prediction";
import { assertZeepoAgentCanStartTurn, zeepoAgentHasTokensRemaining, } from "../../lib/zeepo-agent-tokens";
import { runReplicateTextPrediction, runReplicatePrediction } from "../../lib/zeepo-agent-replicate";
/**
 * When the orchestration JSON is truncated or malformed, try to salvage just
 * the assistant_text value via regex so we never display raw JSON to users.
 * Falls back to a safe placeholder the user can act on.
 */
function tryExtractAssistantTextFromRaw(raw) {
    // Match the assistant_text string value, handling escaped characters.
    const match = raw.match(/"assistant_text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    if (match?.[1]) {
        return match[1]
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .trim();
    }
    // Nothing salvageable - return a safe fallback the user can act on.
    return "I ran into an issue generating a response. Please try again.";
}
function mapRowToAgentMessage(m) {
    let content = m.content ?? "";
    // Append attachment context so the orchestration model can reference uploaded images.
    const meta = m.metadata;
    const attachments = meta?.attachments;
    if (attachments?.length && m.role === "user") {
        const attachLines = attachments
            .map((a, i) => `[ATTACHED_FILE_${i + 1}: "${a.name}" | type: ${a.mimeType} | url: ${a.url} - use this URL as reference_image_url when creating or referencing this asset]`)
            .join("\n");
        content = `${content}\n\n${attachLines}`;
    }
    return {
        role: m.role,
        content,
        ...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
        ...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
        // Surface first image URL for models that support a dedicated image vision input.
        ...(attachments?.find((a) => a.mimeType.startsWith("image/"))
            ? { imageUrl: attachments.find((a) => a.mimeType.startsWith("image/")).url }
            : {}),
    };
}
/** First public HTTP URL that is not a Replicate ephemeral delivery URL. */
function firstHttpUrl(value) {
    if (typeof value === "string" && value.startsWith("http")) {
        return isReplicateHostedMediaUrl(value) ? null : value;
    }
    if (Array.isArray(value)) {
        for (const v of value) {
            const found = firstHttpUrl(v);
            if (found)
                return found;
        }
    }
    if (value && typeof value === "object") {
        for (const v of Object.values(value)) {
            const found = firstHttpUrl(v);
            if (found)
                return found;
        }
    }
    return null;
}
async function fetchRecentGenerationSummaries(sessionId) {
    const rows = await db.query.zeepoAgentGeneration.findMany({
        where: eq(zeepoAgentGeneration.sessionId, sessionId),
        orderBy: [desc(zeepoAgentGeneration.createdAt)],
        limit: 8,
    });
    return rows.map((g) => ({
        id: g.id,
        status: g.status,
        modelCategory: g.modelCategory,
        modelId: g.modelId,
        prompt: g.prompt,
        previewUrl: firstHttpUrl(g.outputs),
        errorMessage: g.errorMessage
            ? resolveZeepoAgentPublicMessage(g.errorMessage)
            : null,
        createdAtIso: (g.createdAt instanceof Date
            ? g.createdAt
            : new Date(g.createdAt)).toISOString(),
    }));
}
async function fetchSessionContext(params) {
    const u = await db.query.user.findFirst({
        where: eq(userTable.id, params.userId),
        columns: { name: true, email: true },
    });
    let teamInfo = {
        id: params.teamId,
        name: null,
        slug: null,
        baseCurrency: null,
    };
    if (params.teamId) {
        const t = await db.query.team.findFirst({
            where: eq(teamTable.id, params.teamId),
            columns: { id: true, name: true, slug: true, baseCurrency: true },
        });
        if (t) {
            teamInfo = {
                id: t.id,
                name: t.name,
                slug: t.slug,
                baseCurrency: t.baseCurrency ?? null,
            };
        }
    }
    return {
        nowIso: new Date().toISOString(),
        user: { name: u?.name ?? null, email: u?.email ?? null },
        team: teamInfo,
        sessionTitle: params.sessionTitle,
        sessionCreatedAtIso: params.sessionCreatedAt.toISOString(),
        turnCount: params.turnCount,
    };
}
/** Keep in sync with ZeepoCapabilityKey in model-helpers.ts */
const KNOWN_CAPABILITY_KEYS = [
    "images",
    "audio",
    "video",
    "thinking",
    "audio_generation",
    "design",
];
function safeCapsArray(input) {
    if (!Array.isArray(input))
        return undefined;
    const out = [];
    for (const v of input) {
        if (typeof v === "string" && KNOWN_CAPABILITY_KEYS.includes(v)) {
            out.push(v);
        }
    }
    return out.length ? out : undefined;
}
export const zeepoAgentChatRouter = router({
    sendMessage: zeepoAgentProcedure
        .input(sendMessageSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        if (!env.REPLICATE_API_TOKEN) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: resolveZeepoAgentPublicMessage("REPLICATE_API_TOKEN is not configured"),
            });
        }
        const session = await db.query.zeepoAgentSession.findFirst({
            where: eq(zeepoAgentSession.id, input.sessionId),
        });
        if (!session || session.userId !== userId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        const billingCtx = {
            teamId: session.teamId ?? null,
            userId,
            userRole: ctx.session?.user?.role,
            sessionId: input.sessionId,
        };
        await assertZeepoAgentCanStartTurn(billingCtx);
        const onOrchestrationPrediction = async (prediction, modelId) => {
            await billZeepoAgentPrediction({
                billing: billingCtx,
                prediction,
                modelId,
                operationType: "orchestration",
                description: "Agent orchestration turn",
            });
        };
        let skillForTurn = undefined;
        if (input.skillId) {
            skillForTurn = getZeepoAgentSkillById(input.skillId);
            if (!skillForTurn) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Unknown skill",
                });
            }
        }
        const now = new Date();
        await db.insert(zeepoAgentMessage).values({
            id: randomUUID(),
            sessionId: input.sessionId,
            role: "user",
            content: input.content,
            metadata: {
                ...(skillForTurn ? { skillId: skillForTurn.id } : {}),
                ...(input.attachments?.length ? { attachments: input.attachments } : {}),
            } || null,
            createdAt: now,
        });
        await db.insert(zeepoAgentActivityLog).values({
            id: randomUUID(),
            sessionId: input.sessionId,
            userId,
            action: "SEND_MESSAGE",
            description: "User message",
            metadata: {
                length: input.content.length,
                ...(skillForTurn ? { skillId: skillForTurn.id } : {}),
            },
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        // Include metadata so mapRowToAgentMessage can embed attachment context for the model.
        const rows = await db.query.zeepoAgentMessage.findMany({
            where: eq(zeepoAgentMessage.sessionId, input.sessionId),
            orderBy: [asc(zeepoAgentMessage.createdAt)],
            columns: {
                id: true,
                role: true,
                content: true,
                toolCalls: true,
                toolCallId: true,
                metadata: true,
            },
        });
        const sessionCtx = await fetchSessionContext({
            sessionId: input.sessionId,
            sessionTitle: session.title ?? null,
            sessionCreatedAt: session.createdAt instanceof Date
                ? session.createdAt
                : new Date(session.createdAt),
            turnCount: rows.length,
            userId,
            teamId: session.teamId ?? null,
        });
        const recentGens = await fetchRecentGenerationSummaries(input.sessionId);
        const recentBlock = buildRecentGenerationsBlock(recentGens);
        // Collect every uploaded attachment across all messages so the model always has a
        // full asset index regardless of how many turns have passed since the upload.
        const sessionUploads = [];
        for (const row of rows) {
            const meta = row.metadata;
            const atts = meta?.attachments;
            if (atts?.length) {
                atts.forEach((a) => sessionUploads.push(a));
            }
        }
        const assetsBlock = buildSessionAssetsBlock(sessionUploads, recentGens);
        const systemMessages = [
            { role: "system", content: buildAgentIdentityPrompt() },
            { role: "system", content: buildSessionContextBlock(sessionCtx) },
            ...(recentBlock ? [{ role: "system", content: recentBlock }] : []),
            ...(assetsBlock ? [{ role: "system", content: assetsBlock }] : []),
            ...(skillForTurn
                ? [
                    {
                        role: "system",
                        content: buildSkillSystemBlock({
                            id: skillForTurn.id,
                            title: skillForTurn.title,
                            directives: skillForTurn.agentDirectives,
                        }),
                    },
                ]
                : []),
        ];
        const agentMessages = [
            ...systemMessages,
            ...rows.map(mapRowToAgentMessage),
        ];
        const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
        const orchModel = getZeepoAgentOrchestrationModel();
        let iteration = 0;
        const maxIterations = 6;
        let lastContent = "";
        const recentToolSignatures = [];
        while (iteration < maxIterations) {
            iteration++;
            if (billingCtx.teamId &&
                !(await zeepoAgentHasTokensRemaining(billingCtx.teamId))) {
                lastContent =
                    "You've run out of tokens. Purchase more to continue using Zeepo AI Agent.";
                break;
            }
            // Large budget - create_document and web_search grounding can easily push past
            // 10 000 tokens in JSON form. Keeping it high avoids truncated JSON that
            // falls back to displaying the raw orchestration response in the UI.
            const maxTokens = iteration === 1 ? 16000 : iteration <= 3 ? 12000 : 6000;
            let parseResult;
            let rawAttempts = [];
            let repairUsed = false;
            try {
                const r = await runOrchestrationTurnWithRepair({
                    replicate,
                    model: orchModel,
                    messages: agentMessages,
                    maxMs: 180_000,
                    maxTokens,
                    onPrediction: onOrchestrationPrediction,
                });
                parseResult = r.parsed;
                rawAttempts = r.rawAttempts;
                repairUsed = r.repairUsed;
            }
            catch (e) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: resolveZeepoAgentOrchestrationClientMessage(e),
                });
            }
            const assistantText = parseResult.ok
                ? parseResult.assistant_text
                : tryExtractAssistantTextFromRaw(parseResult.raw);
            const toolCalls = parseResult.ok ? parseResult.tool_calls : [];
            const clarifyingQuestions = parseResult.ok && parseResult.clarifying_questions?.length
                ? parseResult.clarifying_questions
                : undefined;
            const syntheticToolCalls = toolCalls.length > 0
                ? toolCalls.map((tc) => ({
                    id: `call_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments ?? {}),
                    },
                }))
                : null;
            const assistantRowId = randomUUID();
            await db.insert(zeepoAgentMessage).values({
                id: assistantRowId,
                sessionId: input.sessionId,
                role: "assistant",
                content: assistantText || "",
                toolCalls: syntheticToolCalls,
                metadata: {
                    orchestrationModelId: orchModel.id,
                    iteration,
                    parseOk: parseResult.ok,
                    repairUsed,
                    rawAttempts: rawAttempts.length,
                    ...(clarifyingQuestions ? { clarifyingQuestions } : {}),
                },
                createdAt: new Date(),
            });
            agentMessages.push({
                role: "assistant",
                content: assistantText || "",
                ...(syntheticToolCalls?.length
                    ? { toolCalls: syntheticToolCalls }
                    : {}),
            });
            lastContent = assistantText || "";
            // Stop iterating if the agent has no tool calls or is waiting for answers.
            if (!toolCalls.length || clarifyingQuestions?.length)
                break;
            // Loop-guard: if the agent issues the same tool call twice in a row, stop.
            const sigs = toolCalls.map(toolCallSignature);
            const repeated = sigs.some((s) => recentToolSignatures.length > 0 &&
                recentToolSignatures[recentToolSignatures.length - 1] === s);
            recentToolSignatures.push(...sigs);
            if (repeated) {
                await db.insert(zeepoAgentMessage).values({
                    id: randomUUID(),
                    sessionId: input.sessionId,
                    role: "tool",
                    content: JSON.stringify({
                        error: "Loop detected: identical tool call repeated. Stopping iteration. Reply to the user with what you have or ask a clarifying question.",
                    }),
                    toolCallId: syntheticToolCalls[0].id,
                    createdAt: new Date(),
                });
                break;
            }
            // Counts media-generation tool calls within this turn so each
            // successive one is delayed by MEDIA_STAGGER_SECONDS, preventing
            // simultaneous Replicate predictions.create calls (HTTP 429).
            const MEDIA_STAGGER_SECONDS = 12;
            let mediaGenerationIndex = 0;
            for (let i = 0; i < toolCalls.length; i++) {
                const tc = toolCalls[i];
                const toolCallId = syntheticToolCalls[i].id;
                const rawArgs = (tc.arguments ?? {});
                let resultPayload;
                if (tc.name === "create_document") {
                    const parsedArgs = createDocumentArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `create_document received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            const docId = randomUUID();
                            const now = new Date();
                            await db.insert(zeepoAgentGeneration).values({
                                id: docId,
                                sessionId: input.sessionId,
                                messageId: null,
                                userId,
                                teamId: session.teamId ?? null,
                                modelCategory: "document",
                                modelId: "zeepo/document",
                                status: "COMPLETED",
                                prompt: parsedArgs.data.title,
                                inputs: {},
                                outputs: {
                                    document: {
                                        title: parsedArgs.data.title,
                                        content: parsedArgs.data.content,
                                    },
                                },
                                errorMessage: null,
                                qstashMessageId: null,
                                createdAt: now,
                                updatedAt: now,
                                completedAt: now,
                            });
                            resultPayload = {
                                _tool: "create_document",
                                status: "CREATED",
                                title: parsedArgs.data.title,
                            };
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Document creation failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "create_presentation") {
                    const parsedArgs = createPresentationArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `create_presentation received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            const presId = randomUUID();
                            const now = new Date();
                            await db.insert(zeepoAgentGeneration).values({
                                id: presId,
                                sessionId: input.sessionId,
                                messageId: null,
                                userId,
                                teamId: session.teamId ?? null,
                                modelCategory: "presentation",
                                modelId: "zeepo/presentation",
                                status: "COMPLETED",
                                prompt: parsedArgs.data.title,
                                inputs: {},
                                outputs: {
                                    presentation: {
                                        title: parsedArgs.data.title,
                                        theme: parsedArgs.data.theme,
                                        slides: parsedArgs.data.slides,
                                    },
                                },
                                createdAt: now,
                                updatedAt: now,
                                completedAt: now,
                            });
                            resultPayload = {
                                _tool: "create_presentation",
                                status: "CREATED",
                                title: parsedArgs.data.title,
                                slideCount: parsedArgs.data.slides.length,
                            };
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Presentation creation failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "create_image_presentation") {
                    const parsedArgs = createImagePresentationArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `create_image_presentation received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            const presId = randomUUID();
                            const now = new Date();
                            await db.insert(zeepoAgentGeneration).values({
                                id: presId,
                                sessionId: input.sessionId,
                                messageId: null,
                                userId,
                                teamId: session.teamId ?? null,
                                modelCategory: "image-presentation",
                                modelId: "zeepo/image-presentation",
                                status: "COMPLETED",
                                prompt: parsedArgs.data.title,
                                inputs: {},
                                outputs: {
                                    imagePresentation: {
                                        title: parsedArgs.data.title,
                                        slides: parsedArgs.data.slides,
                                    },
                                },
                                createdAt: now,
                                updatedAt: now,
                                completedAt: now,
                            });
                            resultPayload = {
                                _tool: "create_image_presentation",
                                status: "CREATED",
                                title: parsedArgs.data.title,
                                slideCount: parsedArgs.data.slides.length,
                                hasImages: parsedArgs.data.slides.some(s => Boolean(s.imageUrl)),
                            };
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Image presentation creation failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "check_domain_availability") {
                    const parsedArgs = checkDomainAvailabilityArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `check_domain_availability received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            resultPayload = await agentCheckDomainAvailability({
                                name: parsedArgs.data.name,
                                extensions: parsedArgs.data.extensions ??
                                    DEFAULT_DOMAIN_EXTENSIONS,
                                targetCurrency: sessionCtx.team.baseCurrency ??
                                    DEFAULT_DISPLAY_CURRENCY,
                            });
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Domain check failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "get_web_hosting_plans") {
                    const parsedArgs = getWebHostingPlansArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `get_web_hosting_plans received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            resultPayload = await agentGetWebHostingPlans();
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Web hosting plans fetch failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "get_email_hosting_plans") {
                    const parsedArgs = getEmailHostingPlansArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `get_email_hosting_plans received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        try {
                            resultPayload = await agentGetEmailHostingPlans();
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Email hosting plans fetch failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "web_search") {
                    const braveKey = env.BRAVE_SEARCH_API_KEY;
                    if (!braveKey) {
                        resultPayload = {
                            error: "Web search is not available (BRAVE_SEARCH_API_KEY not configured). Proceed without web context or let the user know you cannot search the web right now.",
                        };
                    }
                    else {
                        const parsedArgs = webSearchArgsSchema.safeParse(rawArgs);
                        if (!parsedArgs.success) {
                            resultPayload = {
                                error: `web_search received invalid arguments: ${parsedArgs.error.message}`,
                            };
                        }
                        else {
                            try {
                                const grounding = await callBraveLlmContext({
                                    apiKey: braveKey,
                                    query: parsedArgs.data.query,
                                    depth: parsedArgs.data.depth,
                                    freshness: parsedArgs.data.freshness,
                                    country: parsedArgs.data.country,
                                });
                                // Return the grounding text directly so it reads naturally in the
                                // message history and the UI can detect it by prefix.
                                resultPayload = grounding;
                            }
                            catch (e) {
                                resultPayload = {
                                    error: `${formatZeepoAgentToolError("Web search failed", e)} Proceed with your existing knowledge and note the limitation.`,
                                };
                            }
                        }
                    }
                }
                else if (tc.name === "list_models") {
                    const parsedArgs = listModelsArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `list_models received invalid arguments: ${parsedArgs.error.message}`,
                        };
                    }
                    else {
                        const models = listModelsForTool({
                            category: parsedArgs.data.category,
                            requires: parsedArgs.data.requires,
                        });
                        resultPayload = {
                            count: models.length,
                            models,
                        };
                    }
                }
                else if (tc.name === "run_media_generation") {
                    const parsedArgs = runMediaGenerationArgsSchema.safeParse(rawArgs);
                    if (!parsedArgs.success) {
                        resultPayload = {
                            error: `run_media_generation received invalid arguments: ${parsedArgs.error.message}`,
                            hint: "Inspect the tool definition and call list_models first if you are unsure of valid model ids.",
                        };
                    }
                    else {
                        try {
                            if (billingCtx.teamId &&
                                !(await zeepoAgentHasTokensRemaining(billingCtx.teamId))) {
                                resultPayload = {
                                    error: "Insufficient tokens to start media generation. Purchase more tokens to continue.",
                                };
                            }
                            else {
                                const requires = safeCapsArray(parsedArgs.data.requires);
                                const model = pickModelForGeneration(parsedArgs.data.category, parsedArgs.data.model_id || undefined, requires);
                                const staggerDelay = mediaGenerationIndex > 0
                                    ? mediaGenerationIndex * MEDIA_STAGGER_SECONDS
                                    : undefined;
                                const { generationId } = await insertAndEnqueueAgentGeneration({
                                    userId,
                                    teamId: session.teamId ?? null,
                                    sessionId: input.sessionId,
                                    messageId: assistantRowId,
                                    modelCategory: model.category,
                                    modelId: model.id,
                                    prompt: parsedArgs.data.prompt,
                                    inputs: parsedArgs.data.inputs ?? {},
                                    ctx: {
                                        ipAddress: ctx.ipAddress ?? null,
                                        userAgent: ctx.req.header("user-agent") ?? null,
                                    },
                                    delaySeconds: staggerDelay,
                                });
                                mediaGenerationIndex++;
                                resultPayload = {
                                    generationId,
                                    status: "QUEUED",
                                    modelId: model.id,
                                    category: model.category,
                                };
                            }
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Failed to start generation", e),
                            };
                        }
                    }
                }
                else if (tc.name === "get_user_session") {
                    // No meaningful args - validate defensively but always proceed.
                    getSessionInfoArgsSchema.safeParse(rawArgs);
                    try {
                        // Fetch the authenticated user's role and profile in parallel.
                        const [dbUser, profile] = await Promise.all([
                            db.query.user.findFirst({
                                where: eq(userTable.id, userId),
                                columns: { id: true, role: true },
                            }),
                            db.query.userProfile.findFirst({
                                where: eq(userProfileTable.userId, userId),
                                columns: {
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    address: true,
                                    city: true,
                                    country: true,
                                    postalCode: true,
                                },
                            }),
                        ]);
                        const role = (dbUser?.role ?? "CUSTOMER");
                        const isAgency = role === "AGENCY_USER" ||
                            role === "AGENCY_ADMIN" ||
                            role === "AGENCY_SUPER_ADMIN";
                        // Required fields for domain registration (same set the payment dialog checks).
                        const REQUIRED_PROFILE_FIELDS = [
                            "firstName",
                            "lastName",
                            "phone",
                            "address",
                            "city",
                            "country",
                            "postalCode",
                        ];
                        const missingFields = [];
                        if (!isAgency) {
                            for (const field of REQUIRED_PROFILE_FIELDS) {
                                const val = profile?.[field];
                                if (!val || String(val).trim() === "") {
                                    missingFields.push(field);
                                }
                            }
                        }
                        const profileComplete = missingFields.length === 0;
                        resultPayload = {
                            _tool: "get_user_session",
                            role,
                            isAgency,
                            profileComplete,
                            missingFields,
                        };
                    }
                    catch (e) {
                        resultPayload = {
                            error: formatZeepoAgentToolError("get_user_session failed", e),
                        };
                    }
                }
                else if (tc.name === "get_domains_portfolio") {
                    getDomainsPortfolioArgsSchema.safeParse(rawArgs);
                    try {
                        const dbUser = await db.query.user.findFirst({
                            where: eq(userTable.id, userId),
                            columns: { role: true },
                        });
                        const role = (dbUser?.role ?? "CUSTOMER");
                        const isAgency = role === "AGENCY_USER" ||
                            role === "AGENCY_ADMIN" ||
                            role === "AGENCY_SUPER_ADMIN";
                        resultPayload = await agentGetDomainsPortfolio({
                            isAgency,
                            teamId: sessionCtx.team.id ?? null,
                            teamName: sessionCtx.team.name ?? null,
                        });
                    }
                    catch (e) {
                        resultPayload = {
                            error: formatZeepoAgentToolError("Domains portfolio fetch failed", e),
                        };
                    }
                }
                else if (tc.name === "get_domain_detail") {
                    const parsed = getDomainDetailArgsSchema.safeParse(rawArgs);
                    if (!parsed.success) {
                        resultPayload = {
                            error: `Invalid arguments for get_domain_detail: ${parsed.error.message}`,
                        };
                    }
                    else {
                        try {
                            const dbUser = await db.query.user.findFirst({
                                where: eq(userTable.id, userId),
                                columns: { role: true },
                            });
                            const role = (dbUser?.role ?? "CUSTOMER");
                            const isAgency = role === "AGENCY_USER" ||
                                role === "AGENCY_ADMIN" ||
                                role === "AGENCY_SUPER_ADMIN";
                            resultPayload = await agentGetDomainDetail({
                                domain: parsed.data.domain,
                                isAgency,
                                teamId: sessionCtx.team.id ?? null,
                                includeNameservers: parsed.data.include_nameservers ?? false,
                                includeDns: parsed.data.include_dns ?? false,
                            });
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Domain detail fetch failed", e),
                            };
                        }
                    }
                }
                else if (tc.name === "get_hosting_resources") {
                    getHostingResourcesArgsSchema.safeParse(rawArgs);
                    try {
                        const dbUser = await db.query.user.findFirst({
                            where: eq(userTable.id, userId),
                            columns: { role: true },
                        });
                        const role = (dbUser?.role ?? "CUSTOMER");
                        const isAgency = role === "AGENCY_USER" ||
                            role === "AGENCY_ADMIN" ||
                            role === "AGENCY_SUPER_ADMIN";
                        resultPayload = await agentGetHostingResources({
                            isAgency,
                            teamId: sessionCtx.team.id ?? null,
                            teamName: sessionCtx.team.name ?? null,
                        });
                    }
                    catch (e) {
                        resultPayload = {
                            error: formatZeepoAgentToolError("Hosting resources fetch failed", e),
                        };
                    }
                }
                else if (tc.name === "get_hosting_detail") {
                    const parsed = getHostingDetailArgsSchema.safeParse(rawArgs);
                    if (!parsed.success) {
                        resultPayload = {
                            error: `Invalid arguments for get_hosting_detail: ${parsed.error.message}`,
                        };
                    }
                    else {
                        try {
                            const dbUser = await db.query.user.findFirst({
                                where: eq(userTable.id, userId),
                                columns: { role: true },
                            });
                            const role = (dbUser?.role ?? "CUSTOMER");
                            const isAgency = role === "AGENCY_USER" ||
                                role === "AGENCY_ADMIN" ||
                                role === "AGENCY_SUPER_ADMIN";
                            resultPayload = await agentGetHostingDetail({
                                domain: parsed.data.domain,
                                isAgency,
                                teamId: sessionCtx.team.id ?? null,
                                includeDns: parsed.data.include_dns ?? false,
                                includeMail: parsed.data.include_mail ?? false,
                                includeSubdomains: parsed.data.include_subdomains ?? false,
                                includeDatabases: parsed.data.include_databases ?? false,
                            });
                        }
                        catch (e) {
                            resultPayload = {
                                error: formatZeepoAgentToolError("Hosting detail fetch failed", e),
                            };
                        }
                    }
                }
                else {
                    resultPayload = {
                        error: `Unknown tool "${tc.name}". Available: get_user_session, get_domains_portfolio, get_domain_detail, get_hosting_resources, get_hosting_detail, create_document, create_presentation, create_image_presentation, check_domain_availability, get_web_hosting_plans, get_email_hosting_plans, web_search, list_models, run_media_generation.`,
                    };
                }
                const toolResultString = typeof resultPayload === "string"
                    ? resultPayload
                    : JSON.stringify(resultPayload);
                await db.insert(zeepoAgentMessage).values({
                    id: randomUUID(),
                    sessionId: input.sessionId,
                    role: "tool",
                    content: toolResultString,
                    toolCallId,
                    createdAt: new Date(),
                });
                agentMessages.push({
                    role: "tool",
                    content: toolResultString,
                    toolCallId,
                });
            }
        }
        await db
            .update(zeepoAgentSession)
            .set({ updatedAt: new Date() })
            .where(eq(zeepoAgentSession.id, input.sessionId));
        const sessionOut = await db.query.zeepoAgentSession.findFirst({
            where: eq(zeepoAgentSession.id, input.sessionId),
            with: {
                messages: {
                    orderBy: (m, { asc }) => [asc(m.createdAt)],
                },
            },
        });
        return {
            data: sessionOut,
            lastAssistantPreview: lastContent.slice(0, 200),
        };
    }),
    /**
     * Generate a short title for a session based on its first 3 user messages.
     * No-ops if the title is already set (not "New chat" / not null).
     * Runs a lightweight direct Replicate call - does not go through the full
     * orchestration pipeline.
     */
    generateTitle: zeepoAgentProcedure
        .input(generateSessionTitleSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await db.query.zeepoAgentSession.findFirst({
            where: eq(zeepoAgentSession.id, input.sessionId),
        });
        if (!session || session.userId !== userId)
            throw new TRPCError({ code: "NOT_FOUND" });
        // Guard: only generate when the title is still the default placeholder.
        const current = (session.title ?? "").trim();
        if (current && current !== "New chat")
            return { title: current };
        // Fetch the first 3 user messages for context directly from the DB.
        const allMsgs = await db.query.zeepoAgentMessage.findMany({
            where: eq(zeepoAgentMessage.sessionId, input.sessionId),
            orderBy: [asc(zeepoAgentMessage.createdAt)],
        });
        const firstThree = allMsgs
            .filter((m) => m.role === "user")
            .slice(0, 3)
            .map((m) => (typeof m.content === "string" ? m.content : "").slice(0, 200));
        if (firstThree.length < 3)
            return { title: current || "New chat" };
        // Helper: derive a reasonable title from the first user message without AI.
        const heuristicTitle = (msgs) => {
            const src = msgs[0] ?? "";
            // Strip attachment markers, URLs, and collapse whitespace.
            const cleaned = src
                .replace(/\[ATTACHED_FILE[^\]]*\]/gi, "")
                .replace(/https?:\/\/\S+/g, "")
                .replace(/\s+/g, " ")
                .trim();
            // Take first 6 words, capitalise first word.
            const words = cleaned.split(" ").filter(Boolean).slice(0, 6);
            if (!words.length)
                return "New chat";
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            return words.join(" ").replace(/[.!?,;:]+$/, "");
        };
        let newTitle = "";
        // Attempt AI-generated title; fall back to heuristic on any failure.
        try {
            const orchModel = getZeepoAgentOrchestrationModel();
            const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
            const replicateInput = orchModel.id.startsWith("anthropic/")
                ? {
                    system_prompt: "You write short chat titles. Output ONLY the title - 4 to 6 words, sentence case, no punctuation, no quotes.",
                    prompt: `Based on these user messages, write a short chat title:\n${firstThree.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
                    max_tokens: 32,
                }
                : {
                    prompt: `Write a 4–6 word chat title (no punctuation, no quotes) for:\n${firstThree.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
                    max_tokens: 32,
                };
            const billingCtx = {
                teamId: session.teamId ?? null,
                userId,
                userRole: ctx.session?.user?.role,
                sessionId: input.sessionId,
            };
            const { text: raw, prediction } = await runReplicateTextPrediction({
                replicate,
                modelId: orchModel.id,
                input: replicateInput,
                maxMs: 30_000,
            });
            await billZeepoAgentPrediction({
                billing: billingCtx,
                prediction,
                modelId: orchModel.id,
                operationType: "title_gen",
                description: "Session title generation",
            });
            newTitle = raw
                .trim()
                .replace(/^["'`]+|["'`]+$/g, "")
                .replace(/\.$/, "")
                .slice(0, 100);
        }
        catch {
            // AI call failed - use heuristic title derived from message content.
        }
        if (!newTitle || newTitle.toLowerCase() === "new chat") {
            newTitle = heuristicTitle(firstThree);
        }
        if (!newTitle || newTitle === "New chat")
            return { title: "New chat" };
        await db
            .update(zeepoAgentSession)
            .set({ title: newTitle, updatedAt: new Date() })
            .where(eq(zeepoAgentSession.id, input.sessionId));
        return { title: newTitle };
    }),
    /**
     * Synchronous AI image edit - no background job, result returned directly.
     *
     * Uses black-forest-labs/flux-2-pro with the source image passed via
     * input_images for image-to-image editing. When the user has drawn a mask,
     * the prompt is prefixed to target the brushed region.
     */
    editImage: zeepoAgentProcedure
        .input(imageEditSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        // Validate the session belongs to this user (auth gate only - no DB write).
        const session = await db.query.zeepoAgentSession.findFirst({
            where: eq(zeepoAgentSession.id, input.sessionId),
            columns: { id: true, userId: true, teamId: true },
        });
        if (!session || session.userId !== userId)
            throw new TRPCError({ code: "NOT_FOUND" });
        const billingCtx = {
            teamId: session.teamId ?? null,
            userId,
            userRole: ctx.session?.user?.role,
            sessionId: input.sessionId,
        };
        await assertZeepoAgentCanStartTurn(billingCtx);
        const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
        // When the user painted a mask, prefix the prompt so the model knows
        // to target only the brushed region.
        const effectivePrompt = input.maskDataUrl
            ? `Edit only the highlighted/selected region: ${input.prompt}`
            : input.prompt;
        const { output, ...predictionRest } = await runReplicatePrediction({
            replicate,
            modelId: "black-forest-labs/flux-2-pro",
            input: {
                prompt: effectivePrompt,
                input_images: [input.imageUrl],
                aspect_ratio: "match_input_image",
                resolution: input.resolution ?? "1 MP",
                output_format: input.outputFormat ?? "webp",
                output_quality: 90,
                safety_tolerance: 2,
            },
            maxMs: 90_000,
        });
        await billZeepoAgentPrediction({
            billing: billingCtx,
            prediction: { ...predictionRest, output },
            modelId: "black-forest-labs/flux-2-pro",
            operationType: "image_edit",
            description: "Inline image edit",
            generationId: input.generationId ?? null,
        });
        const resultUrl = extractReplicateImageUrl(output);
        if (!resultUrl)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Model returned no image.",
            });
        // Persist to edit history when a generationId is provided.
        if (input.generationId) {
            try {
                const { fileUrl: persistedUrl } = await persistRemoteUrlToObjectStorage(resultUrl, {
                    skipNonReplicate: false,
                });
                await db.insert(zeepoAgentImageEditHistory).values({
                    id: randomUUID(),
                    sessionId: input.sessionId,
                    generationId: input.generationId,
                    parentId: input.parentId ?? null,
                    userId,
                    imageUrl: persistedUrl,
                    operationType: "instruction",
                    label: input.maskDataUrl ? "Region Edit" : "Instruction Edit",
                    prompt: input.prompt,
                });
                return { imageUrl: persistedUrl };
            }
            catch {
                // Non-fatal - return the Replicate URL even if persist fails
            }
        }
        return { imageUrl: resultUrl };
    }),
});
/**
 * Robustly extract the first image URL from Replicate run() output.
 * Handles: string URL, string[], FileOutput[], and FileOutput (newer SDK).
 */
function extractReplicateImageUrl(output) {
    const items = Array.isArray(output) ? output : [output];
    for (const item of items) {
        if (!item)
            continue;
        if (typeof item === "string" && item.startsWith("http"))
            return item;
        // FileOutput.toString() or String(fileOutput) returns the CDN URL.
        const s = String(item);
        if (s.startsWith("http"))
            return s;
    }
    return null;
}
