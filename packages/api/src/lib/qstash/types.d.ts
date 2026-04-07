/**
 * QStash job payload for content calendar publishing
 */
export interface PublishContentJobPayload {
    postId: string;
    pageTokenId: string;
}
/**
 * QStash job result
 */
export interface QStashJobResult {
    messageId: string;
    scheduledFor?: number;
}
/**
 * QStash job payload for campaign send (immediate or scheduled)
 */
export interface CampaignSendJobPayload {
    campaignId: string;
    sendJobId: string;
}
/**
 * QStash job result for campaign send
 */
export interface CampaignSendJobResult {
    messageId: string;
    scheduledFor?: number;
}
/**
 * QStash job payload for Nisc order processing (immediate)
 */
export interface NiscOrderJobPayload {
    niscOrderId: string;
}
/**
 * QStash job result for Nisc order processing
 */
export interface NiscOrderJobResult {
    messageId: string;
}
/**
 * QStash job payload for image generator (immediate, no schedule)
 */
export interface ImageGeneratorJobPayload {
    generationId: string;
}
/**
 * QStash job result for image generator
 */
export interface ImageGeneratorJobResult {
    messageId: string;
}
/**
 * QStash job payload for background remover (immediate, no schedule)
 */
export interface BackgroundRemoverJobPayload {
    generationId: string;
}
/**
 * QStash job result for background remover
 */
export interface BackgroundRemoverJobResult {
    messageId: string;
}
/**
 * QStash job payload for NISC email marketing global dispatcher
 */
export interface NiscEmDispatchJobPayload {
    kind: "NISC_EM_DISPATCH";
}
/**
 * QStash job result for NISC email marketing global dispatcher
 */
export interface NiscEmDispatchJobResult {
    messageId: string;
    scheduledFor?: number;
}
