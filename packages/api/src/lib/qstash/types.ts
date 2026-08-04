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
 * QStash job payload for Nisc email marketing campaign-scoped dispatcher.
 */
export interface NiscEmDispatchJobPayload {
	kind: "NISC_EM_DISPATCH";
	campaignId: string;
}

/**
 * QStash job result for Nisc email marketing global dispatcher
 */
export interface NiscEmDispatchJobResult {
	messageId: string;
	scheduledFor?: number;
}


/**
 * QStash job payload for Zeepo Canvas generation (immediate, no schedule)
 */
export interface ZeepoCanvasJobPayload {
	generationId: string;
}

/**
 * QStash job result for Zeepo Canvas generation
 */
export interface ZeepoCanvasJobResult {
	messageId: string;
}

/** QStash job payload for Zeepo Agent generation */
export interface ZeepoAgentJobPayload {
	generationId: string;
}

export interface ZeepoAgentJobResult {
	messageId: string;
}
/**
 * QStash job payload for Email Builder AI generation (immediate, no schedule)
 */
export interface EmailBuilderAiJobPayload {
	designId: string;
}

/**
 * QStash job result for Email Builder AI generation
 */
export interface EmailBuilderAiJobResult {
	messageId: string;
}

/**
 * QStash job payload for Meta Ads analysis (immediate, no schedule)
 */
export interface MetaAdsAnalysisJobPayload {
	analysisId: string;
	data: any;
}

/**
 * QStash job result for Meta Ads analysis
 */
export interface MetaAdsAnalysisJobResult {
	messageId: string;
}

/** Nisc Email Builder (neb) - multi-agent HTML build */
export interface NebBuildJobPayload {
	jobId: string;
}

export interface NebBuildJobResult {
	messageId: string;
}
