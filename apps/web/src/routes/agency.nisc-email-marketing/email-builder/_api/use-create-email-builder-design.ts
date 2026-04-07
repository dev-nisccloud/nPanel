"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useCreateEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.create.useMutation({
        onSuccess: () => {
            utils.emailBuilder.list.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create email design");
        },
    });
};
