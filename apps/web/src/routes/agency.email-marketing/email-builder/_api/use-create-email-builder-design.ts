"use client";

import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { trpc } from "@/utils/trpc";

export const useCreateEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.create.useMutation({
        onSuccess: () => {
            captureEvent("email_design_created", {
                template_used: "blank",
            });
            utils.emailBuilder.list.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create email design");
        },
    });
};
