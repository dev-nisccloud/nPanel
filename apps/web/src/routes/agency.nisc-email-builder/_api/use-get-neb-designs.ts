"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface UseGetNebDesignsProps {
	teamId?: string;
}

export const useGetNebDesigns = ({ teamId }: UseGetNebDesignsProps = {}) => {
	const utils = trpc.useUtils();

	return useInfiniteQuery({
		queryKey: [["niscEmailBuilder", "design", "list"], { limit: 10, teamId }],
		queryFn: async ({ pageParam = 1 }) => {
			const result = await utils.niscEmailBuilder.design.list.fetch({
				page: pageParam as number,
				limit: 10,
				teamId,
			});
			const pageData =
				result.data ??
				// legacy / mistaken shape fallback
				(result as { items?: typeof result.data }).items ??
				[];
			return {
				data: pageData,
				nextPage: result.nextPage ?? null,
			};
		},
		getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
		initialPageParam: 1,
		staleTime: 30000,
		gcTime: 5 * 60 * 1000,
	});
};
