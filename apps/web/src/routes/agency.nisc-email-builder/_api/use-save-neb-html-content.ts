"use client";

import { trpc } from "@/utils/trpc";

/**
 * Hook for auto-saving NISC email HTML with immediate persistence and optimistic updates.
 * Network resilient - saves immediately to DB without validation.
 */
export function useSaveNebHtmlContent() {
	const utils = trpc.useUtils();

	return trpc.niscEmailBuilder.design.saveHtmlContent.useMutation({
		onMutate: async (variables) => {
			// Cancel any outgoing refetches
			await utils.niscEmailBuilder.design.get.cancel({ designId: variables.designId });

			// Snapshot the previous value
			const previousDesign = utils.niscEmailBuilder.design.get.getData({
				designId: variables.designId,
			});

			// Optimistically update to show "SAVING" state
			utils.niscEmailBuilder.design.get.setData({ designId: variables.designId }, (old) => {
				if (!old) return old;
				return {
					...old,
					htmlContent: variables.html,
					saveStatus: "SAVING" as const,
					updatedAt: new Date(),
				};
			});

			return { previousDesign };
		},

		onError: (error, variables, context) => {
			// Revert to previous design on error
			if (context?.previousDesign) {
				utils.niscEmailBuilder.design.get.setData(
					{ designId: variables.designId },
					context.previousDesign,
				);
			}

			// Update to failed state
			utils.niscEmailBuilder.design.get.setData({ designId: variables.designId }, (old) => {
				if (!old) return old;
				return {
					...old,
					saveStatus: "SAVE_FAILED" as const,
					lastSaveError: error.message,
					updatedAt: new Date(),
				};
			});
		},

		onSuccess: (data, variables) => {
			// Update with successful save state
			utils.niscEmailBuilder.design.get.setData({ designId: variables.designId }, (old) => {
				if (!old || !data.data) return old;
				return {
					...old,
					htmlContent: data.data.htmlContent,
					saveStatus: data.data.saveStatus,
					clientVersion: data.data.clientVersion,
					lastSavedAt: data.data.lastSavedAt,
					updatedAt: data.data.updatedAt,
					lastSaveError: null,
				};
			});
		},

		onSettled: (data, error, variables) => {
			// Invalidate to ensure we're in sync with server
			void utils.niscEmailBuilder.design.get.invalidate({ designId: variables.designId });
		},
	});
}
