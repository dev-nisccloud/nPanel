"use client";

import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.delete.useMutation({
    onSuccess: () => {
      captureEvent("image_gen_project_deleted");
      utils.imageGenStudio.projects.list.invalidate();
      toast.success("Project deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
};
