export type AgentSessionContext = {
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
};
export declare function buildAgentIdentityPrompt(): string;
export declare function buildSessionContextBlock(ctx: AgentSessionContext): string;
export type RecentGenerationSummary = {
    id: string;
    status: string;
    modelCategory: string;
    modelId: string;
    prompt: string | null;
    previewUrl: string | null;
    errorMessage: string | null;
    createdAtIso: string;
};
export declare function buildRecentGenerationsBlock(rows: RecentGenerationSummary[]): string | null;
export type SessionAttachment = {
    url: string;
    name: string;
    mimeType: string;
};
/**
 * Builds a persistent SESSION ASSETS block that lists every file the user has uploaded
 * in this session AND every completed generation image - so the model always has a full
 * index of available assets no matter how many turns have passed.
 */
export declare function buildSessionAssetsBlock(uploads: SessionAttachment[], generations: RecentGenerationSummary[]): string | null;
export declare function buildSkillSystemBlock(skill: {
    id: string;
    title: string;
    directives: string;
}): string;
