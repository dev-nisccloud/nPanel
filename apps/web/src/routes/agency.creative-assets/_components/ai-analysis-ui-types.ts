/**
 * UI shape for creative asset AI analysis - mirrors API `detail` from
 * `creativeAssets.runAiImageAnalysis` / `listAiImageAnalyses`.
 */
export type CreativeAssetAiAnalysisDetailView = {
  headline: string;
  modelLabel: string;
  overallRatingScaleMax: number;
  overallRatingValue: number;
  overallRatingReason: string;
  overallRatingBand: string | null;
  confidenceScore: number | null;
  ratingSummary: string;
  overallSummary: string;
  scores: Array<{
    id: string;
    label: string;
    value: number;
    max: number;
    note: string;
  }>;
  sections: Array<{ title: string; body: string }>;
  recommendations: string[];
};

export type CreativeAssetAiHistoryRowView = {
  id: string;
  createdAtLabel: string;
  versionLabel: string;
  summary: string;
  status: string;
  /** Error text (FAILED) or extra line */
  detail?: string;
  overallRatingValue?: number;
  overallRatingScaleMax?: number;
  overallRatingBand?: string | null;
  userContext?: string | null;
  analysisDetail?: CreativeAssetAiAnalysisDetailView | null;
};
