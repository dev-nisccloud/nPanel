export type BrandColorRole = "primary" | "accent" | "secondary";
export type BrandPalette = Record<BrandColorRole, string | null>;
export type WebsiteBrandEnrichment = {
    websiteUrl: string;
    hostname: string;
    logoUrl: string | null;
    logoSource: string | null;
    /** Ordered: primary, accent, secondary (only set roles included). */
    brandColors: string[];
    brandPalette: BrandPalette;
    colorSources: string[];
    siteName: string | null;
    /** On-page meta description when available. */
    onPageDescription: string | null;
    /** Combined research for UI (markdown). */
    companyContext: string | null;
    webSearchConducted: boolean;
    webSearchFound: boolean;
    /** Full block for creative director / planner prompts. */
    webContext: string | null;
    warnings: string[];
};
export declare function paletteToColorArray(palette: BrandPalette): string[];
export declare function colorsToPalette(colors: string[]): BrandPalette;
export declare function normalizeWebsiteUrl(input: string): string;
export declare function assertSafeWebsiteUrl(websiteUrl: string): Promise<URL>;
export declare function cleanSiteName(raw: string | null | undefined, hostname: string): string;
export declare function formatCompanyContextForUi(sections: string[]): string | null;
/**
 * Fetch a public website and extract logo URL + brand colors using ordered fallbacks.
 * Never throws for enrichment failures - returns partial results and warnings instead.
 */
export declare function enrichWebsiteBrand(websiteUrlInput: string, options?: {
    companyHint?: string;
}): Promise<WebsiteBrandEnrichment>;
/** User provided at least one non-empty brand color in the brief. */
export declare function nebBriefHasUserBrandColors(brandColors?: string[]): boolean;
export declare function nebBriefHasUserCompanyName(companyName?: string): boolean;
export declare function nebBriefHasUserCompanyContext(companyContext?: string): boolean;
export declare function nebBriefHasUserLogo(logoUrl?: string): boolean;
/**
 * Fill gaps from website detection only - never overwrite values the user set in the brief form.
 */
export declare function mergeBrandEnrichment(brief: {
    companyName?: string;
    productName?: string;
    audience?: string;
    goal?: string;
    tone?: string;
    emailType?: string;
    instructions?: string;
    brandColors?: string[];
    ctaUrl?: string;
    websiteUrl?: string;
    logoUrl?: string;
    companyContext?: string;
    webSearchFound?: boolean;
}, enrichment: WebsiteBrandEnrichment): typeof brief;
/** Unified brand block: logo, palette, and company research for AI agents. */
export declare function buildBrandAgentContext(brief: {
    companyName?: string;
    websiteUrl?: string;
    logoUrl?: string;
    brandColors?: string[];
}, enrichment: WebsiteBrandEnrichment | null): string | null;
/** @deprecated Use buildBrandAgentContext */
export declare function formatWebContextForPrompt(enrichment: WebsiteBrandEnrichment, brief?: Parameters<typeof buildBrandAgentContext>[0]): string | null;
