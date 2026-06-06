import Replicate from "replicate";
import { z } from "zod";
/** Must match Creative Asset Analyzer configuration in UI / DB `model`. */
export declare const CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL = "anthropic/claude-4.5-haiku";
export declare const creativeAssetImageAnalysisDetailSchema: z.ZodObject<{
    headline: z.ZodString;
    modelLabel: z.ZodOptional<z.ZodString>;
    overallRatingScaleMax: z.ZodCatch<z.ZodCoercedNumber<unknown>>;
    overallRatingValue: z.ZodCoercedNumber<unknown>;
    overallRatingReason: z.ZodString;
    overallRatingBand: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>>;
    confidenceScore: z.ZodOptional<z.ZodUnion<readonly [z.ZodCoercedNumber<unknown>, z.ZodNull]>>;
    ratingSummary: z.ZodString;
    overallSummary: z.ZodString;
    scores: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        value: z.ZodCoercedNumber<unknown>;
        max: z.ZodCoercedNumber<unknown>;
        note: z.ZodString;
    }, z.core.$strip>>;
    sections: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        body: z.ZodString;
    }, z.core.$strip>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CreativeAssetImageAnalysisDetail = z.infer<typeof creativeAssetImageAnalysisDetailSchema>;
export declare function stripOuterCodeFence(raw: string): string;
export declare function collectTextOutput(output: unknown): Promise<string>;
export declare function buildCreativeAssetImageAnalysisSystemPrompt(): string;
export declare function buildCreativeAssetImageAnalysisUserPrompt(ctx: {
    fileName: string;
    mimeType: string;
    internalVersionNumber: number;
    userContext?: string | null;
}): string;
export declare function parseCreativeAssetImageAnalysisJson(rawText: string): CreativeAssetImageAnalysisDetail;
export declare function invokeCreativeAssetImageAnalysis(params: {
    replicate: Replicate;
    imageUrl: string;
    fileName: string;
    mimeType: string;
    internalVersionNumber: number;
    userContext?: string | null;
    maxMs?: number;
}): Promise<{
    rawText: string;
    detail: CreativeAssetImageAnalysisDetail;
}>;
