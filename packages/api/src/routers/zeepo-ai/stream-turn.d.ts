export type ZeepoAiStreamEvent = {
    type: "message_start";
    userMessageId: string;
    assistantMessageId: string;
    modelId: string;
} | {
    type: "session_title";
    title: string;
} | {
    type: "reasoning_delta";
    text: string;
} | {
    type: "text_delta";
    text: string;
} | {
    type: "tool_start";
    toolName: string;
    toolUseId: string;
} | {
    type: "tool_done";
    toolName: string;
    toolUseId: string;
    ok: boolean;
} | {
    type: "tool_result";
    toolName: string;
    toolUseId: string;
    result: unknown;
} | {
    type: "clarifying_preparing";
    messageId: string;
} | {
    type: "clarifying_questions";
    messageId: string;
    questions: Array<{
        question: string;
        options: string[];
        allow_upload?: boolean;
    }>;
    /** True while tool JSON is still streaming  UI should keep the turn open. */
    partial?: boolean;
} | {
    type: "generation_start";
    generationId: string;
    kind: "image";
    slot: number;
    total: number;
    title: string;
} | {
    type: "generation_progress";
    generationId: string;
    status: string;
    slot?: number;
    total?: number;
} | {
    type: "generation";
    generation: {
        id: string;
        kind: string;
        title: string;
        status: string;
        outputs: unknown;
    };
} | {
    /** Drop early-reserved loaders that weren't used in the final tool run. */
    type: "generation_drop";
    generationIds: string[];
} | {
    type: "usage";
    inputTokens: number;
    outputTokens: number;
    tokensDebited: number;
} | {
    type: "error";
    message: string;
    code?: string;
    recoverable?: boolean;
} | {
    type: "done";
    status: "complete" | "cancelled" | "error";
    stopReason?: string | null;
} | {
    type: "ping";
};
export type StreamZeepoAiTurnParams = {
    sessionId: string;
    content: string;
    userId: string;
    userRole: string | null | undefined;
    teamId?: string | null;
    skillId?: string | null;
    searchEnabled?: boolean;
    attachmentIds?: string[];
    modelId?: string | null;
    replaceFromUserMessageId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    signal?: AbortSignal;
    onEvent: (event: ZeepoAiStreamEvent) => void | Promise<void>;
};
export declare function streamZeepoAiTurn(params: StreamZeepoAiTurnParams): Promise<void>;
