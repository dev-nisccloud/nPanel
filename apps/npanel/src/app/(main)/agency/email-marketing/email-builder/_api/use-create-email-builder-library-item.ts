"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useCreateEmailBuilderLibraryItem = () => {
  const utils = trpc.useUtils();

  return trpc.emailBuilderLibrary.createFromUpload.useMutation({
    onSuccess: () => {
      // Invalidate list so any future library views stay fresh
      utils.emailBuilderLibrary.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save image to library");
    },
  });
};

