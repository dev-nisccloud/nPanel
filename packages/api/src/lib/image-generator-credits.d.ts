export type AiImageGeneratorCreditsResult = {
    subscriptionId: string;
    subscriptionUsageId: string;
    credits: number | null;
};
/**
 * Get the active AI Image Generator subscription usage for a team (by teamId).
 * Returns subscription id, usage row id, and parsed credits (null = unlimited).
 * Returns null if no active subscription or no usage row.
 */
export declare function getAiImageGeneratorCreditsForTeam(teamId: string): Promise<AiImageGeneratorCreditsResult | null>;
/**
 * Deduct one credit from a subscription usage row and log.
 * Call after a variation is successfully saved to UploadThing + DB.
 * If credits are unlimited (null), no update is performed.
 * Non-blocking: single update + one log insert; run after the main work.
 */
export declare function deductOneImageGeneratorCredit(params: {
    subscriptionUsageId: string;
    userId: string;
    metadata?: {
        generationId?: string;
        variationId?: string;
    };
}): Promise<void>;
/**
 * Resolve team's AI Image Generator usage and deduct one credit.
 * No-op if teamId is null, no subscription/usage, or credits are unlimited.
 * Call from webhook after a variation is successfully saved to UploadThing + DB.
 */
export declare function deductOneCreditForTeamImageGenerator(params: {
    teamId: string | null;
    userId: string;
    metadata?: {
        generationId?: string;
        variationId?: string;
    };
}): Promise<void>;
