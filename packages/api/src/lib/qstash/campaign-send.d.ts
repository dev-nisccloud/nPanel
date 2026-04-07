import type { CampaignSendJobResult } from "./types";
/**
 * Enqueue a campaign send job with QStash.
 * - If scheduledFor is provided and in the future, uses notBefore for that time.
 * - Otherwise delivers immediately.
 */
export declare function enqueueCampaignSend(campaignId: string, sendJobId: string, scheduledFor?: Date | null): Promise<CampaignSendJobResult>;
/**
 * Cancel a scheduled campaign send (QStash message).
 * Does not throw if message is not found (e.g. already executed).
 */
export declare function cancelCampaignSend(messageId: string): Promise<void>;
