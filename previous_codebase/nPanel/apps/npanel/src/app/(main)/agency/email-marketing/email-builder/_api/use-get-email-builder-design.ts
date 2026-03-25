"use client";

import { trpc } from "@/utils/trpc";

export const useGetEmailBuilderDesign = (id: string) => {
    return trpc.emailBuilder.get.useQuery({ id }, {
        enabled: !!id,
        refetchOnWindowFocus: false,
    });
};
