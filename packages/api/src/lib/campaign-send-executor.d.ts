export interface ExecuteCampaignSendResult {
    sentCount: number;
    failedCount: number;
    totalRecipients: number;
}
/** Options for executeCampaignSend (e.g. from QStash worker). */
export interface ExecuteCampaignSendOptions {
    /** When set, Resend batch requests use this + batch index as idempotency key so retries don't duplicate sends. */
    sendJobId?: string;
}
/**
 * Execute the actual campaign send: Resend batches + update CampaignRecipient.resendId.
 * Does NOT update EmailCampaign status or EmailCampaignSendJob status (caller does that).
 * Pass sendJobId so each batch uses an idempotency key (campaign-send/${sendJobId}/${batchIndex}); Resend returns cached response on retry and does not re-send.
 * @throws if campaign not found, no content, domain not verified, or no recipients
 */
export declare function executeCampaignSend(campaignId: string, options?: ExecuteCampaignSendOptions): Promise<ExecuteCampaignSendResult>;
