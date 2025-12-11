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

