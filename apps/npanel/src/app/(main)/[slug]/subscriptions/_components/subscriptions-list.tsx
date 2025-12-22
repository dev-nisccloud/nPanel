"use client";

import * as React from "react";
import {
	CalendarDays,
	CreditCard,
	Clock,
	CheckCircle2,
	AlertCircle,
	XCircle,
	RefreshCw,
	Package,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ServiceSubscription = {
	id: string;
	planName: string;
	planType: string;
	hostingSubType: string | null;
	status: string;
	billingCycle: string;
	nextRenewalDate: Date | null;
	subscriptionDate: Date | null;
	autoRenew: boolean;
};

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	ACTIVE: "default",
	PENDING: "outline",
	SUSPENDED: "destructive",
	CANCELLED: "outline",
	EXPIRED: "outline",
	PROCESSING: "secondary",
	FAILED: "destructive",
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
	ACTIVE: CheckCircle2,
	PENDING: Clock,
	SUSPENDED: XCircle,
	CANCELLED: XCircle,
	EXPIRED: AlertCircle,
	PROCESSING: RefreshCw,
	FAILED: XCircle,
};

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) {
		return "—";
	}
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "—";
	}
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const getPlanTypeDisplayName = (planType: string): string => {
	const typeMap: Record<string, string> = {
		HOSTING: "Hosting",
		SEO: "SEO",
		VIDEOGRAPHY: "Videography",
		VISUAL_CREATIVE: "Visual Creative",
		SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
		PAY_PER_CLICK_ADVERTISING: "Pay Per Click",
	};
	return typeMap[planType] || planType;
};

const getBillingCycleDisplayName = (cycle: string): string => {
	const cycleMap: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennial",
		CUSTOM: "Custom",
	};
	return cycleMap[cycle] || cycle;
};

interface SubscriptionCardProps {
	subscription: ServiceSubscription;
}

function SubscriptionCard({ subscription }: SubscriptionCardProps) {
	const StatusIcon = statusIcon[subscription.status] || AlertCircle;
	const isActive = subscription.status === "ACTIVE";

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardContent className="p-6">
				<div className="space-y-4">
					{/* Header */}
					<div className="flex items-start justify-between">
						<div className="space-y-1 flex-1">
							<div className="flex items-center gap-2">
								<Package className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-lg font-semibold">
									{subscription.planName || "Unnamed Plan"}
								</h3>
							</div>
							<div className="flex items-center gap-2 flex-wrap">
								<Badge variant="outline" className="text-xs">
									{getPlanTypeDisplayName(subscription.planType)}
								</Badge>
								{subscription.hostingSubType && (
									<Badge variant="secondary" className="text-xs">
										{subscription.hostingSubType.replace("_", " ")}
									</Badge>
								)}
							</div>
						</div>
						<Badge
							variant={statusBadgeVariant[subscription.status] || "outline"}
							className="flex items-center gap-1"
						>
							<StatusIcon className="h-3 w-3" />
							{subscription.status.replace("_", " ")}
						</Badge>
					</div>

					{/* Details Grid */}
					<div className="grid grid-cols-2 gap-4 pt-4 border-t">
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CreditCard className="h-3 w-3" />
								<span>Billing Cycle</span>
							</div>
							<p className="text-sm font-medium">
								{getBillingCycleDisplayName(subscription.billingCycle)}
							</p>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<RefreshCw className="h-3 w-3" />
								<span>Auto Renew</span>
							</div>
							<Badge variant={subscription.autoRenew ? "default" : "secondary"} className="text-xs">
								{subscription.autoRenew ? "Enabled" : "Disabled"}
							</Badge>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CalendarDays className="h-3 w-3" />
								<span>Subscription Date</span>
							</div>
							<p className="text-sm font-medium">
								{formatDate(subscription.subscriptionDate)}
							</p>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Clock className="h-3 w-3" />
								<span>Next Renewal</span>
							</div>
							<p className={cn(
								"text-sm font-medium",
								isActive && subscription.nextRenewalDate
									? new Date(subscription.nextRenewalDate) < new Date()
										? "text-destructive"
										: ""
									: "text-muted-foreground"
							)}>
								{subscription.nextRenewalDate
									? formatDate(subscription.nextRenewalDate)
									: "—"}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface SubscriptionsListProps {
	subscriptions: ServiceSubscription[];
	onRefetch?: () => void;
}

export function SubscriptionsList({ subscriptions, onRefetch }: SubscriptionsListProps) {
	return (
		<div className="space-y-3">
			{subscriptions.map((subscription) => (
				<SubscriptionCard key={subscription.id} subscription={subscription} />
			))}
		</div>
	);
}

