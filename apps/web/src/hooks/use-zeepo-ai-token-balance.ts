"use client";

import { trpc } from "@/utils/trpc";
import {
	ZEEPO_TOKEN_BALANCE_LIVE_QUERY_OPTIONS,
	zeepoTokenBalanceQueryOptions,
} from "@/lib/zeepo-token-balance-query";

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function useZeepoAiTokenBalance(
	teamId: string | null | undefined,
	userRole?: string | null,
) {
	const isAgency = AGENCY_ROLES.has(userRole ?? "");
	const enabled = Boolean(teamId) && !isAgency;

	const query = trpc.zeepoAi.billing.getTokenBalance.useQuery(
		{ teamId: teamId! },
		zeepoTokenBalanceQueryOptions(enabled),
	);

	return {
		isAgency,
		/** Always 0+ for customers; null only while agency unlimited. */
		tokens: isAgency ? null : (query.data?.tokens ?? 0),
		hasSubscription: query.data?.hasSubscription ?? false,
		walletInitialized: query.data?.walletInitialized ?? false,
		hasQualifyingService: query.data?.hasQualifyingService ?? false,
		welcomeEligible: query.data?.welcomeEligible ?? false,
		welcomeTokenGrant: query.data?.welcomeTokenGrant ?? 100,
		isLoading: enabled && query.isLoading,
		refetch: query.refetch,
	};
}

export function refreshZeepoAiTokenBalance(
	utils: {
		zeepoAi: {
			billing: {
				getTokenBalance: {
					invalidate: (input?: { teamId: string }) => Promise<unknown> | void;
					refetch: (input: { teamId: string }) => Promise<unknown> | void;
				};
			};
		};
	},
	teamId: string | null | undefined,
) {
	if (!teamId) return;
	// Invalidate so every mounted wallet (home + chat) refetches immediately.
	void utils.zeepoAi.billing.getTokenBalance.invalidate({ teamId });
}

export { ZEEPO_TOKEN_BALANCE_LIVE_QUERY_OPTIONS };
