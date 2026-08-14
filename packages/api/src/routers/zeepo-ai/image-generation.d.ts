import type { CreateImagePresentationArgs, GenerateImagesArgs } from "./image-schemas";
/** Subset of stream events emitted by image tools (avoids circular import with stream-turn). */
export type ZeepoAiImageStreamEvent = {
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
    slot: number;
    total: number;
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
    type: "generation_drop";
    generationIds: string[];
};
/** Reuse early-reserved IDs for the first `count` slots; return unused extras to drop. */
export declare function takeReservedGenerationIds(reserved: string[] | undefined, count: number): {
    ids: string[];
    surplus: string[];
};
type EmitFn = (event: ZeepoAiImageStreamEvent) => void | Promise<void>;
type RunContext = {
    sessionId: string;
    assistantMessageId: string;
    userId: string;
    teamId: string | null;
    userRole: string | null | undefined;
    emit: EmitFn;
    signal?: AbortSignal;
    /** Pre-reserved generation IDs emitted while the tool JSON was still streaming. */
    reservedGenerationIds?: string[];
};
export declare function executeGenerateImagesTool(args: GenerateImagesArgs, ctx: RunContext): Promise<Record<string, unknown>>;
export declare function executeCreateImagePresentationTool(args: CreateImagePresentationArgs, ctx: RunContext): Promise<Record<string, unknown>>;
/** Mark orphan PROCESSING/QUEUED generations older than maxAgeMs as FAILED. */
export declare function failStaleZeepoAiGenerations(sessionId: string, 
/** Align with ~30m SSE proxy budget (+ buffer). */
maxAgeMs?: number): Promise<number>;
export {};
