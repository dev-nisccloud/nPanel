import Replicate from "replicate";
import { z } from "zod";
import type { ZeepoModel } from "../zeepo-canvas/models";
import { type CompletedReplicatePrediction } from "../../lib/zeepo-agent-replicate";
export declare const clarifyingQuestionSchema: z.ZodObject<{
    question: z.ZodString;
    options: z.ZodArray<z.ZodString>;
    allow_upload: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;
export type AgentOrchestrationMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCalls?: unknown;
    toolCallId?: string | null;
    /** First image URL from user-attached files - passed to vision-capable models. */
    imageUrl?: string;
};
export type AgentToolCall = {
    name: string;
    arguments: Record<string, unknown>;
};
export declare function stripCodeFences(raw: string): string;
export declare function collectTextOutput(output: unknown): Promise<string>;
export type ParsedOrchestrationResult = {
    ok: true;
    assistant_text: string;
    tool_calls: AgentToolCall[];
    clarifying_questions?: ClarifyingQuestion[];
} | {
    ok: false;
    raw: string;
};
export declare function parseOrchestrationResponse(raw: string): ParsedOrchestrationResult;
export declare function serializeAgentTurnPrompt(messages: AgentOrchestrationMessage[], jsonInstruction: string): {
    systemBlock: string;
    userBlock: string;
};
export declare const ORCHESTRATION_JSON_INSTRUCTION = "Your reply MUST be a single valid JSON object - no markdown, no fences, no commentary before or after. Use this exact shape:\n{\n  \"assistant_text\": \"string - the markdown reply shown to the user. Empty string only when tool_calls is non-empty AND the tool result will explain everything on its own.\",\n  \"tool_calls\": [\n    {\n      \"name\": \"create_document\" | \"check_domain_availability\" | \"web_search\" | \"list_models\" | \"run_media_generation\",\n      \"arguments\": { /* tool-specific object as documented */ }\n    }\n  ],\n  \"clarifying_questions\": [\n    {\n      \"question\": \"string - a single, specific question\",\n      \"options\": [\"Option A\", \"Option B\", \"Option C\"],\n      \"allow_upload\": false\n    }\n  ]\n}\nRules:\n- \"tool_calls\": [] when no tool is needed this turn.\n- \"clarifying_questions\" is OPTIONAL. Include it ONLY when you genuinely need 1\u20133 short, specific answers before you can produce a good result - and ONLY when there are no tool_calls in the same reply. Each entry is one question with 2\u20135 concise option labels (do NOT include \"Other\" - the UI adds it automatically). Never produce clarifying_questions AND tool_calls in the same reply.\n- Set \"allow_upload\": true on a question when the answer could be an image/file the user provides (e.g. \"Do you have a logo?\"). The UI will show an \"Upload file\" chip. The user's uploaded URL is then available as an attachment in the next message.\n- IMPORTANT: when calling create_document, the full markdown content goes inside arguments.content - write the COMPLETE document there; do not truncate.\n- Do NOT include clarifying_questions on follow-up turns after the user already answered - proceed with what you have.\n- Do NOT include any other top-level keys. Do NOT prepend \"Sure\" or \"Here is\".\n- In assistant_text, never expose technical ids: no generationId, no UUIDs, no \"(ID: \u2026)\" or \"job id\" strings - the product UI already tracks jobs.";
export type ZeepoOrchestrationPredictionHandler = (prediction: CompletedReplicatePrediction, modelId: string) => Promise<void>;
export declare function runOrchestrationTurnWithRepair(params: {
    replicate: Replicate;
    model: ZeepoModel;
    messages: AgentOrchestrationMessage[];
    maxMs: number;
    maxTokens: number;
    onPrediction?: ZeepoOrchestrationPredictionHandler;
}): Promise<{
    parsed: ParsedOrchestrationResult;
    rawAttempts: string[];
    repairUsed: boolean;
}>;
export declare function toolCallSignature(tc: AgentToolCall): string;
