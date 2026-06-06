import type { NebBrief } from "./types";
export declare function buildCreativeDirectorSystemPrompt(): string;
export declare function buildCreativeDirectorUserPrompt(brief: NebBrief, brandBlock: string, userFeedback?: string, webContext?: string | null): string;
export declare function buildChatOrchestratorSystemPrompt(): string;
