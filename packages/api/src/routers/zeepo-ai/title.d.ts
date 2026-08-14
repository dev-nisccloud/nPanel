/**
 * Claude-style chat naming: short title from the first user message.
 * Idempotent via session.metadata.autoTitled.
 */
export declare function maybeAutoTitleZeepoAiSession(params: {
    sessionId: string;
    userId: string;
    userMessage: string;
    /** When false, skip (e.g. not the first user turn). */
    eligible: boolean;
}): Promise<string | null>;
