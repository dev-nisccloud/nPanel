"use client";

import * as React from "react";
import { Link } from "react-router";
import { ArrowLeft, CreditCard, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BuyNowDialog } from "@/components/buy-now-dialog";
import { buildHivelocityVpsReactivatePlanForCheckout } from "@/lib/build-hivelocity-vps-reactivate-plan";
import { trpc } from "@/utils/trpc";

export type SuspendedVpsPaywallContext = {
	subscriptionId: string;
	serviceLabel: string;
	amount: number;
	currency: string;
	billingCycle: string | null;
	productId: string;
};

interface VpsSuspendedPaywallProps {
	deviceId: number;
	teamSlug: string;
	context: SuspendedVpsPaywallContext;
	vpsListPath: string;
}

function formatBillingCycleLabel(cycle: string | null): string {
	if (!cycle) return "billing period";
	const labels: Record<string, string> = {
		MONTHLY: "month",
		YEARLY: "year",
		BIENNIALLY: "2 years",
		CUSTOM: "period",
	};
	return labels[cycle] ?? cycle.toLowerCase();
}

function formatMoney(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency,
			minimumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export function VpsSuspendedPaywall({
	deviceId,
	teamSlug,
	context,
	vpsListPath,
}: VpsSuspendedPaywallProps) {
	const utils = trpc.useUtils();
	const [payOpen, setPayOpen] = React.useState(false);

	const plan = React.useMemo(
		() =>
			buildHivelocityVpsReactivatePlanForCheckout({
				deviceId,
				subscriptionId: context.subscriptionId,
				serviceLabel: context.serviceLabel,
				amount: context.amount,
				currency: context.currency,
				billingCycle: context.billingCycle,
				productId: context.productId,
			}),
		[context, deviceId],
	);

	const handleDialogChange = React.useCallback(
		(open: boolean) => {
			setPayOpen(open);
			if (!open) {
				void utils.hivelocity.getCustomerSuspendedVpsContext.invalidate({
					deviceId,
					teamSlug,
					teamResourceCategory: "vps",
				});
				void utils.hivelocity.getTeamMyResources.invalidate();
			}
		},
		[utils, deviceId, teamSlug],
	);

	const cycleLabel = formatBillingCycleLabel(context.billingCycle);
	const displayAmount = formatMoney(context.amount, context.currency);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-lg mx-auto space-y-4">
				<Link to={vpsListPath}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to VPS list
					</Button>
				</Link>

				<Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
							<ShieldAlert className="h-5 w-5 shrink-0" />
							Service suspended
						</CardTitle>
						<CardDescription className="text-amber-900/80 dark:text-amber-300/80">
							<span className="font-medium text-foreground">{context.serviceLabel}</span> is
							temporarily unavailable. Pay your recurring charge to restore access.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border border-amber-200/80 bg-background/80 p-4 dark:border-amber-800">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
							<p className="mt-1 text-2xl font-semibold tracking-tight">{displayAmount}</p>
							<p className="mt-1 text-sm text-muted-foreground">per {cycleLabel}</p>
						</div>
						<p className="text-sm text-muted-foreground">
							After payment is confirmed, your service will be reactivated automatically and you
							will regain full access to manage it.
						</p>
						<Button className="w-full" size="lg" onClick={() => setPayOpen(true)}>
							<CreditCard className="h-4 w-4 mr-2" />
							Pay {displayAmount} to restore
						</Button>
					</CardContent>
				</Card>
			</div>

			<BuyNowDialog
				open={payOpen}
				onOpenChange={handleDialogChange}
				plan={plan}
				teamSlug={teamSlug}
				intent="buy_now"
			/>
		</div>
	);
}
