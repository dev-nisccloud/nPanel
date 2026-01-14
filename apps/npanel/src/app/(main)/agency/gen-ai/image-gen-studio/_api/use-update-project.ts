"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useUpdateProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.update.useMutation({
    mutationKey: ["project"],
    onSuccess: (data) => {
      utils.imageGenStudio.projects.get.invalidate({ id: data.data.id });
      utils.imageGenStudio.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });
};
