"use client";

import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const useDuplicateEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.duplicate.useMutation({
        onSuccess: () => {
            toast.success("Design duplicated");
            utils.emailBuilder.list.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to duplicate design");
        },
    });
};
