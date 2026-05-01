import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteProject = () => {
  const utils = trpc.useUtils();

  return trpc.zeepoCanvas.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      utils.zeepoCanvas.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
};
