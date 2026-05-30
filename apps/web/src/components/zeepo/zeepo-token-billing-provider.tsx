"use client";

import * as React from "react";
import {
	getZeepoTokenBillingErrorReasonFromError,
	type ZeepoTokenBillingErrorReason,
} from "@/lib/zeepo-token-errors";
import type { ZeepoPlanFilter } from "@/hooks/use-zeepo-purchase-plans";
import { useZeepoAgentRoute } from "./zeepo-agent-route-context";
import { ZeepoOutOfTokensDialog } from "./zeepo-out-of-tokens-dialog";
import { refreshZeepoTokenBalance } from "@/lib/zeepo-token-balance-query";
import { trpc } from "@/utils/trpc";

type ZeepoTokenBillingContextValue = {
	openOutOfTokens: (opts?: {
		reason?: ZeepoTokenBillingErrorReason;
		step?: "alert" | "plans";
		planFilter?: ZeepoPlanFilter;
	}) => void;
	/** Opens top-up packs directly (subscription holders). */
	openTopUpPurchase: () => void;
	/** Returns true when the error was a token billing issue and the dialog was shown. */
	handleBillingError: (error: unknown) => boolean;
};

const ZeepoTokenBillingContext = React.createContext<ZeepoTokenBillingContextValue | null>(
	null,
);

export function ZeepoTokenBillingProvider({ children }: { children: React.ReactNode }) {
	const { isCustomer, teamId } = useZeepoAgentRoute();
	const [open, setOpen] = React.useState(false);
	const [reason, setReason] = React.useState<ZeepoTokenBillingErrorReason>("depleted");
	const [initialStep, setInitialStep] = React.useState<"alert" | "plans">("alert");
	const [planFilter, setPlanFilter] = React.useState<ZeepoPlanFilter | undefined>(undefined);
	const utils = trpc.useUtils();

	const openOutOfTokens = React.useCallback(
		(opts?: {
			reason?: ZeepoTokenBillingErrorReason;
			step?: "alert" | "plans";
			planFilter?: ZeepoPlanFilter;
		}) => {
			refreshZeepoTokenBalance(utils, teamId);
			setReason(opts?.reason ?? "depleted");
			setInitialStep(opts?.step ?? "alert");
			setPlanFilter(opts?.planFilter);
			setOpen(true);
		},
		[teamId, utils],
	);

	const openTopUpPurchase = React.useCallback(() => {
		refreshZeepoTokenBalance(utils, teamId);
		setReason("depleted");
		setInitialStep("plans");
		setPlanFilter("top_up");
		setOpen(true);
	}, [teamId, utils]);

	const handleBillingError = React.useCallback(
		(error: unknown): boolean => {
			if (!isCustomer) return false;
			const billingReason = getZeepoTokenBillingErrorReasonFromError(error);
			if (!billingReason) return false;
			openOutOfTokens({ reason: billingReason, step: "plans" });
			return true;
		},
		[isCustomer, openOutOfTokens],
	);

	const handleOpenChange = React.useCallback(
		(next: boolean) => {
			setOpen(next);
			if (!next && teamId) {
				refreshZeepoTokenBalance(utils, teamId);
			}
		},
		[teamId, utils],
	);

	const value = React.useMemo(
		() => ({ openOutOfTokens, openTopUpPurchase, handleBillingError }),
		[openOutOfTokens, openTopUpPurchase, handleBillingError],
	);

	return (
		<ZeepoTokenBillingContext.Provider value={value}>
			{children}
			{isCustomer && (
				<ZeepoOutOfTokensDialog
					open={open}
					onOpenChange={handleOpenChange}
					reason={reason}
					initialStep={initialStep}
					planFilterOverride={planFilter}
				/>
			)}
		</ZeepoTokenBillingContext.Provider>
	);
}

export function useZeepoTokenBilling(): ZeepoTokenBillingContextValue {
	const ctx = React.useContext(ZeepoTokenBillingContext);
	if (!ctx) {
		return {
			openOutOfTokens: () => {},
			openTopUpPurchase: () => {},
			handleBillingError: () => false,
		};
	}
	return ctx;
}
