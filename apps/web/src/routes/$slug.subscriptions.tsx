"use client";

import * as React from "react";
import { useLocation, useSearchParams } from "react-router";
import { CustomerSubscriptionsTable } from "./$slug.subscriptions/_components/subscriptions-table";
import { CustomerSubscriptionViewSheet } from "./$slug.subscriptions/_components/subscription-view-sheet";
import { SubscriptionRenewalDialog } from "@/components/subscription-renewal-dialog";
import { trpc } from "@/utils/trpc";

export default function SubscriptionsPage() {
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const [searchParams] = useSearchParams();
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [renewSubscriptionId, setRenewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);

	const { data: renewalSubscription } = trpc.clientSubscriptions.getById.useQuery(
		{ id: renewSubscriptionId!, teamSlug },
		{ enabled: !!renewSubscriptionId }
	);

	// Open view sheet when landing with ?subscriptionId=xxx
	React.useEffect(() => {
		const id = searchParams.get("subscriptionId");
		if (id) {
			setViewSubscriptionId(id);
			setSheetOpen(true);
		}
	}, [searchParams]);

	const handleViewSubscription = (id: string) => {
		setViewSubscriptionId(id);
		setSheetOpen(true);
	};

	const handleRenewSubscription = (id: string) => {
		setRenewSubscriptionId(id);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
					<p className="text-xs text-muted-foreground">
						View your subscriptions and services
					</p>
				</div>

				<div className="mt-6">
					<CustomerSubscriptionsTable
						onViewSubscription={handleViewSubscription}
						onRenewSubscription={handleRenewSubscription}
					/>
				</div>
			</div>

			<CustomerSubscriptionViewSheet
				subscriptionId={viewSubscriptionId}
				teamSlug={teamSlug}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setViewSubscriptionId(null);
				}}
			/>

			<SubscriptionRenewalDialog
				open={!!renewSubscriptionId}
				onOpenChange={(open) => {
					if (!open) setRenewSubscriptionId(null);
				}}
				subscription={
					renewalSubscription
						? {
								id: renewalSubscription.id,
								name: renewalSubscription.name,
								productId: renewalSubscription.productId,
								productName: renewalSubscription.product?.name || "",
								productPlanId: renewalSubscription.productPlanId,
								serviceType: renewalSubscription.product?.serviceType || null,
								agreedPrice: renewalSubscription.agreedPrice,
								agreedCurrency: renewalSubscription.agreedCurrency,
								billingCycle: renewalSubscription.billingCycle,
								expiryDate: renewalSubscription.expiryDate
									? new Date(renewalSubscription.expiryDate)
									: null,
								userId: renewalSubscription.userId,
								teamId: renewalSubscription.teamId,
						  }
						: null
				}
			/>
		</div>
	);
}
