"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useUpdateProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.update.useMutation({
    mutationKey: ["project"],
    onSuccess: (data) => {
      captureEvent("image_gen_project_updated", {
        project_id: data.data.id,
      });
      utils.imageGenStudio.projects.get.invalidate({ id: data.data.id });
      utils.imageGenStudio.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });
};
