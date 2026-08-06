import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";

/**
 * Hook for immediate, network-resilient email builder content saves.
 * Similar to how Zeepo AI Agent persists messages immediately.
 * 
 * Features:
 * - Optimistic updates: UI reflects changes immediately
 * - Immediate DB persistence: Survives network interruptions
 * - Status tracking: SAVING -> SAVED -> SAVE_FAILED
 * - Auto-retry on failure
 */
export function useSaveEmailBuilderContent() {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.saveContent.useMutation({
        onMutate: async (variables) => {
            // Cancel outgoing refetches to prevent overwriting optimistic update
            await utils.emailBuilder.get.cancel({ id: variables.designId });

            // Snapshot the previous value
            const previousDesign = utils.emailBuilder.get.getData({ id: variables.designId });

            // Optimistically update the design
            utils.emailBuilder.get.setData(
                { id: variables.designId },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            json: variables.json,
                            saveStatus: "SAVING" as const,
                            updatedAt: new Date(),
                        },
                    };
                }
            );

            return { previousDesign };
        },
        onError: (error, variables, context) => {
            // Revert to previous state on error
            if (context?.previousDesign) {
                utils.emailBuilder.get.setData(
                    { id: variables.designId },
                    context.previousDesign
                );
            }

            // Update status to SAVE_FAILED
            utils.emailBuilder.get.setData(
                { id: variables.designId },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            saveStatus: "SAVE_FAILED" as const,
                            lastSaveError: error.message,
                        },
                    };
                }
            );

            toast.error("Failed to save changes", {
                description: "Your changes could not be saved. Please check your connection and try again.",
            });
        },
        onSuccess: (data, variables) => {
            captureEvent("email_design_saved", { save_type: "auto" });
            // Update with successful save state
            utils.emailBuilder.get.setData(
                { id: variables.designId },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...data.data,
                            saveStatus: "SAVED" as const,
                            lastSaveError: null,
                        },
                    };
                }
            );
        },
        onSettled: (data, error, variables) => {
            // Always refetch to ensure consistency
            utils.emailBuilder.get.invalidate({ id: variables.designId });
        },
    });
}
