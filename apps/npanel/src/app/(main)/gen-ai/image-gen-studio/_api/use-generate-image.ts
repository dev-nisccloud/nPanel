"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useGenerateImage = () => {
  return trpc.imageGenStudio.ai.generateImage.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
  });
};
