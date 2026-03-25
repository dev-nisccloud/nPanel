import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { CustomerHostingListItem } from "./schema";

/**
 * Fetches hosting subscriptions for the current team (customer view) from NiscClientSubscription.
 * Only includes products named "web hosting" or "website hosting" (case-insensitive).
 */
export function useTeamHostingSubscriptions(teamSlug: string | undefined) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.clientSubscriptions.listForTeamHosting.useQuery(
    { teamSlug: teamSlug ?? "" },
    {
      enabled: !!teamSlug,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  const list: CustomerHostingListItem[] = data;

  return {
    data: list,
    isLoading: isLoading || isRefetching,
    isError,
    error,
    refetch,
  };
}
