"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CustomerSubscriptionsTable } from "./_components/subscriptions-table";
import { CustomerSubscriptionViewSheet } from "./_components/subscription-view-sheet";

export default function SubscriptionsPage() {
	const pathname = usePathname();
	const teamSlug = pathname.split("/")[1];
	const searchParams = useSearchParams();
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);

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

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
					<p className="text-xs text-muted-foreground">
						View your company&apos;s service subscriptions. Data from NISC client subscriptions.
					</p>
				</div>

				<div className="mt-6">
					<CustomerSubscriptionsTable onViewSubscription={handleViewSubscription} />
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
		</div>
	);
}
