"use client";

import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export function useCreateNebMediaLibraryItem() {
	const utils = trpc.useUtils();

	return trpc.niscEmailBuilder.mediaLibrary.createFromUpload.useMutation({
		onSuccess: () => {
			void utils.niscEmailBuilder.mediaLibrary.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to save image to library");
		},
	});
}
