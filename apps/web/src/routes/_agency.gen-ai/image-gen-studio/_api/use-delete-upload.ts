"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteUpload = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.uploads.delete.useMutation({
    onSuccess: () => {
      captureEvent("image_gen_upload_deleted");
      utils.imageGenStudio.uploads.list.invalidate();
      toast.success("Upload deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete upload");
    },
  });
};
