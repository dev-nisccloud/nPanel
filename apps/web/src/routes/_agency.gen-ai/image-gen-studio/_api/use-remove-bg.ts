"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useRemoveBg = () => {
  return trpc.imageGenStudio.ai.removeBg.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to remove background");
    },
  });
};
