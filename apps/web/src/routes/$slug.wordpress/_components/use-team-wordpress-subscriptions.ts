import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export type CustomerWordPressListItem = {
  id: string;
  subscriptionName: string | null;
  status: string;
  primaryDomain: string | null;
  subscriptionDate: Date | null;
  expiryDate: Date | null;
  wordpressInstallationId: string | null;
  pleskSubscriptionId: string | null;
};

/**
 * Fetches WordPress hosting subscriptions for the current team (customer view) from NiscClientSubscription.
 * Only includes products named "wordpress hosting" or "wordpress managed" (case-insensitive).
 */
export function useTeamWordPressSubscriptions(teamSlug: string | undefined) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.clientSubscriptions.listForTeamWordPress.useQuery(
    { teamSlug: teamSlug ?? "" },
    {
      enabled: !!teamSlug,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  const list: CustomerWordPressListItem[] = data;

  return {
    data: list,
    isLoading: isLoading || isRefetching,
    isError,
    error,
    refetch,
  };
}
