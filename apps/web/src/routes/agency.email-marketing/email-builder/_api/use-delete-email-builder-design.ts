"use client";

import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const useDeleteEmailBuilderDesign = () => {
    const utils = trpc.useUtils();

    return trpc.emailBuilder.delete.useMutation({
        onSuccess: () => {
            toast.success("Design deleted");
            utils.emailBuilder.list.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete design");
        },
    });
};
