"use client";

import * as React from "react";
import { useSearchParams } from "react-router";
import { SubscriptionsTable } from "./agency.subscriptions/_components/subscriptions-table";
import { SubscriptionViewSheet } from "./agency.subscriptions/_components/subscription-view-sheet";
import { SubscriptionEditSheet } from "./agency.subscriptions/_components/subscription-edit-sheet";
import { SendRenewalEmailDialog } from "./agency.subscriptions/_components/send-renewal-email-dialog";

export default function SubscriptionsPage() {
	const [searchParams] = useSearchParams();
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [editSubscriptionId, setEditSubscriptionId] = React.useState<string | null>(null);
	const [editSheetOpen, setEditSheetOpen] = React.useState(false);
	const [renewalEmailSubscriptionId, setRenewalEmailSubscriptionId] = React.useState<string | null>(null);

	// Open view sheet when landing with ?subscriptionId=xxx (e.g. from hosting client subscriptions)
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

	const handleEditSubscription = (id: string) => {
		setEditSubscriptionId(id);
		setEditSheetOpen(true);
	};

	const handleSendRenewalEmail = (id: string) => {
		setRenewalEmailSubscriptionId(id);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Subscriptions</h1>
					<p className="text-xs text-muted-foreground">
						View and manage service subscriptions. Data from Nisc client subscriptions.
					</p>
				</div>

				<div className="mt-6">
					<SubscriptionsTable
						onViewSubscription={handleViewSubscription}
						onEditSubscription={handleEditSubscription}
					/>
				</div>
			</div>

			<SubscriptionViewSheet
				subscriptionId={viewSubscriptionId}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setViewSubscriptionId(null);
				}}
				onSendRenewalEmail={handleSendRenewalEmail}
			/>

			<SubscriptionEditSheet
				subscriptionId={editSubscriptionId}
				open={editSheetOpen}
				onOpenChange={(open) => {
					setEditSheetOpen(open);
					if (!open) setEditSubscriptionId(null);
				}}
			/>

			{renewalEmailSubscriptionId && (
				<SendRenewalEmailDialog
					subscriptionId={renewalEmailSubscriptionId}
					open={!!renewalEmailSubscriptionId}
					onOpenChange={(open) => !open && setRenewalEmailSubscriptionId(null)}
				/>
			)}
		</div>
	);
}
