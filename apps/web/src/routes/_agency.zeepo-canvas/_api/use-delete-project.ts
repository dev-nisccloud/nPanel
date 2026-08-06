import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

export const useDeleteProject = () => {
  const utils = trpc.useUtils();

  return trpc.zeepoCanvas.projects.delete.useMutation({
    onSuccess: () => {
      captureEvent("zeepo_canvas_project_deleted");
      toast.success("Project deleted");
      utils.zeepoCanvas.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
};
