"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

/**
 * Hook for creating image uploads
 * 
 * Note: Uses type assertion to work around TypeScript's "Type instantiation is excessively deep"
 * error which occurs with complex tRPC schemas containing z.record().
 * The mutation still works correctly at runtime.
 */
export const useCreateUpload = () => {
  const utils = trpc.useUtils();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutation = trpc.imageGenStudio.uploads.create.useMutation({
    onSuccess: (_data: unknown, variables: { fileSize?: number }) => {
      captureEvent("image_gen_upload_added", {
        file_size_mb: variables.fileSize
          ? Math.round((variables.fileSize / (1024 * 1024)) * 100) / 100
          : 0,
      });
      void utils.imageGenStudio.uploads.list.invalidate();
      toast.success("Image uploaded successfully");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to upload image");
    },
  }) as any;

  return mutation;
};
