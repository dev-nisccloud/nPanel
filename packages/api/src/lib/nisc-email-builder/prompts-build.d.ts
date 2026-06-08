import type { NebBrief } from "./types";
export declare const SPEC_END_MARKER = "<<<END_NEB_DESIGN_SPEC>>>";
export declare const SPEC_START_MARKER = "<<<NEB_DESIGN_SPEC>>>";
export declare const SPEC_META_START = "<<<NEB_SPEC_META>>>";
export declare const SPEC_META_END = "<<<END_NEB_SPEC_META>>>";
export declare function buildCreativeSpecSystemPrompt(): string;
export declare function buildCreativeSpecUserPrompt(params: {
    brief: NebBrief;
    brandBlock: string;
    creativeDesignUrl: string;
    designNotes?: string;
    webContext?: string | null;
}): string;
export declare function buildCreativeSpecContinuationSystemPrompt(): string;
export declare function buildCreativeSpecContinuationUserPrompt(params: {
    partialSpec: string;
    creativeDesignUrl: string;
}): string;
export declare function buildHtmlFromSpecPrompt(params: {
    designSpecification: string;
    specMetaJson: string;
    brandBlock: string;
    creativeDesignUrl: string;
}): string;
export declare function buildHtmlContinuationPrompt(params: {
    designSpecification: string;
    specMetaJson: string;
    brandBlock: string;
    partialHtml: string;
}): string;
export declare function buildDirectHtmlSystemPrompt(): string;
export declare function buildDirectHtmlUserPrompt(params: {
    brief: NebBrief;
    brandBlock: string;
    webContext?: string | null;
    templateRefs: Array<{
        name: string;
        filename: string;
        html: string;
    }>;
}): string;
export declare function buildDirectHtmlContinuationPrompt(params: {
    briefSummary: string;
    brandBlock: string;
    partialHtml: string;
}): string;
