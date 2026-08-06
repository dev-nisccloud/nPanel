"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useGenerateImage = () => {
  return trpc.imageGenStudio.ai.generateImage.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
    onSuccess: () => {
      captureEvent("image_generation_requested");
      toast.success("Image generated successfully");
    },
  });
};
