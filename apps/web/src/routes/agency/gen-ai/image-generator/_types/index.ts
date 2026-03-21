/**
 * UI layer only – independent from API/DB.
 * Types and enums for the image generator feature.
 */

export const GENERATION_STATUS = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type GenerationStatus = (typeof GENERATION_STATUS)[keyof typeof GENERATION_STATUS];

export const VARIATION_STATUS = {
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type VariationStatus = (typeof VARIATION_STATUS)[keyof typeof VARIATION_STATUS];

export interface VariationView {
  id: string;
  variationIndex: number;
  status: VariationStatus;
  errorMessage: string | null;
  imageUrl: string | null;
  imageMimeType: string | null;
}

export interface GenerationView {
  id: string;
  prompt: string;
  createdAt: Date;
  status: GenerationStatus;
  errorMessage: string | null;
  variationsCount: number;
  variations: VariationView[];
}

/**
 * Transform API response to UI view (API shape → UI shape).
 */
export function apiGenerationsToView(apiData?: {
  data?: Array<{
    id: string;
    prompt: string;
    createdAt: Date | string;
    status: string;
    errorMessage?: string | null;
    variationsCount: number;
    variations?: Array<{
      id: string;
      variationIndex: number;
      status: string;
      errorMessage?: string | null;
      imageUrl?: string | null;
      imageMimeType?: string | null;
    }>;
  }>;
}): GenerationView[] {
  const raw = apiData?.data;
  if (!Array.isArray(raw)) return [];

  return raw.map((gen) => ({
    id: String(gen.id),
    prompt: String(gen.prompt),
    createdAt: gen.createdAt instanceof Date ? gen.createdAt : new Date(gen.createdAt),
    status: (gen.status as GenerationStatus) ?? "QUEUED",
    errorMessage: gen.errorMessage ?? null,
    variationsCount: Number(gen.variationsCount) || 0,
    variations: (gen.variations ?? []).map((v) => ({
      id: String(v.id),
      variationIndex: Number(v.variationIndex) || 0,
      status: (v.status as VariationStatus) ?? "PROCESSING",
      errorMessage: v.errorMessage ?? null,
      imageUrl: v.imageUrl && typeof v.imageUrl === "string" ? v.imageUrl : null,
      imageMimeType: v.imageMimeType ?? null,
    })),
  }));
}

export function hasInProgressGenerations(generations: GenerationView[]): boolean {
  return generations.some(
    (g) => g.status === "QUEUED" || g.status === "PROCESSING",
  );
}
