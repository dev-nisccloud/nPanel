"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Building2, Calendar, RefreshCw, FileText } from "lucide-react";

function getBillingCycleDisplayName(cycle: string): string {
	const m: Record<string, string> = { MONTHLY: "Monthly", YEARLY: "Yearly", BIENNIALLY: "Biennially", CUSTOM: "Custom" };
	return m[cycle] ?? cycle;
}

function getPlanTypeDisplayName(t: string): string {
	const m: Record<string, string> = {
		HOSTING: "Hosting",
		SEO: "SEO",
		VIDEOGRAPHY: "Videography",
		VISUAL_CREATIVE: "Visual Creative",
		SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
		PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
	};
	return m[t] ?? t;
}

function getHostingSubTypeDisplayName(t: string | null | undefined): string {
	if (!t) return "—";
	const m: Record<string, string> = {
		WEB_HOSTING: "Web Hosting",
		EMAIL_HOSTING: "Email Hosting",
		RESELLER_HOSTING: "Reseller Hosting",
		VPS_HOSTING: "VPS Hosting",
		DEDICATED_HOSTING: "Dedicated Hosting",
	};
	return m[t] ?? t;
}

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export interface SubscriptionDetail {
	id: string;
	planName: string;
	planType: string;
	hostingSubType: string | null;
	teamId: string | null;
	teamName: string | null;
	orderId: string | null;
	subscriptionDate: string | Date | null;
	billingCycle: string;
	nextRenewalDate: string | Date | null;
	status: string;
	autoRenew: boolean;
	notes: string | null;
	createdAt: string | Date;
}

interface SubscriptionViewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription: SubscriptionDetail | null;
}

export function SubscriptionViewDialog({ open, onOpenChange, subscription }: SubscriptionViewDialogProps) {
	if (!subscription) return null;

	const isActive = subscription.status === "ACTIVE";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						{subscription.planName}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 text-sm">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-muted-foreground">Status</span>
						<Badge
							variant="outline"
							className={
								isActive ? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white" : ""
							}
						>
							{subscription.status}
						</Badge>
					</div>
					<div className="grid gap-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Package className="h-4 w-4" />
							Plan Type
						</div>
						<p>{getPlanTypeDisplayName(subscription.planType)}</p>
					</div>
					{subscription.hostingSubType && (
						<div className="grid gap-2">
							<div className="text-muted-foreground">Hosting Sub-Type</div>
							<p>{getHostingSubTypeDisplayName(subscription.hostingSubType)}</p>
						</div>
					)}
					<div className="grid gap-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Building2 className="h-4 w-4" />
							Team
						</div>
						<p>{subscription.teamName || subscription.teamId || "—"}</p>
					</div>
					<div className="grid gap-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4" />
							Subscription Date
						</div>
						<p>{formatDate(subscription.subscriptionDate)}</p>
					</div>
					<div className="grid gap-2">
						<div className="text-muted-foreground">Billing Cycle</div>
						<p>{getBillingCycleDisplayName(subscription.billingCycle)}</p>
					</div>
					<div className="grid gap-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<RefreshCw className="h-4 w-4" />
							Next Renewal
						</div>
						<p>{formatDate(subscription.nextRenewalDate)}</p>
					</div>
					<div className="grid gap-2">
						<div className="text-muted-foreground">Auto Renew</div>
						<p>{subscription.autoRenew ? "Yes" : "No"}</p>
					</div>
					{subscription.orderId && (
						<div className="grid gap-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<FileText className="h-4 w-4" />
								Order ID
							</div>
							<p className="font-mono text-xs">{subscription.orderId}</p>
						</div>
					)}
					{subscription.notes && (
						<div className="grid gap-2">
							<div className="text-muted-foreground">Notes</div>
							<p className="text-muted-foreground">{subscription.notes}</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
