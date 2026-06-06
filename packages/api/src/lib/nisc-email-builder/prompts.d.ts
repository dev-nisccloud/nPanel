import type { NebBrief } from "./types";
export declare function buildBrandContext(brief: NebBrief, brandKit?: {
    colors?: Record<string, string> | null;
    footerLegal?: string | null;
    logoUrl?: string | null;
}): string;
export declare function buildPlannerSystemPrompt(): string;
export declare function buildPlannerUserPrompt(brief: NebBrief, brandBlock: string, webContext?: string | null): string;
export declare function buildHtmlArchitectSystemPrompt(): string;
export declare function buildHtmlArchitectUserPrompt(params: {
    planJson: string;
    brandBlock: string;
    brief: NebBrief;
    creativeContext?: string;
    webContext?: string | null;
}): string;
export declare function buildRevisionSystemPrompt(): string;
export declare function buildRevisionUserPrompt(params: {
    currentHtml: string;
    userMessage: string;
    brandBlock: string;
    sessionHistory: string;
    intent: "edit" | "full_revamp";
}): string;
