"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useUpdateEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.update.useMutation({
        onSuccess: () => {
            utils.emailBuilder.list.invalidate();
            utils.emailBuilder.get.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update design");
        },
    });
};
