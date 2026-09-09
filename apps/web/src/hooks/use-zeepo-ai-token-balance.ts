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

	const tokens = isAgency ? null : (query.data?.tokens ?? 0);
	const minTokensToStart = query.data?.minTokensToStart ?? 25;

	return {
		isAgency,
		/** Always 0+ for customers; null only while agency unlimited. */
		tokens,
		hasSubscription: query.data?.hasSubscription ?? false,
		walletInitialized: query.data?.walletInitialized ?? false,
		hasQualifyingService: query.data?.hasQualifyingService ?? false,
		welcomeEligible: query.data?.welcomeEligible ?? false,
		welcomeTokenGrant: query.data?.welcomeTokenGrant ?? 100,
		minTokensToStart,
		/** False when this customer cannot start a billable turn. Agency is always true. */
		canAffordTurn: isAgency || (tokens ?? 0) >= minTokensToStart,
		isError: enabled && query.isError,
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
	void utils.zeepoAi.billing.getTokenBalance.refetch({ teamId });
}

export function applyZeepoAiWelcomeGrantToCache(
	utils: {
		zeepoAi: {
			billing: {
				getTokenBalance: {
					setData: (
						input: { teamId: string },
						updater: (prev: unknown) => unknown,
					) => void;
					invalidate: (input?: { teamId: string }) => Promise<unknown> | void;
					refetch: (input: { teamId: string }) => Promise<unknown> | void;
				};
			};
		};
	},
	teamId: string,
	result: { balanceAfter: number; tokensGranted: number },
) {
	utils.zeepoAi.billing.getTokenBalance.setData({ teamId }, (prev) => {
		const current = (prev ?? {}) as {
			hasQualifyingService?: boolean;
			welcomeTokenGrant?: number;
			subscriptionId?: string | null;
			minTokensToStart?: number;
		};
		return {
			unlimited: false,
			tokens: result.balanceAfter,
			hasSubscription: true,
			isAgency: false,
			walletInitialized: true,
			hasQualifyingService: current.hasQualifyingService ?? true,
			welcomeEligible: false,
			welcomeTokenGrant: current.welcomeTokenGrant ?? result.tokensGranted,
			subscriptionId: current.subscriptionId ?? undefined,
			minTokensToStart: current.minTokensToStart ?? 25,
		};
	});
	void utils.zeepoAi.billing.getTokenBalance.refetch({ teamId });
}

export { ZEEPO_TOKEN_BALANCE_LIVE_QUERY_OPTIONS };
