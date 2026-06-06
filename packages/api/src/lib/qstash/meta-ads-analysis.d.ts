import type { MetaAdsAnalysisJobResult } from "./types";
/**
 * Enqueue an AI analysis job for Meta Ads via QStash.
 */
export declare function enqueueMetaAdsAnalysis(analysisId: string, data: any): Promise<MetaAdsAnalysisJobResult>;
