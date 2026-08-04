"use client";

import { trpc } from "@/utils/trpc";

export const useGetEmailBuilderDesign = (id: string) => {
    return trpc.emailBuilder.get.useQuery({ id }, {
        enabled: !!id,
        // Real-time polling like Zeepo - checks for background updates and changes from other users
        refetchInterval: (query) => {
            const design = query.state.data?.data;
            // Poll every 2 seconds if there are pending operations or if status is SAVING
            const hasPendingWork = design?.saveStatus === "SAVING" || design?.saveStatus === "SAVE_FAILED";
            return hasPendingWork ? 2000 : false;
        },
        // Always refetch on window focus to catch updates from other tabs/users
        refetchOnWindowFocus: true,
        // Keep data fresh
        staleTime: 5000, // Consider data stale after 5 seconds
    });
};
