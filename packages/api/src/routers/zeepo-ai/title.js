import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { zeepoAiSession } from "@npanel/db/schema/zeepo-ai";
const TITLE_MAX = 80;
function heuristicTitle(text) {
    const cleaned = text
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    const words = cleaned.split(" ").filter(Boolean).slice(0, 6);
    if (!words.length)
        return "New chat";
    const first = words[0];
    words[0] = first.charAt(0).toUpperCase() + first.slice(1);
    return words.join(" ").replace(/[.!?,;:]+$/g, "").slice(0, TITLE_MAX);
}
function sanitizeGeneratedTitle(raw) {
    return raw
        .trim()
        .replace(/^["'`“”]+|["'`“”]+$/g, "")
        .replace(/\s+/g, " ")
        .replace(/[.!?,;:]+$/g, "")
        .slice(0, TITLE_MAX);
}
function resolveTitleModelId() {
    return (process.env.ZEEPO_AI_TITLE_MODEL_ID?.trim() ||
        process.env.ZEEPO_AI_CHAT_MODEL_ID?.trim() ||
        "claude-haiku-4-5");
}
/**
 * Claude-style chat naming: short title from the first user message.
 * Idempotent via session.metadata.autoTitled.
 */
export async function maybeAutoTitleZeepoAiSession(params) {
    if (!params.eligible)
        return null;
    const userMessage = params.userMessage.trim();
    if (!userMessage)
        return null;
    const session = await db.query.zeepoAiSession.findFirst({
        where: and(eq(zeepoAiSession.id, params.sessionId), eq(zeepoAiSession.userId, params.userId)),
        columns: { id: true, title: true, metadata: true },
    });
    if (!session)
        return null;
    const meta = (session.metadata ?? {});
    if (meta.autoTitled === true)
        return null;
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    let title = "";
    if (apiKey) {
        try {
            const client = new Anthropic({ apiKey });
            const response = await client.messages.create({
                model: resolveTitleModelId(),
                max_tokens: 40,
                system: "You name chats. Reply with ONLY a short title: 3 to 6 words, sentence case, no quotes, no trailing punctuation. Capture the user's intent.",
                messages: [
                    {
                        role: "user",
                        content: `Name this chat based on the user's first message:\n\n${userMessage.slice(0, 600)}`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === "text");
            if (block && block.type === "text") {
                title = sanitizeGeneratedTitle(block.text);
            }
        }
        catch {
            /* fall through to heuristic */
        }
    }
    if (!title)
        title = heuristicTitle(userMessage);
    if (!title || title === "New chat")
        return null;
    await db
        .update(zeepoAiSession)
        .set({
        title,
        metadata: { ...meta, autoTitled: true },
        updatedAt: new Date(),
    })
        .where(eq(zeepoAiSession.id, params.sessionId));
    return title;
}
