"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useDuplicateProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.duplicate.useMutation({
    onSuccess: () => {
      utils.imageGenStudio.projects.list.invalidate();
      toast.success("Project duplicated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate project");
    },
  });
};
