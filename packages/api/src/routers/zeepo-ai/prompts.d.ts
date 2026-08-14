export type ZeepoAiSessionContext = {
    nowIso: string;
    user: {
        name: string | null;
        email: string | null;
    };
    team: {
        id: string | null;
        name: string | null;
        slug: string | null;
        baseCurrency: string | null;
    };
    sessionTitle: string | null;
    sessionCreatedAtIso: string;
    turnCount: number;
    searchEnabled: boolean;
};
/**
 * Identity + security system prompt for Zeepo AI.
 * Forked from Zeepo Agent prompts with Nisc Cloud framed as the provider
 * (not a broker/middleman) and without naming underlying vendors/tech.
 */
export declare function buildZeepoAiIdentityPrompt(): string;
export declare function buildZeepoAiSessionContextBlock(ctx: ZeepoAiSessionContext): string;
export declare function buildZeepoAiSkillBlock(directives: string): string;
export type ZeepoAiSessionAsset = {
    url: string;
    name: string;
    mimeType: string;
};
export declare function buildZeepoAiSessionAssetsBlock(uploads: ZeepoAiSessionAsset[]): string | null;
/**
 * Overlay for the FAB Live AI Support surface. Keeps Nisc Cloud identity /
 * competitor rules from the main prompt; replaces length, generation, and thinking.
 */
export declare function buildZeepoAiSupportOverlayPrompt(mode: "guest" | "customer"): string;
