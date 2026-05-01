import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDuplicateProject = () => {
  const utils = trpc.useUtils();

  return trpc.zeepoCanvas.projects.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Project duplicated");
      utils.zeepoCanvas.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate project");
    },
  });
};
