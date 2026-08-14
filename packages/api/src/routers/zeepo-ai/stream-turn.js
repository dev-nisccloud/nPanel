import Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, gte, inArray, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { zeepoAiActivityLog, zeepoAiAttachment, zeepoAiGeneration, zeepoAiMessage, zeepoAiSession, zeepoAiToolInvocation, zeepoAiUsageEvent, } from "@npanel/db/schema/zeepo-ai";
import { team } from "@npanel/db/schema/teams";
import { user as userTable } from "@npanel/db/schema/auth";
import { randomUUID } from "node:crypto";
import { anthropicUsageBillingMeta, estimateZeepoAiProviderCostUsdMicros, mergeAnthropicUsage, providerMicrosToCustomerTokens, resolveZeepoAiModelId, resolveZeepoAiSupportModelId, ZEEPO_AI_PROVIDER, } from "../../lib/zeepo-ai-billing";
import { assertCustomerCanUseZeepoAi, assertZeepoAiTeamAccess, } from "../../lib/zeepo-ai-access";
import { assertZeepoAiCanStartTurn, creditZeepoAiTokens, debitZeepoAiTokens, isZeepoAiAgencyUser, logZeepoAiAgencyUsage, shouldBillZeepoAiTokens, } from "../../lib/zeepo-ai-tokens";
import { releaseZeepoAiSessionLock, tryAcquireZeepoAiSessionLock, } from "../../lib/zeepo-ai-session-lock";
import { buildZeepoAiIdentityPrompt, buildZeepoAiSessionAssetsBlock, buildZeepoAiSessionContextBlock, buildZeepoAiSkillBlock, buildZeepoAiSupportOverlayPrompt, } from "./prompts";
import { ZEEPO_AI_SUPPORT_CATALOG_TOOL_NAMES, ZEEPO_AI_SUPPORT_FAB_SURFACE, ZEEPO_AI_SUPPORT_INVENTORY_TOOL_NAMES, isZeepoAiSupportFabSession, isZeepoAiSupportGenerationTool, isZeepoAiSupportGuestRole, isZeepoAiSupportInventoryTool, } from "../../lib/zeepo-ai-support";
import { askClarifyingQuestionsArgsSchema, createDocumentArgsSchema, createPresentationArgsSchema, createImagePresentationArgsSchema, generateImagesArgsSchema, getZeepoAiSkillById, ZEEPO_AI_CLIENT_TOOLS, } from "./tools";
import { executeCreateImagePresentationTool, executeGenerateImagesTool, } from "./image-generation";
import { executeZeepoAiOpsTool, getZeepoAiOpsTools, getZeepoAiSupportOpsTools, isZeepoAiOpsToolName, stripZeepoAiOpsToolResultForModel, } from "./ops-tools";
import { maybeAutoTitleZeepoAiSession } from "./title";
function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    return new Anthropic({ apiKey });
}
/**
 * Anthropic rejects mismatched thinking modes with HTTP 400.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/thinking-troubleshooting
 * - Claude Sonnet/Opus/Haiku 4.5 (and earlier Claude 4): extended only → type "enabled"
 * - Claude Sonnet/Opus 4.6+: adaptive (preferred)
 * - Claude 5 / Mythos 5 / Fable 5: adaptive only
 */
