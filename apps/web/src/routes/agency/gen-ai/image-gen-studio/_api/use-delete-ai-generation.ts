"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteAiGeneration = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.aiGenerations.delete.useMutation({
    onSuccess: () => {
      toast.success("Generation deleted successfully");
      // Invalidate queries to refresh the list
      utils.imageGenStudio.aiGenerations.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete generation");
    },
  });
};
