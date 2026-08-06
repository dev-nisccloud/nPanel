"use client";

import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { trpc } from "@/utils/trpc";

export const useUpdateEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.update.useMutation({
        onSuccess: (_data, variables) => {
            captureEvent("email_design_saved", {
                save_type: "json" in variables && variables.json != null ? "auto" : "manual",
            });
            utils.emailBuilder.list.invalidate();
            utils.emailBuilder.get.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update design");
        },
    });
};
