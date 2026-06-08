import type { NebBrief } from "./types";
export declare function resolveNebLogoUrl(brief: NebBrief, brandKit?: {
    logoUrl?: string | null;
}): string | null;
/**
 * Download a hotlink-protected logo and re-host on UploadThing for Replicate + email HTML.
 * Returns null if mirroring fails (caller should omit image_input rather than pass the raw URL).
 */
export declare function ensureNebLogoAccessible(logoUrl: string, websiteUrl?: string | null): Promise<string | null>;
/** Mirror logo on the brief when needed. Never returns a hotlink-only URL for Replicate. */
export declare function mirrorNebBriefLogoIfNeeded(brief: NebBrief, brandKit?: {
    logoUrl?: string | null;
}): Promise<{
    brief: NebBrief;
    replicateLogoUrl: string | null;
}>;
/** Extra instructions appended to Nano Banana when a brand logo is supplied via image_input. */
export declare function buildNanoBananaLogoDirective(logoUrl: string): string;
