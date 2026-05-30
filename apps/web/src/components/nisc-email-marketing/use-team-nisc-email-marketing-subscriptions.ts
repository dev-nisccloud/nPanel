import { trpc } from "@/utils/trpc";

/**
 * Nisc Email Marketing subscriptions for the current team (customer view), from `nisc_client_subscription`.
 * Products match "Nisc Email Marketing" or "Email Marketing" (case-insensitive), same as the pricing table API.
 */
export function useTeamNiscEmailMarketingSubscriptions(teamSlug: string | undefined) {
	const { data, isLoading, isError, error, refetch, isRefetching } =
		trpc.clientSubscriptions.listForTeamNiscEmailMarketing.useQuery(
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
