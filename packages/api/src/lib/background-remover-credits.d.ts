export type BackgroundRemoverCreditsResult = {
    subscriptionId: string;
    subscriptionUsageId: string;
    credits: number | null;
};
/**
 * Get the active Background Remover subscription usage for a team (by teamId).
 * Returns subscription id, usage row id, and parsed credits (null = unlimited).
 * Returns null if no active subscription or no usage row.
 */
export declare function getBackgroundRemoverCreditsForTeam(teamId: string): Promise<BackgroundRemoverCreditsResult | null>;
/**
 * Deduct one credit from a subscription usage row and log.
 * Call after a background removal is successfully saved to UploadThing + DB.
 * If credits are unlimited (null), no update is performed.
 */
export declare function deductOneBackgroundRemoverCredit(params: {
    subscriptionUsageId: string;
    userId: string;
    metadata?: {
        generationId?: string;
    };
}): Promise<void>;
/**
 * Resolve team's Background Remover usage and deduct one credit.
 * No-op if teamId is null, no subscription/usage, or credits are unlimited.
 * Call from worker after a removal is successfully saved to UploadThing + DB.
 */
export declare function deductOneCreditForTeamBackgroundRemover(params: {
    teamId: string | null;
    userId: string;
    metadata?: {
        generationId?: string;
    };
}): Promise<void>;
