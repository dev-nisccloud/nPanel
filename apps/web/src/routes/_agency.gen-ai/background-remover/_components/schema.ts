import { z } from "zod";

// Background Remover Generation Schema (for UI)
export const backgroundRemoverGenerationSchema = z.object({
  id: z.string(),
  originalImageUrl: z.string().url(),
  originalImageFileName: z.string(),
  originalImageMimeType: z.string(),
  processedImageUrl: z.string().url(),
  processedImageFileName: z.string(),
  processedImageMimeType: z.string(),
  createdAt: z.string(),
});

export type BackgroundRemoverGeneration = z.infer<typeof backgroundRemoverGenerationSchema>;
