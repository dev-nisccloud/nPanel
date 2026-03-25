"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface UseGetEmailBuilderDesignsProps {
    teamId?: string;
}

export const useGetEmailBuilderDesigns = ({ teamId }: UseGetEmailBuilderDesignsProps = {}) => {
    const utils = trpc.useUtils();

    return useInfiniteQuery({
        queryKey: [["emailBuilder", "list"], { limit: 10, teamId }],
        queryFn: async ({ pageParam = 1 }) => {
            const result = await utils.emailBuilder.list.fetch({
                page: pageParam as number,
                limit: 10,
                teamId,
            });
            return result;
        },
        getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
        initialPageParam: 1,
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
    });
};
