"use client";

import * as React from "react";
import { SubscriptionsTable } from "./_components/subscriptions-table";
import { SubscriptionViewDialog } from "./_components/subscription-view-dialog";
import type { SubscriptionDetail } from "./_components/subscription-view-dialog";

export default function SubscriptionsPage() {
	const [selectedSubscription, setSelectedSubscription] = React.useState<SubscriptionDetail | null>(null);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
					<p className="text-xs text-muted-foreground">
						View and manage service subscriptions across teams.
					</p>
				</div>

				<div className="mt-6">
					<SubscriptionsTable onPlanNameClick={setSelectedSubscription} />
				</div>
			</div>

			<SubscriptionViewDialog
				open={!!selectedSubscription}
				onOpenChange={(open) => !open && setSelectedSubscription(null)}
				subscription={selectedSubscription}
			/>
		</div>
	);
}
