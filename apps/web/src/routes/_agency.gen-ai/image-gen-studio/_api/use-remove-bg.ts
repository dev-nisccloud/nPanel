"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useRemoveBg = () => {
  return trpc.imageGenStudio.ai.removeBg.useMutation({
    onSuccess: () => {
      captureEvent("image_gen_background_removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove background");
    },
  });
};
