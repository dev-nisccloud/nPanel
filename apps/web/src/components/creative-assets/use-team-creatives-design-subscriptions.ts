import { trpc } from "@/utils/trpc";

/**
 * Creatives & Design subscriptions for the current team (customer view), from `nisc_client_subscription`.
 * Products match "Creatives & Design" / legacy creative design names (same as the pricing table API).
 */
export function useTeamCreativesDesignSubscriptions(teamSlug: string | undefined) {
	const { data, isLoading, isError, error, refetch, isRefetching } =
		trpc.clientSubscriptions.listForTeamCreativesDesign.useQuery(
			{ teamSlug: teamSlug ?? "" },
			{
				enabled: !!teamSlug,
				staleTime: 2 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			},
		);

	return {
		data: data ?? [],
		isLoading: isLoading || isRefetching,
		isError,
		error,
		refetch,
		hasSubscription: (data?.length ?? 0) > 0,
	};
}
