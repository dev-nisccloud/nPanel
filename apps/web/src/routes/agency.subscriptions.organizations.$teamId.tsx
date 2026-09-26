"use client";

import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { UNCATEGORIZED_ORG_ROUTE } from "@/components/ui/organization-groups-list";
import { SubscriptionsTable } from "./agency.subscriptions/_components/subscriptions-table";
import { SubscriptionViewSheet } from "./agency.subscriptions/_components/subscription-view-sheet";
import { SubscriptionEditSheet } from "./agency.subscriptions/_components/subscription-edit-sheet";
import { CreateSubscriptionSheet } from "./agency.subscriptions/_components/create-subscription-sheet";
import { SendRenewalEmailDialog } from "./agency.subscriptions/_components/send-renewal-email-dialog";
import { SubscriptionRenewalDialog } from "@/components/subscription-renewal-dialog";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function OrganizationSubscriptionsPage() {
	const navigate = useNavigate();
	const { teamId: teamIdParam } = useParams<{ teamId: string }>();
	const [searchParams] = useSearchParams();
	const [viewSubscriptionId, setViewSubscriptionId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [editSubscriptionId, setEditSubscriptionId] = React.useState<string | null>(null);
	const [editSheetOpen, setEditSheetOpen] = React.useState(false);
	const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
	const [renewalEmailSubscriptionId, setRenewalEmailSubscriptionId] = React.useState<string | null>(null);
	const [renewSubscriptionId, setRenewSubscriptionId] = React.useState<string | null>(null);

	const isUnassigned = teamIdParam === UNCATEGORIZED_ORG_ROUTE;
	const teamId = !isUnassigned && teamIdParam && UUID_RE.test(teamIdParam) ? teamIdParam : undefined;
	const isInvalid = !isUnassigned && !teamId;

	const { data: list } = trpc.clientSubscriptions.listForAgency.useQuery(
		{
			limit: 200,
			offset: 0,
			teamId,
			unassignedOnly: isUnassigned || undefined,
		},
		{ enabled: !isInvalid },
	);

	const { data: renewalSubscription } = trpc.clientSubscriptions.getById.useQuery(
		{ id: renewSubscriptionId! },
		{ enabled: !!renewSubscriptionId }
	);

	const teamName = isUnassigned
		? "Uncategorized"
		: list?.find((sub) => sub.teamId === teamId)?.teamName ?? "Organization";

	React.useEffect(() => {
		const id = searchParams.get("subscriptionId");
		if (id) {
			setViewSubscriptionId(id);
			setSheetOpen(true);
		}
	}, [searchParams]);

	if (isInvalid) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="mb-2 text-lg font-semibold">Organization not found</p>
						<p className="mb-4 text-sm text-muted-foreground">This organization link is invalid.</p>
						<Button onClick={() => navigate("/agency/subscriptions")} variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to organizations
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-3">
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2 w-fit text-muted-foreground"
						onClick={() => navigate("/agency/subscriptions")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						All organizations
					</Button>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-base font-semibold tracking-tight">{teamName}</h1>
							<p className="text-xs text-muted-foreground">
								Subscriptions for this organization.
							</p>
						</div>
						<Button size="sm" onClick={() => setCreateSheetOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create subscription
						</Button>
					</div>
				</div>

				<div className="mt-6">
					<SubscriptionsTable
						teamId={teamId}
						unassignedOnly={isUnassigned || undefined}
						onViewSubscription={(id) => {
							setViewSubscriptionId(id);
							setSheetOpen(true);
						}}
						onEditSubscription={(id) => {
							setEditSubscriptionId(id);
							setEditSheetOpen(true);
						}}
						onRenewSubscription={(id) => {
							setRenewSubscriptionId(id);
						}}
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
				onSendRenewalEmail={setRenewalEmailSubscriptionId}
			/>

			<SubscriptionEditSheet
				subscriptionId={editSubscriptionId}
				open={editSheetOpen}
				onOpenChange={(open) => {
					setEditSheetOpen(open);
					if (!open) setEditSubscriptionId(null);
				}}
			/>

			<CreateSubscriptionSheet
				open={createSheetOpen}
				onOpenChange={setCreateSheetOpen}
			/>

			{renewalEmailSubscriptionId && (
				<SendRenewalEmailDialog
					subscriptionId={renewalEmailSubscriptionId}
					open={!!renewalEmailSubscriptionId}
					onOpenChange={(open) => !open && setRenewalEmailSubscriptionId(null)}
				/>
			)}

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
