/**
 * Customer Zeepo token balance - always read live from the DB; never serve stale cache.
 */
export const ZEEPO_TOKEN_BALANCE_LIVE_QUERY_OPTIONS = {
	staleTime: 0,
	gcTime: 0,
	refetchOnMount: "always" as const,
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
	networkMode: "always" as const,
};

export function zeepoTokenBalanceQueryOptions(enabled: boolean) {
	return {
		...ZEEPO_TOKEN_BALANCE_LIVE_QUERY_OPTIONS,
		enabled,
	};
}

type TokenBalanceUtils = {
	zeepoAgent: {
		billing: {
			getTokenBalance: {
				invalidate: (input: { teamId: string }) => Promise<void> | void;
				refetch: (input: { teamId: string }) => Promise<unknown> | void;
			};
		};
	};
};

/** Force a network refetch of token balance for all active observers (customer side). */
export function refreshZeepoTokenBalance(
	utils: TokenBalanceUtils,
	teamId: string | null | undefined,
) {
	if (!teamId) return;
	void utils.zeepoAgent.billing.getTokenBalance.refetch({ teamId });
}
