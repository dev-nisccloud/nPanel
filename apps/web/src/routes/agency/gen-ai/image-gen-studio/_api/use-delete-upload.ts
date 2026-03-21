"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteUpload = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.uploads.delete.useMutation({
    onSuccess: () => {
      utils.imageGenStudio.uploads.list.invalidate();
      toast.success("Upload deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete upload");
    },
  });
};
