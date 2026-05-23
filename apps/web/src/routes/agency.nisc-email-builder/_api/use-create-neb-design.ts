"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useCreateNebDesign = () => {
	const utils = trpc.useUtils();

	return trpc.niscEmailBuilder.design.create.useMutation({
		onSuccess: () => {
			utils.niscEmailBuilder.design.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create design");
		},
	});
};
