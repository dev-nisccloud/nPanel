"use client";

import posthog from "posthog-js";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useCreateProject = () => {
  const utils = trpc.useUtils();

  return trpc.imageGenStudio.projects.create.useMutation({
    onSuccess: () => {
      if (
        import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN &&
        import.meta.env.VITE_PUBLIC_POSTHOG_HOST
      ) {
        posthog.capture("image_generation_project_created");
      }
      utils.imageGenStudio.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });
};
