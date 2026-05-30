import { trpc } from "@/utils/trpc";
import {
	refreshZeepoTokenBalance,
	zeepoTokenBalanceQueryOptions,
} from "@/lib/zeepo-token-balance-query";

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function useZeepoTokenBalance(teamId: string | null | undefined, userRole?: string | null) {
	const isAgency = AGENCY_ROLES.has(userRole ?? "");
	const enabled = Boolean(teamId) && !isAgency;

	const query = trpc.zeepoAgent.billing.getTokenBalance.useQuery(
		{ teamId: teamId! },
		zeepoTokenBalanceQueryOptions(enabled),
	);

	return {
		isAgency,
		tokens: query.data?.tokens ?? null,
		hasSubscription: query.data?.hasSubscription ?? false,
		isLoading: enabled && query.isLoading,
		refetch: query.refetch,
	};
}

export function useRefreshZeepoTokenBalance() {
	const utils = trpc.useUtils();
	return (teamId: string | null | undefined) => refreshZeepoTokenBalance(utils, teamId);
}