function buildZeepoAiThinkingConfig(modelId) {
    const id = modelId.toLowerCase();
    const extendedOnly = id.includes("claude-sonnet-4-5") ||
        id.includes("claude-opus-4-5") ||
        id.includes("claude-haiku-4-5") ||
        /^claude-(sonnet|opus)-4($|[^0-9.])/i.test(id) ||
        id.includes("claude-opus-4-1");
    if (extendedOnly) {
        return {
            type: "enabled",
            budget_tokens: 10_000,
            display: "summarized",
        };
    }
    return {
        type: "adaptive",
        display: "summarized",
    };
}
function isImageMime(mime) {
    return /^image\/(jpeg|png|gif|webp)$/i.test(mime);
}
function isPdfMime(mime) {
    return mime === "application/pdf";
}
async function emit(onEvent, event) {
    await onEvent(event);
}
function publicStreamError(err, userRole) {
    if (userRole === "AGENCY_SUPER_ADMIN") {
        return err instanceof Error ? err.message : "Something went wrong generating a reply";
    }
    return "Failed to generate a reply. Please try again or contact support.";
}
function publicToolErrorMessage(raw, userRole) {
    if (userRole === "AGENCY_SUPER_ADMIN")
        return raw;
    return "Tool failed. Please try again.";
}
function parseTokensDebited(value) {
    if (!value)
        return 0;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
}
function buildAssistantHistoryText(params) {
    const content = params.content?.trim() ?? "";
    if (content)
        return content;
    const completed = params.generations.filter((g) => g.status === "COMPLETED");
    const imageGens = completed.filter((g) => g.kind === "image" || g.kind === "image-presentation");
    if (imageGens.length > 0) {
        return `Generated ${imageGens.length} image${imageGens.length === 1 ? "" : "s"}.`;
    }
    const docs = completed.filter((g) => g.kind === "document");
    if (docs.length > 0) {
        return `Created ${docs.length} document${docs.length === 1 ? "" : "s"}.`;
    }
    const presentations = completed.filter((g) => g.kind === "presentation");
    if (presentations.length > 0) {
        return presentations.length === 1
            ? "Created a presentation."
            : `Created ${presentations.length} presentations.`;
    }
    const askedClarifying = params.tools.some((t) => t.toolName === "ask_clarifying_questions" && t.status === "succeeded");
    if (askedClarifying)
        return "Asked clarifying questions.";
    const succeededTools = params.tools.filter((t) => t.status === "succeeded");
    if (succeededTools.length > 0) {
        return `Used tools: ${succeededTools.map((t) => t.toolName).join(", ")}.`;
    }
    return null;
}
/** Fire-and-forget DB write so the Anthropic stream loop is never blocked on Postgres. */
function persistPartialAssistantAsync(params) {
    void persistPartialAssistant(params).catch((err) => {
        console.error("[ZeepoAI] persistPartialAssistant failed:", err);
    });
}
function provisionalGenerationId(toolUseId) {
    return `pending-${toolUseId}`;
}
/** Best-effort parse of image slot count from partial tool JSON while it streams. */
function tryParseImageSlotCount(partialJson) {
    const trimmed = partialJson.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
            return Math.min(8, Math.max(1, parsed.prompts.length));
        }
        if (typeof parsed.count === "number" && Number.isFinite(parsed.count)) {
            return Math.min(8, Math.max(1, Math.floor(parsed.count)));
        }
    }
    catch {
        /* incomplete JSON  heuristics below */
    }
    const promptsIdx = trimmed.search(/"prompts"\s*:\s*\[/);
    if (promptsIdx >= 0) {
        const after = trimmed.slice(promptsIdx);
        const bracket = after.indexOf("[");
        if (bracket >= 0) {
            let depth = 0;
            let end = -1;
            for (let i = bracket; i < after.length; i++) {
                const ch = after[i];
                if (ch === "[")
                    depth++;
                else if (ch === "]") {
                    depth--;
                    if (depth === 0) {
                        end = i;
                        break;
                    }
                }
            }
            const slice = end >= 0 ? after.slice(bracket, end + 1) : after.slice(bracket);
            // Count top-level JSON strings in the (possibly open) array.
            const stringMatches = slice.match(/"(?:\\.|[^"\\])*"/g) ?? [];
            if (stringMatches.length > 0) {
                return Math.min(8, Math.max(1, stringMatches.length));
            }
        }
    }
    // Prefer prompts (above) over count  count can arrive early and overshoot.
    const countMatch = trimmed.match(/"count"\s*:\s*(\d+)/);
    if (countMatch) {
        const n = Number(countMatch[1]);
        if (Number.isFinite(n) && n >= 1)
            return Math.min(8, Math.floor(n));
    }
    // Image presentations: count only *closed* slide objects under "slides".
    const slidesIdx = trimmed.search(/"slides"\s*:\s*\[/);
    if (slidesIdx >= 0) {
        const after = trimmed.slice(slidesIdx);
        let objectCount = 0;
        let depth = 0;
        let inString = false;
        let escape = false;
        let seenArray = false;
        for (let i = 0; i < after.length; i++) {
            const ch = after[i];
            if (inString) {
                if (escape)
                    escape = false;
                else if (ch === "\\")
                    escape = true;
                else if (ch === '"')
                    inString = false;
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (!seenArray) {
                if (ch === "[")
                    seenArray = true;
                continue;
            }
            if (ch === "{") {
                depth++;
            }
            else if (ch === "}") {
                if (depth === 1)
                    objectCount++;
                depth = Math.max(0, depth - 1);
            }
            else if (ch === "]" && depth === 0) {
                break;
            }
        }
        if (objectCount > 0)
            return Math.min(8, Math.max(1, objectCount));
    }
    return null;
}
/**
 * Extract fully-closed question objects from a partial ask_clarifying_questions
 * tool JSON payload so chips can appear before the tool block finishes.
 */
function tryParseClarifyingQuestionsPartial(partialJson) {
    const trimmed = partialJson.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const mapped = parsed.questions
                .map((q) => {
                if (typeof q.question !== "string" || !Array.isArray(q.options))
                    return null;
                const options = q.options.filter((o) => typeof o === "string");
                if (options.length < 2)
                    return null;
                return {
                    question: q.question,
                    options,
                    ...(q.allow_upload === true ? { allow_upload: true } : {}),
                };
            })
                .filter((q) => Boolean(q));
            return mapped.length > 0 ? mapped : null;
        }
    }
    catch {
        /* incomplete  scan for closed objects */
    }
    const results = [];
    let searchFrom = 0;
    while (searchFrom < trimmed.length) {
        const qKey = trimmed.indexOf('"question"', searchFrom);
        if (qKey < 0)
            break;
        let start = qKey;
        while (start > 0 && trimmed[start] !== "{")
            start--;
        if (trimmed[start] !== "{") {
            searchFrom = qKey + 1;
            continue;
        }
        let depth = 0;
        let inString = false;
        let escape = false;
        let end = -1;
        for (let i = start; i < trimmed.length; i++) {
            const ch = trimmed[i];
            if (inString) {
                if (escape)
                    escape = false;
                else if (ch === "\\")
                    escape = true;
                else if (ch === '"')
                    inString = false;
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === "{")
                depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (end < 0)
            break;
        try {
            const obj = JSON.parse(trimmed.slice(start, end + 1));
            if (typeof obj.question === "string" && Array.isArray(obj.options)) {
                const options = obj.options.filter((o) => typeof o === "string");
                if (options.length >= 2) {
                    results.push({
                        question: obj.question,
                        options,
                        ...(obj.allow_upload === true ? { allow_upload: true } : {}),
                    });
                }
            }
        }
        catch {
            /* ignore malformed slice */
        }
        searchFrom = end + 1;
    }
    return results.length > 0 ? results : null;
}
async function persistPartialAssistant(params) {
    await db
        .update(zeepoAiMessage)
        .set({
        content: params.content || null,
        reasoning: params.reasoning || null,
        status: params.status,
        inputTokens: params.inputTokens ?? undefined,
        outputTokens: params.outputTokens ?? undefined,
        metadata: params.metadata ?? undefined,
    })
        .where(eq(zeepoAiMessage.id, params.messageId));
}
function buildWebTools() {
    return [
        {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
        },
        {
            type: "web_fetch_20250910",
            name: "web_fetch",
            max_uses: 5,
            citations: { enabled: true },
        },
    ];
}
/** Hard-delete a user message and every later message (+ gens / tool rows) for retry/edit. */
async function truncateSessionFromUserMessage(params) {
    const anchor = await db.query.zeepoAiMessage.findFirst({
        where: and(eq(zeepoAiMessage.id, params.userMessageId), eq(zeepoAiMessage.sessionId, params.sessionId), eq(zeepoAiMessage.role, "user")),
        columns: { id: true, createdAt: true },
    });
    if (!anchor)
        return;
    const toRemove = await db.query.zeepoAiMessage.findMany({
        where: and(eq(zeepoAiMessage.sessionId, params.sessionId), gte(zeepoAiMessage.createdAt, anchor.createdAt)),
        columns: { id: true },
    });
    const ids = toRemove.map((m) => m.id);
    if (!ids.length)
        return;
    const [gensToRefund, usageToRefund] = await Promise.all([
        db.query.zeepoAiGeneration.findMany({
            where: and(eq(zeepoAiGeneration.sessionId, params.sessionId), inArray(zeepoAiGeneration.messageId, ids)),
            columns: { id: true, status: true, tokensDebited: true },
        }),
        db.query.zeepoAiUsageEvent.findMany({
            where: inArray(zeepoAiUsageEvent.messageId, ids),
            columns: { id: true, tokensDebited: true, generationId: true },
        }),
    ]);
    let tokensToRefund = 0;
    const genIdsCoveredByUsage = new Set(usageToRefund
        .map((e) => e.generationId)
        .filter((id) => Boolean(id)));
    for (const ev of usageToRefund) {
        tokensToRefund += parseTokensDebited(ev.tokensDebited);
    }
    for (const gen of gensToRefund) {
        if (gen.status !== "COMPLETED")
            continue;
        if (genIdsCoveredByUsage.has(gen.id))
            continue;
        tokensToRefund += parseTokensDebited(gen.tokensDebited);
    }
    await db
        .delete(zeepoAiToolInvocation)
        .where(and(eq(zeepoAiToolInvocation.sessionId, params.sessionId), inArray(zeepoAiToolInvocation.messageId, ids)));
    await db
        .delete(zeepoAiGeneration)
        .where(and(eq(zeepoAiGeneration.sessionId, params.sessionId), inArray(zeepoAiGeneration.messageId, ids)));
    await db
        .delete(zeepoAiMessage)
        .where(and(eq(zeepoAiMessage.sessionId, params.sessionId), inArray(zeepoAiMessage.id, ids)));
    if (params.teamId && tokensToRefund > 0) {
        await creditZeepoAiTokens({
            teamId: params.teamId,
            userId: params.userId,
            tokens: tokensToRefund,
            operationType: "retry_refund",
            description: "Refund for regenerated Zeepo AI turn",
            metadata: {
                sessionId: params.sessionId,
                userMessageId: params.userMessageId,
                messageIds: ids,
            },
        });
    }
}
export async function streamZeepoAiTurn(params) {
    const { sessionId, content, userId, userRole, skillId, searchEnabled = false, replaceFromUserMessageId, signal, onEvent, } = params;
    let modelId = resolveZeepoAiModelId(params.modelId);
    const startedAt = Date.now();
    const session = await db.query.zeepoAiSession.findFirst({
        where: and(eq(zeepoAiSession.id, sessionId), eq(zeepoAiSession.userId, userId)),
    });
    if (!session || session.status === "DELETED") {
        await emit(onEvent, {
            type: "error",
            message: "Session not found",
            code: "NOT_FOUND",
            recoverable: false,
        });
        await emit(onEvent, { type: "done", status: "error" });
        return;
    }
    const lockOwnerId = randomUUID();
    if (!tryAcquireZeepoAiSessionLock(sessionId, lockOwnerId)) {
        await emit(onEvent, {
            type: "error",
            message: "Another reply is already in progress for this chat.",
            code: "SESSION_BUSY",
            recoverable: true,
        });
        await emit(onEvent, { type: "done", status: "error" });
        return;
    }
    try {
        const isSupportFab = isZeepoAiSupportFabSession(session.metadata);
        const isGuestSupport = isSupportFab && isZeepoAiSupportGuestRole(userRole);
        if (isSupportFab) {
            modelId = resolveZeepoAiSupportModelId();
        }
        const attachmentIds = isSupportFab ? [] : (params.attachmentIds ?? []);
        if (isZeepoAiSupportGuestRole(userRole) && !isSupportFab) {
            await emit(onEvent, {
                type: "error",
                message: "Session not found",
                code: "FORBIDDEN",
                recoverable: false,
            });
            await emit(onEvent, { type: "done", status: "error" });
            return;
        }
        const supportSearchEnabled = isSupportFab ? false : searchEnabled;
        let teamId;
        try {
            if (isSupportFab) {
                if (isGuestSupport) {
                    teamId = null;
                }
                else {
                    try {
                        teamId = await assertZeepoAiTeamAccess({
                            userId,
                            userRole,
                            teamId: params.teamId ?? session.teamId,
                        });
                    }
                    catch {
                        teamId = null;
                    }
                }
            }
            else {
                teamId = await assertCustomerCanUseZeepoAi({
                    userId,
                    userRole,
                    teamId: params.teamId ?? session.teamId,
                    requireTokens: true,
                    tryWelcomeGrant: true, // Auto-grant welcome tokens for first-time paying customers
                });
            }
        }
        catch (e) {
            const message = e && typeof e === "object" && "message" in e
                ? String(e.message)
                : "Unable to start turn";
            await emit(onEvent, {
                type: "error",
                message,
                code: "FORBIDDEN",
                recoverable: false,
            });
            await emit(onEvent, { type: "done", status: "error" });
            return;
        }
        const [dbUser, dbTeam] = await Promise.all([
            db.query.user.findFirst({
                where: eq(userTable.id, userId),
                columns: { name: true, email: true },
            }),
            teamId
                ? db.query.team.findFirst({
                    where: eq(team.id, teamId),
                    columns: { id: true, name: true, slug: true, baseCurrency: true },
                })
                : Promise.resolve(null),
        ]);
        if (replaceFromUserMessageId?.trim()) {
            await truncateSessionFromUserMessage({
                sessionId,
                userMessageId: replaceFromUserMessageId.trim(),
                teamId,
                userId,
            });
        }
        const priorMessages = await db.query.zeepoAiMessage.findMany({
            where: eq(zeepoAiMessage.sessionId, sessionId),
            orderBy: [
                asc(zeepoAiMessage.createdAt),
                sql `case when ${zeepoAiMessage.role} = 'user' then 0 when ${zeepoAiMessage.role} = 'assistant' then 1 else 2 end`,
            ],
            columns: {
                id: true,
                role: true,
                content: true,
                reasoning: true,
                toolCalls: true,
                status: true,
                metadata: true,
            },
        });
        const attachments = attachmentIds.length > 0
            ? await db.query.zeepoAiAttachment.findMany({
                where: and(eq(zeepoAiAttachment.sessionId, sessionId), eq(zeepoAiAttachment.userId, userId)),
            })
            : [];
        const selectedAttachments = attachments.filter((a) => attachmentIds.includes(a.id));
        const allSessionAttachments = await db.query.zeepoAiAttachment.findMany({
            where: eq(zeepoAiAttachment.sessionId, sessionId),
            columns: { id: true, url: true, name: true, mimeType: true, messageId: true },
        });
        const [sessionGenerations, sessionToolInvocations] = await Promise.all([
            db.query.zeepoAiGeneration.findMany({
                where: eq(zeepoAiGeneration.sessionId, sessionId),
                columns: { id: true, messageId: true, kind: true, status: true },
            }),
            db.query.zeepoAiToolInvocation.findMany({
                where: eq(zeepoAiToolInvocation.sessionId, sessionId),
                columns: { messageId: true, toolName: true, status: true },
            }),
        ]);
        const attachmentsByMessageId = new Map();
        for (const att of allSessionAttachments) {
            if (!att.messageId)
                continue;
            const list = attachmentsByMessageId.get(att.messageId) ?? [];
            list.push(att);
            attachmentsByMessageId.set(att.messageId, list);
        }
        const generationsByMessageId = new Map();
        for (const gen of sessionGenerations) {
            if (!gen.messageId)
                continue;
            const list = generationsByMessageId.get(gen.messageId) ?? [];
            list.push({ kind: gen.kind, status: gen.status });
            generationsByMessageId.set(gen.messageId, list);
        }
        const toolsByMessageId = new Map();
        for (const tool of sessionToolInvocations) {
            if (!tool.messageId)
                continue;
            const list = toolsByMessageId.get(tool.messageId) ?? [];
            list.push({ toolName: tool.toolName, status: tool.status });
            toolsByMessageId.set(tool.messageId, list);
        }
        const userMessageId = randomUUID();
        const assistantMessageId = randomUUID();
        const userCreatedAt = new Date();
        // Assistant must sort after user when ordered by createdAt (same-ms ties reorder in UI).
        const assistantCreatedAt = new Date(userCreatedAt.getTime() + 1);
        const skill = !isSupportFab && skillId ? getZeepoAiSkillById(skillId) : undefined;
        const skillOk = skill?.available && skill.agentDirectives ? skill : undefined;
        await db.insert(zeepoAiMessage).values({
            id: userMessageId,
            sessionId,
            role: "user",
            content: content.trim(),
            status: "complete",
            metadata: {
                skillId: skillOk?.id ?? null,
                searchEnabled,
                attachmentIds: selectedAttachments.map((a) => a.id),
                modelId,
            },
            createdAt: userCreatedAt,
        });
        if (selectedAttachments.length) {
            for (const att of selectedAttachments) {
                await db
                    .update(zeepoAiAttachment)
                    .set({ messageId: userMessageId })
                    .where(eq(zeepoAiAttachment.id, att.id));
            }
        }
        await db.insert(zeepoAiMessage).values({
            id: assistantMessageId,
            sessionId,
            role: "assistant",
            content: "",
            reasoning: "",
            status: "streaming",
            metadata: { modelId, provider: ZEEPO_AI_PROVIDER },
            createdAt: assistantCreatedAt,
        });
        await db
            .update(zeepoAiSession)
            .set({ updatedAt: userCreatedAt })
            .where(eq(zeepoAiSession.id, sessionId));
        await db.insert(zeepoAiActivityLog).values({
            id: randomUUID(),
            sessionId,
            userId,
            teamId,
            action: "message.send",
            description: "User message sent",
            metadata: { modelId, searchEnabled, skillId: skillOk?.id ?? null },
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
        });
        await emit(onEvent, {
            type: "message_start",
            userMessageId,
            assistantMessageId,
            modelId,
        });
        // Claude-style naming: generate a short title from the first user message in parallel
        // with the reply so the header/sidebar update while streaming.
        const priorUserTurns = priorMessages.filter((m) => m.role === "user").length;
        const sessionMeta = (session.metadata ?? {});
        const titleTask = priorUserTurns === 0 && sessionMeta.autoTitled !== true
            ? maybeAutoTitleZeepoAiSession({
                sessionId,
                userId,
                userMessage: content,
                eligible: true,
            })
                .then(async (title) => {
                if (!title)
                    return;
                await emit(onEvent, { type: "session_title", title });
            })
                .catch(() => {
                /* non-fatal */
            })
            : Promise.resolve();
        const systemParts = [
            buildZeepoAiIdentityPrompt(),
            buildZeepoAiSessionContextBlock({
                nowIso: userCreatedAt.toISOString(),
                user: { name: dbUser?.name ?? null, email: dbUser?.email ?? null },
                team: {
                    id: dbTeam?.id ?? null,
                    name: dbTeam?.name ?? null,
                    slug: dbTeam?.slug ?? null,
                    baseCurrency: dbTeam?.baseCurrency ?? null,
                },
                sessionTitle: session.title,
                sessionCreatedAtIso: session.createdAt.toISOString(),
                turnCount: priorMessages.filter((m) => m.role === "user").length + 1,
                searchEnabled: supportSearchEnabled,
            }),
        ];
        if (isSupportFab) {
            systemParts.push(buildZeepoAiSupportOverlayPrompt(isGuestSupport || !teamId ? "guest" : "customer"));
        }
        const assetsBlock = buildZeepoAiSessionAssetsBlock(allSessionAttachments);
        if (assetsBlock)
            systemParts.push(assetsBlock);
        if (skillOk?.agentDirectives) {
            systemParts.push(buildZeepoAiSkillBlock(skillOk.agentDirectives));
        }
        const anthropicMessages = [];
        for (const m of priorMessages) {
            if (m.status === "streaming" || m.status === "cancelled")
                continue;
            if (m.role === "user") {
                const meta = (m.metadata ?? {});
                const fromMessage = attachmentsByMessageId.get(m.id) ?? [];
                const fromMetaIds = Array.isArray(meta.attachmentIds) ? meta.attachmentIds : [];
                const attMap = new Map(fromMessage.map((a) => [a.id, a]));
                for (const id of fromMetaIds) {
                    if (attMap.has(id))
                        continue;
                    const found = allSessionAttachments.find((a) => a.id === id);
                    if (found)
                        attMap.set(found.id, found);
                }
                const atts = [...attMap.values()];
                const text = m.content?.trim() ?? "";
                if (atts.length > 0) {
                    const blocks = [];
                    for (const att of atts) {
                        if (isImageMime(att.mimeType)) {
                            blocks.push({
                                type: "image",
                                source: { type: "url", url: att.url },
                            });
                        }
                        else if (isPdfMime(att.mimeType)) {
                            blocks.push({
                                type: "document",
                                source: { type: "url", url: att.url },
                            });
                        }
                    }
                    if (text)
                        blocks.push({ type: "text", text });
                    if (blocks.length > 0) {
                        anthropicMessages.push({ role: "user", content: blocks });
                    }
                }
                else if (text) {
                    anthropicMessages.push({ role: "user", content: text });
                }
            }
            else if (m.role === "assistant") {
                const historyText = buildAssistantHistoryText({
                    content: m.content,
                    generations: generationsByMessageId.get(m.id) ?? [],
                    tools: toolsByMessageId.get(m.id) ?? [],
                });
                if (!historyText)
                    continue;
                const blocks = [];
                const meta = m.metadata;
                if (m.reasoning && meta?.thinkingSignature) {
                    blocks.push({
                        type: "thinking",
                        thinking: m.reasoning,
                        signature: meta.thinkingSignature,
                    });
                }
                blocks.push({ type: "text", text: historyText });
                anthropicMessages.push({ role: "assistant", content: blocks });
            }
        }
        const userContent = [];
        for (const att of selectedAttachments) {
            if (isImageMime(att.mimeType)) {
                userContent.push({
                    type: "image",
                    source: { type: "url", url: att.url },
                });
            }
            else if (isPdfMime(att.mimeType)) {
                userContent.push({
                    type: "document",
                    source: { type: "url", url: att.url },
                });
            }
        }
        userContent.push({
            type: "text",
            text: content.trim(),
        });
        anthropicMessages.push({ role: "user", content: userContent });
        const tools = isSupportFab
            ? getZeepoAiSupportOpsTools({ includeInventory: Boolean(teamId) && !isGuestSupport })
            : [
                ...ZEEPO_AI_CLIENT_TOOLS,
                ...getZeepoAiOpsTools(),
                ...(supportSearchEnabled ? buildWebTools() : []),
            ];
        let reasoning = "";
        let text = "";
        let thinkingSignature;
        let clarifyingQuestions;
        let lastPersist = 0;
        let stopReason = null;
        let usage = {};
        let providerMessageId = null;
        let finalStatus = "complete";
        // Keep proxies / browsers from idle-closing the SSE socket during long Gemini runs.
        const pingTimer = setInterval(() => {
            void emit(onEvent, { type: "ping" });
        }, 5_000);
        try {
            const client = getAnthropicClient();
            let loopMessages = [...anthropicMessages];
            let iterations = 0;
            const maxIterations = 6;
            while (iterations < maxIterations) {
                iterations += 1;
                if (signal?.aborted) {
                    finalStatus = "cancelled";
                    break;
                }
                const pendingToolUses = [];
                const thinking = buildZeepoAiThinkingConfig(modelId);
                const stream = client.messages.stream({
                    model: modelId,
                    max_tokens: isSupportFab ? 4096 : 16000,
                    system: systemParts.map((t) => ({ type: "text", text: t })),
                    messages: loopMessages,
                    tools,
                    ...(isSupportFab
                        ? {}
                        : {
                            thinking: thinking,
                        }),
                });
                if (signal) {
                    const onAbort = () => {
                        try {
                            stream.abort();
                        }
                        catch {
                            /* ignore */
                        }
                    };
                    signal.addEventListener("abort", onAbort, { once: true });
                }
                for await (const event of stream) {
                    if (signal?.aborted) {
                        finalStatus = "cancelled";
                        break;
                    }
                    if (event.type === "message_start") {
                        providerMessageId = event.message.id;
                        const u = event.message.usage;
                        usage = mergeAnthropicUsage(usage, {
                            input_tokens: u?.input_tokens,
                            output_tokens: u?.output_tokens,
                            cache_creation_input_tokens: u?.cache_creation_input_tokens,
                            cache_read_input_tokens: u?.cache_read_input_tokens,
                            cache_creation: u
                                ?.cache_creation,
                        });
                    }
                    else if (event.type === "content_block_start") {
                        const block = event.content_block;
                        if (block.type === "tool_use") {
                            pendingToolUses.push({
                                id: block.id,
                                name: block.name,
                                inputJson: "",
                            });
                            await emit(onEvent, {
                                type: "tool_start",
                                toolName: block.name,
                                toolUseId: block.id,
                            });
                            // Instant loaders / question skeleton the moment the tool block starts 
                            // do not wait for full tool JSON or finalMessage().
                            if (block.name === "ask_clarifying_questions") {
                                await emit(onEvent, {
                                    type: "clarifying_preparing",
                                    messageId: assistantMessageId,
                                });
                            }
                            else if (block.name === "generate_images" ||
                                block.name === "create_image_presentation") {
                                const provisionalId = provisionalGenerationId(block.id);
                                await emit(onEvent, {
                                    type: "generation_start",
                                    generationId: provisionalId,
                                    kind: "image",
                                    slot: 1,
                                    total: 1,
                                    title: "Generating…",
                                });
                                await emit(onEvent, {
                                    type: "generation",
                                    generation: {
                                        id: provisionalId,
                                        kind: "image",
                                        title: "Generating…",
                                        status: "PROCESSING",
                                        outputs: {},
                                    },
                                });
                            }
                            else if (block.name === "create_document") {
                                const provisionalId = provisionalGenerationId(block.id);
                                await emit(onEvent, {
                                    type: "generation",
                                    generation: {
                                        id: provisionalId,
                                        kind: "document",
                                        title: "Creating document…",
                                        status: "PROCESSING",
                                        outputs: {},
                                    },
                                });
                            }
                            else if (block.name === "create_presentation") {
                                const provisionalId = provisionalGenerationId(block.id);
                                await emit(onEvent, {
                                    type: "generation",
                                    generation: {
                                        id: provisionalId,
                                        kind: "presentation",
                                        title: "Creating presentation…",
                                        status: "PROCESSING",
                                        outputs: {},
                                    },
                                });
                            }
                        }
                    }
                    else if (event.type === "content_block_delta") {
                        const delta = event.delta;
                        if (delta.type === "thinking_delta") {
                            reasoning += delta.thinking;
                            await emit(onEvent, { type: "reasoning_delta", text: delta.thinking });
                        }
                        else if (delta.type === "signature_delta") {
                            thinkingSignature = delta.signature;
                        }
                        else if (delta.type === "text_delta") {
                            text += delta.text;
                            await emit(onEvent, { type: "text_delta", text: delta.text });
                        }
                        else if (delta.type === "input_json_delta") {
                            const current = pendingToolUses[pendingToolUses.length - 1];
                            if (current) {
                                current.inputJson += delta.partial_json;
                                if (current.name === "generate_images" ||
                                    current.name === "create_image_presentation") {
                                    const slotCount = tryParseImageSlotCount(current.inputJson);
                                    const already = current.reservedGenerationIds?.length ?? 0;
                                    // Grow reserved slots as soon as partial JSON reveals more images.
                                    if (slotCount && slotCount > already) {
                                        current.earlySlotCount = slotCount;
                                        const ids = current.reservedGenerationIds ?? [];
                                        while (ids.length < slotCount) {
                                            ids.push(randomUUID());
                                        }
                                        current.reservedGenerationIds = ids;
                                        for (let i = already; i < slotCount; i++) {
                                            const id = ids[i];
                                            await emit(onEvent, {
                                                type: "generation_start",
                                                generationId: id,
                                                kind: "image",
                                                slot: i + 1,
                                                total: slotCount,
                                                title: `Image (${i + 1}/${slotCount})`,
                                            });
                                            await emit(onEvent, {
                                                type: "generation",
                                                generation: {
                                                    id,
                                                    kind: "image",
                                                    title: `Image (${i + 1}/${slotCount})`,
                                                    status: "PROCESSING",
                                                    outputs: {},
                                                },
                                            });
                                        }
                                    }
                                    else if (slotCount &&
                                        slotCount < already &&
                                        current.reservedGenerationIds) {
                                        // Only shrink once tool JSON is fully parseable (avoids flicker).
                                        try {
                                            JSON.parse(current.inputJson);
                                            const surplus = current.reservedGenerationIds.slice(slotCount);
                                            current.reservedGenerationIds =
                                                current.reservedGenerationIds.slice(0, slotCount);
                                            current.earlySlotCount = slotCount;
                                            if (surplus.length > 0) {
                                                await emit(onEvent, {
                                                    type: "generation_drop",
                                                    generationIds: surplus,
                                                });
                                            }
                                        }
                                        catch {
                                            /* still incomplete */
                                        }
                                    }
                                }
                                else if (current.name === "ask_clarifying_questions") {
                                    const partialQs = tryParseClarifyingQuestionsPartial(current.inputJson);
                                    const already = current.emittedClarifyingCount ?? 0;
                                    if (partialQs && partialQs.length > already) {
                                        current.emittedClarifyingCount = partialQs.length;
                                        await emit(onEvent, {
                                            type: "clarifying_questions",
                                            messageId: assistantMessageId,
                                            questions: partialQs,
                                            partial: true,
                                        });
                                    }
                                }
                            }
                        }
                    }
                    else if (event.type === "message_delta") {
                        stopReason = event.delta.stop_reason ?? stopReason;
                        if (event.usage) {
                            const u = event.usage;
                            usage = mergeAnthropicUsage(usage, {
                                input_tokens: u.input_tokens,
                                output_tokens: u.output_tokens,
                                cache_creation_input_tokens: u.cache_creation_input_tokens,
                                cache_read_input_tokens: u.cache_read_input_tokens,
                                cache_creation: u.cache_creation,
                                server_tool_use: u.server_tool_use,
                            });
                        }
                    }
                    const nowMs = Date.now();
                    if (nowMs - lastPersist > 800) {
                        lastPersist = nowMs;
                        persistPartialAssistantAsync({
                            messageId: assistantMessageId,
                            content: text,
                            reasoning,
                            status: "streaming",
                            metadata: {
                                modelId,
                                provider: ZEEPO_AI_PROVIDER,
                                thinkingSignature,
                                providerMessageId,
                            },
                        });
                    }
                }
                if (signal?.aborted || finalStatus === "cancelled") {
                    finalStatus = "cancelled";
                    break;
                }
                const finalMessage = await stream.finalMessage();
                providerMessageId = finalMessage.id;
                const fu = finalMessage.usage;
                usage = mergeAnthropicUsage(usage, {
                    input_tokens: fu.input_tokens,
                    output_tokens: fu.output_tokens,
                    cache_creation_input_tokens: fu.cache_creation_input_tokens,
                    cache_read_input_tokens: fu.cache_read_input_tokens,
                    cache_creation: fu.cache_creation,
                    server_tool_use: fu.server_tool_use,
                });
                stopReason = finalMessage.stop_reason;
                const clientToolBlocks = finalMessage.content.filter((b) => b.type === "tool_use");
                if (clientToolBlocks.length === 0 || stopReason !== "tool_use") {
                    break;
                }
                const assistantContent = finalMessage.content;
                loopMessages.push({ role: "assistant", content: assistantContent });
                const toolResults = [];
                let stopAfterClarifying = false;
                for (const block of clientToolBlocks) {
                    const toolInvocationId = randomUUID();
                    const toolStarted = Date.now();
                    const pendingMeta = pendingToolUses.find((t) => t.id === block.id);
                    const toolInsertPromise = db.insert(zeepoAiToolInvocation).values({
                        id: toolInvocationId,
                        sessionId,
                        messageId: assistantMessageId,
                        userId,
                        teamId,
                        toolName: block.name,
                        status: "running",
                        args: block.input,
                        createdAt: new Date(),
                    });
                    let resultPayload = { ok: true };
                    let ok = true;
                    try {
                        if (isSupportFab && isZeepoAiSupportGenerationTool(block.name)) {
                            ok = false;
                            resultPayload = {
                                error: "Not available in Live AI Support. Ask the user to open Zeepo AI after signing in for documents, images, or decks.",
                            };
                        }
                        else if (isSupportFab &&
                            isZeepoAiSupportInventoryTool(block.name) &&
                            (isGuestSupport || !teamId)) {
                            ok = false;
                            resultPayload = {
                                error: "Account details need a logged-in dashboard session. Ask the user to log in or use Contact us.",
                            };
                        }
                        else if (block.name === "ask_clarifying_questions") {
                            const parsed = askClarifyingQuestionsArgsSchema.safeParse(block.input);
                            if (!parsed.success) {
                                ok = false;
                                resultPayload = { error: parsed.error.message };
                            }
                            else {
                                const questions = parsed.data.questions.map((q) => ({
                                    question: q.question,
                                    options: q.options,
                                    ...(q.allow_upload ? { allow_upload: true } : {}),
                                }));
                                const intro = parsed.data.intro?.trim() ||
                                    text.trim() ||
                                    "Before I build this out, I have a couple of quick questions.";
                                if (!text.trim()) {
                                    text = intro;
                                    await emit(onEvent, { type: "text_delta", text: intro });
                                }
                                clarifyingQuestions = questions;
                                resultPayload = {
                                    status: "PRESENTED",
                                    questionCount: questions.length,
                                    message: "Questions are shown to the user. Wait for their next message with answers. Do not call other tools this turn.",
                                };
                                // Final (non-partial) emit  replace any progressive chips
                                await emit(onEvent, {
                                    type: "clarifying_questions",
                                    messageId: assistantMessageId,
                                    questions,
                                    partial: false,
                                });
                                stopAfterClarifying = true;
                            }
                        }
                        else if (stopAfterClarifying) {
                            ok = false;
                            resultPayload = {
                                error: "Skipped: clarifying questions were already presented this turn. Wait for the user.",
                            };
                        }
                        else if (block.name === "create_document") {
                            const parsed = createDocumentArgsSchema.safeParse(block.input);
                            if (!parsed.success) {
                                ok = false;
                                resultPayload = { error: parsed.error.message };
                            }
                            else {
                                const genId = randomUUID();
                                const genNow = new Date();
                                const outputs = {
                                    document: {
                                        title: parsed.data.title,
                                        content: parsed.data.content,
                                    },
                                };
                                // Emit to UI instantly  don't block on DB
                                const emitPromise = emit(onEvent, {
                                    type: "generation",
                                    generation: {
                                        id: genId,
                                        kind: "document",
                                        title: parsed.data.title,
                                        status: "COMPLETED",
                                        outputs,
                                    },
                                });
                                const dbPromise = db.insert(zeepoAiGeneration).values({
                                    id: genId,
                                    sessionId,
                                    messageId: assistantMessageId,
                                    userId,
                                    teamId,
                                    kind: "document",
                                    provider: "internal",
                                    modelId,
                                    status: "COMPLETED",
                                    prompt: parsed.data.title,
                                    inputs: {},
                                    outputs,
                                    startedAt: genNow,
                                    completedAt: genNow,
                                    createdAt: genNow,
                                    updatedAt: genNow,
                                });
                                await Promise.all([emitPromise, dbPromise]);
                                resultPayload = { status: "CREATED", generationId: genId, title: parsed.data.title };
                            }
                        }
                        else if (block.name === "create_presentation") {
                            const parsed = createPresentationArgsSchema.safeParse(block.input);
                            if (!parsed.success) {
                                ok = false;
                                resultPayload = { error: parsed.error.message };
                            }
                            else {
                                const genId = randomUUID();
                                const genNow = new Date();
                                const outputs = {
                                    presentation: {
                                        title: parsed.data.title,
                                        theme: parsed.data.theme,
                                        slides: parsed.data.slides,
                                    },
                                };
                                // Emit to UI instantly  don't block on DB
                                const emitPromise = emit(onEvent, {
                                    type: "generation",
                                    generation: {
                                        id: genId,
                                        kind: "presentation",
                                        title: parsed.data.title,
                                        status: "COMPLETED",
                                        outputs,
                                    },
                                });
                                const dbPromise = db.insert(zeepoAiGeneration).values({
                                    id: genId,
                                    sessionId,
                                    messageId: assistantMessageId,
                                    userId,
                                    teamId,
                                    kind: "presentation",
                                    provider: "internal",
                                    modelId,
                                    status: "COMPLETED",
                                    prompt: parsed.data.title,
                                    inputs: {},
                                    outputs,
                                    startedAt: genNow,
                                    completedAt: genNow,
                                    createdAt: genNow,
                                    updatedAt: genNow,
                                });
                                await Promise.all([emitPromise, dbPromise]);
                                resultPayload = {
                                    status: "CREATED",
                                    generationId: genId,
                                    title: parsed.data.title,
                                    slideCount: parsed.data.slides.length,
                                };
                            }
                        }
                        else if (block.name === "generate_images") {
                            const parsed = generateImagesArgsSchema.safeParse(block.input);
                            if (!parsed.success) {
                                ok = false;
                                resultPayload = { error: parsed.error.message };
                            }
                            else if (!process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
                                ok = false;
                                resultPayload = {
                                    error: "Image generation is temporarily unavailable. Ask the user to try again later.",
                                };
                            }
                            else {
                                if (shouldBillZeepoAiTokens({ teamId, userId, userRole })) {
                                    await assertZeepoAiCanStartTurn({ teamId, userId, userRole });
                                }
                                resultPayload = await executeGenerateImagesTool(parsed.data, {
                                    sessionId,
                                    assistantMessageId,
                                    userId,
                                    teamId,
                                    userRole,
                                    emit: onEvent,
                                    signal,
                                    reservedGenerationIds: pendingMeta?.reservedGenerationIds,
                                });
                                if (resultPayload &&
                                    typeof resultPayload === "object" &&
                                    resultPayload.status === "FAILED") {
                                    ok = false;
                                }
                            }
                        }
                        else if (block.name === "create_image_presentation") {
                            const parsed = createImagePresentationArgsSchema.safeParse(block.input);
                            if (!parsed.success) {
                                ok = false;
                                resultPayload = { error: parsed.error.message };
                            }
                            else if (!process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
                                ok = false;
                                resultPayload = {
                                    error: "Image generation is temporarily unavailable. Ask the user to try again later.",
                                };
                            }
                            else {
                                if (shouldBillZeepoAiTokens({ teamId, userId, userRole })) {
                                    await assertZeepoAiCanStartTurn({ teamId, userId, userRole });
                                }
                                resultPayload = await executeCreateImagePresentationTool(parsed.data, {
                                    sessionId,
                                    assistantMessageId,
                                    userId,
                                    teamId,
                                    userRole,
                                    emit: onEvent,
                                    signal,
                                    reservedGenerationIds: pendingMeta?.reservedGenerationIds,
                                });
                                if (resultPayload &&
                                    typeof resultPayload === "object" &&
                                    resultPayload.status === "FAILED") {
                                    ok = false;
                                }
                            }
                        }
                        else if (isZeepoAiOpsToolName(block.name)) {
                            const supportAllowed = new Set([
                                ...ZEEPO_AI_SUPPORT_CATALOG_TOOL_NAMES,
                                ...ZEEPO_AI_SUPPORT_INVENTORY_TOOL_NAMES,
                            ]);
                            if (isSupportFab && !supportAllowed.has(block.name)) {
                                ok = false;
                                resultPayload = {
                                    error: "Not available in Live AI Support.",
                                };
                            }
                            else {
                                resultPayload = await executeZeepoAiOpsTool({
                                    name: block.name,
                                    input: block.input,
                                    userId,
                                    userRole,
                                    teamId,
                                    teamName: dbTeam?.name ?? null,
                                    baseCurrency: dbTeam?.baseCurrency ?? null,
                                    sessionId,
                                    surface: isSupportFab ? "support_fab" : "zeepo_ai",
                                    ipAddress: params.ipAddress ?? null,
                                    userAgent: params.userAgent ?? null,
                                });
                                if (resultPayload &&
                                    typeof resultPayload === "object" &&
                                    "error" in resultPayload) {
                                    ok = false;
                                }
                            }
                        }
                        else {
                            ok = false;
                            resultPayload = {
                                error: `Unknown tool "${block.name}".`,
                            };
                        }
                    }
                    catch (err) {
                        ok = false;
                        resultPayload = {
                            error: err instanceof Error ? err.message : "Tool failed",
                        };
                    }
                    const rawToolError = !ok
                        ? String(resultPayload?.error ?? "failed")
                        : null;
                    const safeToolError = rawToolError
                        ? publicToolErrorMessage(rawToolError, userRole)
                        : null;
                    // Persist / SSE use sanitized errors; Anthropic tool_result keeps the raw payload.
                    const storedResult = !ok &&
                        safeToolError &&
                        resultPayload &&
                        typeof resultPayload === "object"
                        ? {
                            ...resultPayload,
                            error: safeToolError,
                        }
                        : resultPayload;
                    await toolInsertPromise;
                    await db
                        .update(zeepoAiToolInvocation)
                        .set({
                        status: ok ? "succeeded" : "failed",
                        result: storedResult,
                        errorMessage: safeToolError,
                        durationMs: Date.now() - toolStarted,
                        completedAt: new Date(),
                    })
                        .where(eq(zeepoAiToolInvocation.id, toolInvocationId));
                    await emit(onEvent, {
                        type: "tool_done",
                        toolName: block.name,
                        toolUseId: block.id,
                        ok,
                    });
                    if (isZeepoAiOpsToolName(block.name)) {
                        await emit(onEvent, {
                            type: "tool_result",
                            toolName: block.name,
                            toolUseId: block.id,
                            result: storedResult,
                        });
                    }
                    toolResults.push({
                        type: "tool_result",
                        tool_use_id: block.id,
                        content: JSON.stringify(isZeepoAiOpsToolName(block.name)
                            ? stripZeepoAiOpsToolResultForModel(resultPayload)
                            : resultPayload),
                        is_error: !ok,
                    });
                }
                if (stopAfterClarifying) {
                    break;
                }
                loopMessages.push({ role: "user", content: toolResults });
            }
        }
        catch (err) {
            if (signal?.aborted) {
                finalStatus = "cancelled";
            }
            else {
                finalStatus = "error";
                await emit(onEvent, {
                    type: "error",
                    message: publicStreamError(err, userRole),
                    code: "STREAM_ERROR",
                    recoverable: true,
                });
            }
        }
        finally {
            clearInterval(pingTimer);
        }
        // Stop: cancel in-flight media and do not soft-complete / debit chat.
        // Soft-disconnect (error while Gemini continues): keep complete when media exists.
        if (finalStatus === "cancelled") {
            const cancelling = await db.query.zeepoAiGeneration.findMany({
                where: and(eq(zeepoAiGeneration.messageId, assistantMessageId), inArray(zeepoAiGeneration.status, ["PROCESSING", "QUEUED"])),
                columns: { id: true },
            });
            if (cancelling.length > 0) {
                await db
                    .update(zeepoAiGeneration)
                    .set({
                    status: "CANCELLED",
                    errorMessage: "Cancelled by user",
                    completedAt: new Date(),
                    updatedAt: new Date(),
                })
                    .where(and(eq(zeepoAiGeneration.messageId, assistantMessageId), inArray(zeepoAiGeneration.status, ["PROCESSING", "QUEUED"])));
                for (const row of cancelling) {
                    await emit(onEvent, {
                        type: "generation_progress",
                        generationId: row.id,
                        status: "CANCELLED",
                    });
                }
            }
        }
        else if (finalStatus === "error") {
            const mediaRow = await db.query.zeepoAiGeneration.findFirst({
                where: and(eq(zeepoAiGeneration.messageId, assistantMessageId), inArray(zeepoAiGeneration.status, ["PROCESSING", "QUEUED", "COMPLETED"])),
                columns: { id: true },
            });
            if (mediaRow) {
                finalStatus = "complete";
            }
        }
        const micros = estimateZeepoAiProviderCostUsdMicros(usage);
        const tokensToDebit = providerMicrosToCustomerTokens(micros);
        let tokensDebited = 0;
        const usageEventId = randomUUID();
        await db.insert(zeepoAiUsageEvent).values({
            id: usageEventId,
            teamId,
            userId,
            sessionId,
            messageId: assistantMessageId,
            eventType: "chat_turn",
            provider: ZEEPO_AI_PROVIDER,
            modelId,
            kind: "chat",
            status: finalStatus === "complete"
                ? "succeeded"
                : finalStatus === "cancelled"
                    ? "cancelled"
                    : "failed",
            tokensDebited: String(!isSupportFab && shouldBillZeepoAiTokens({ teamId, userId, userRole }) ? tokensToDebit : 0),
            inputTokens: usage.input_tokens ?? null,
            outputTokens: usage.output_tokens ?? null,
            providerCostUsdMicros: micros,
            latencyMs: Date.now() - startedAt,
            metadata: {
                stopReason,
                providerMessageId,
                searchEnabled,
                ...(isSupportFab ? { surface: ZEEPO_AI_SUPPORT_FAB_SURFACE } : {}),
                ...anthropicUsageBillingMeta(usage),
            },
        });
        if (finalStatus === "complete" &&
            !isSupportFab &&
            shouldBillZeepoAiTokens({ teamId, userId, userRole }) &&
            teamId) {
            const debit = await debitZeepoAiTokens({
                teamId,
                userId,
                tokens: tokensToDebit,
                operationType: "chat_orchestration",
                description: `Zeepo AI chat turn`,
                sessionId,
                usageEventId,
                providerRequestId: providerMessageId,
                modelId,
                providerCostUsdMicros: micros,
            });
            tokensDebited = debit?.tokensDebited ?? 0;
        }
        else if (isZeepoAiAgencyUser(userRole)) {
            await logZeepoAiAgencyUsage({
                teamId,
                userId,
                sessionId,
                usageEventId,
                operationType: "chat_orchestration",
                modelId,
                providerRequestId: providerMessageId,
                providerCostUsdMicros: micros,
                estimatedTokens: tokensToDebit,
            });
        }
        await persistPartialAssistant({
            messageId: assistantMessageId,
            content: text,
            reasoning,
            status: finalStatus === "complete" ? "complete" : finalStatus,
            inputTokens: usage.input_tokens ?? null,
            outputTokens: usage.output_tokens ?? null,
            metadata: {
                modelId,
                provider: ZEEPO_AI_PROVIDER,
                thinkingSignature,
                providerMessageId,
                stopReason,
                usageEventId,
                interrupted: finalStatus !== "complete",
                ...(clarifyingQuestions?.length
                    ? { clarifyingQuestions }
                    : {}),
            },
        });
        await db.insert(zeepoAiActivityLog).values({
            id: randomUUID(),
            sessionId,
            userId,
            teamId,
            action: finalStatus === "complete"
                ? "message.complete"
                : finalStatus === "cancelled"
                    ? "message.cancelled"
                    : "message.error",
            description: `Assistant turn ${finalStatus}`,
            metadata: {
                modelId,
                providerMessageId,
                tokensDebited,
                inputTokens: usage.input_tokens ?? 0,
                outputTokens: usage.output_tokens ?? 0,
            },
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
        });
        await titleTask;
        await emit(onEvent, {
            type: "usage",
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            tokensDebited,
        });
        await emit(onEvent, { type: "done", status: finalStatus, stopReason });
    }
    finally {
        releaseZeepoAiSessionLock(sessionId, lockOwnerId);
    }
}
