"use client";

import { toast } from "@/components/ui/sonner";
import { queryClient, trpc } from "@/utils/trpc";

export const useDeleteNebDesign = () => {
	const utils = trpc.useUtils();

	return trpc.niscEmailBuilder.design.delete.useMutation({
		onSuccess: () => {
			toast.success("Design deleted");
			void utils.niscEmailBuilder.design.list.invalidate();
			void queryClient.invalidateQueries({
				queryKey: [["niscEmailBuilder", "design", "list"]],
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete design");
		},
	});
};
