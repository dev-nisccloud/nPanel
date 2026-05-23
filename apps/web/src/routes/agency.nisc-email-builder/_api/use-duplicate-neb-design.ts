"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useDuplicateNebDesign = () => {
	const utils = trpc.useUtils();

	return trpc.niscEmailBuilder.design.duplicate.useMutation({
		onSuccess: () => {
			toast.success("Design duplicated");
			utils.niscEmailBuilder.design.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to duplicate design");
		},
	});
};
