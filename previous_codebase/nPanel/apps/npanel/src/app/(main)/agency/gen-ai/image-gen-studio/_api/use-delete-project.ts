"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.delete.useMutation({
    onSuccess: () => {
      utils.imageGenStudio.projects.list.invalidate();
      toast.success("Project deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
};
