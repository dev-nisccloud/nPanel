"use client";

import posthog from "posthog-js";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useGenerateImage = () => {
  return trpc.imageGenStudio.ai.generateImage.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
    onSuccess: () => {
      if (
        import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN &&
        import.meta.env.VITE_PUBLIC_POSTHOG_HOST
      ) {
        posthog.capture("image_generation_requested");
      }
      toast.success("Image generated successfully");
    },
  });
};
