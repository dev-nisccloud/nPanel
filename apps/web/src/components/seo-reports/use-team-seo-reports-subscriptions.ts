import { trpc } from "@/utils/trpc";

/**
 * SEO Reports subscriptions for the current team (customer view), from `nisc_client_subscription`.
 */
export function useTeamSeoReportsSubscriptions(teamSlug: string | undefined) {
	const { data, isLoading, isError, error, refetch, isRefetching } =
		trpc.clientSubscriptions.listForTeamSeoReports.useQuery(
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
