import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useCreateProject = () => {
  const utils = trpc.useUtils();

  return trpc.zeepoCanvas.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Project created");
      utils.zeepoCanvas.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });
};
