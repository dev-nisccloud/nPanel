import type { NebBrief } from "./types";
export type RunNebBuildParams = {
    jobId: string;
    designId: string;
    brief: NebBrief;
    brandKit?: {
        colors?: Record<string, string> | null;
        footerLegal?: string | null;
        logoUrl?: string | null;
    };
    userId: string;
    teamId?: string | null;
};
export type RunNebRevisionParams = {
    jobId: string;
    designId: string;
    userMessage: string;
    currentHtml: string;
    brief: NebBrief;
    brandKit?: RunNebBuildParams["brandKit"];
    userId: string;
    teamId?: string | null;
    sessionHistory: string;
    intent: "edit" | "full_revamp";
};
export type RunNebBuildEmailParams = RunNebBuildParams & {
    creativeDesignUrl: string;
    designNotes?: string;
    webContext?: string | null;
    /** INITIAL first build, BUILD_RETRY regeneration from approved creative */
    buildTrigger?: "INITIAL" | "BUILD_RETRY";
};
export declare function runNebBuildEmail(params: RunNebBuildEmailParams): Promise<{
    assistantText: string;
    subject: string;
    preheader: string;
}>;
export type RunNebDirectBuildParams = RunNebBuildParams & {
    webContext?: string | null;
};
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
export declare function runNebDirectBuild(params: RunNebDirectBuildParams): Promise<{
    assistantText: string;
    subject: string;
    preheader: string;
    selectedTemplates: string[];
}>;
/** Full rebuild from brief + user revamp instructions; replaces current HTML. */
export declare function runNebChatFullRevamp(params: RunNebDirectBuildParams & {
    userMessage: string;
    previousHtml: string;
}): Promise<{
    assistantText: string;
    subject: string;
    preheader: string;
    selectedTemplates: string[];
}>;
export declare function runNebRevision(params: RunNebRevisionParams): Promise<{
    assistantText: string;
}>;
