"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useCreateProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.create.useMutation({
    onSuccess: () => {
      utils.imageGenStudio.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });
};
