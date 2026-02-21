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
 * QStash job payload for NISC order processing (immediate)
 */
export interface NiscOrderJobPayload {
	niscOrderId: string;
}

/**
 * QStash job result for NISC order processing
 */
export interface NiscOrderJobResult {
	messageId: string;
}

