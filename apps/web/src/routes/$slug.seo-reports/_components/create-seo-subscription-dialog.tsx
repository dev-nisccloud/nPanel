"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

export type CreateSeoSubscriptionDialogProps =
	| { scope: "SEARCH_CONSOLE"; siteUrl: string }
	| { scope: "GA4"; propertyId: string; propertyDisplayName?: string | null };

export function CreateSeoSubscriptionDialog(props: CreateSeoSubscriptionDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [teamId, setTeamId] = React.useState("");
	const [productPlanId, setProductPlanId] = React.useState("");
	const [managementFee, setManagementFee] = React.useState("");
	const [managementFeeCurrency, setManagementFeeCurrency] = React.useState<"USD" | "EUR" | "KES">("KES");

	const utils = trpc.useUtils();

	const linkedInput =
		props.scope === "SEARCH_CONSOLE"
			? { scope: "SEARCH_CONSOLE" as const, searchConsoleSiteUrl: props.siteUrl }
			: { scope: "GA4" as const, ga4PropertyId: props.propertyId };

	const resourceReady =
		props.scope === "SEARCH_CONSOLE" ? props.siteUrl.length > 0 : props.propertyId.length > 0;

	const { data: seoProduct, isLoading: isLoadingProduct } =
		trpc.clientSubscriptions.getSeoProductForSubscription.useQuery();
	const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery();
	const { data: linkedData, isLoading: isLoadingLink } =
		trpc.clientSubscriptions.getLinkedSeoSubscriptionByResource.useQuery(linkedInput, {
			enabled: resourceReady,
		});

	const createMutation = trpc.clientSubscriptions.createSeoSubscription.useMutation({
		onSuccess: () => {
			const planName =
				seoProduct?.plans.find((p) => p.id === productPlanId)?.name || "unknown";
			const domain =
				props.scope === "SEARCH_CONSOLE"
					? props.siteUrl
					: props.propertyDisplayName || props.propertyId;
			captureEvent("seo_report_subscription_created", {
				domain,
				frequency: planName,
			});
			toast.success("SEO subscription created successfully");
			setOpen(false);
			setTeamId("");
			setProductPlanId("");
			setManagementFee("");
			setManagementFeeCurrency("KES");
			void utils.clientSubscriptions.getLinkedSeoSubscriptionByResource.invalidate(linkedInput);
			void utils.clientSubscriptions.getAll.invalidate();
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.seoReports.listManageableSites.invalidate();
			void utils.seoReports.listGa4Properties.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create SEO subscription");
		},
	});

	const isLinked = linkedData?.hasLinkedSubscription === true;
	const selectedTeam = teams.find((t) => t.id === teamId);
	const selectedPlan = seoProduct?.plans.find((p) => p.id === productPlanId);

	const integrationLabel =
		props.scope === "SEARCH_CONSOLE" ? "Google Search Console" : "Google Analytics 4";

	const handleSubmit = () => {
		if (!teamId) {
			toast.error("Please select a team");
			return;
		}
		if (!productPlanId) {
			toast.error("Please select an SEO plan");
			return;
		}
		if (!managementFee.trim()) {
			toast.error("Please provide a management / reporting fee");
			return;
		}

		if (props.scope === "SEARCH_CONSOLE") {
			createMutation.mutate({
				scope: "SEARCH_CONSOLE",
				teamId,
				productPlanId,
				searchConsoleSiteUrl: props.siteUrl,
				managementFee: managementFee.trim(),
				managementFeeCurrency,
			});
		} else {
			createMutation.mutate({
				scope: "GA4",
				teamId,
				productPlanId,
				ga4PropertyId: props.propertyId,
				ga4DisplayName: props.propertyDisplayName?.trim() || undefined,
				managementFee: managementFee.trim(),
				managementFeeCurrency,
			});
		}
	};

	const readonlyResource =
		props.scope === "SEARCH_CONSOLE"
			? props.siteUrl
			: props.propertyDisplayName?.trim()
				? `${props.propertyDisplayName} (${props.propertyId})`
				: props.propertyId;

	return (
		<>
			<Button
				type="button"
				variant={isLinked ? "outline" : "default"}
				disabled={isLoadingLink || isLinked || !resourceReady}
				onClick={() => setOpen(true)}
				className="shrink-0"
			>
				{isLoadingLink
					? "Checking…"
					: isLinked
						? `Linked (${linkedData?.teamName ?? "team"})`
						: "Create subscription"}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Create SEO subscription - {integrationLabel}</DialogTitle>
						<DialogDescription>
							Link this {props.scope === "SEARCH_CONSOLE" ? "Search Console property" : "GA4 property"} to a
							team. Search Console and GA4 are separate subscriptions.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label>SEO product & plan</Label>
							<Select
								value={productPlanId}
								onValueChange={setProductPlanId}
								disabled={isLoadingProduct || createMutation.isPending}
							>
								<SelectTrigger>
									<SelectValue placeholder={isLoadingProduct ? "Loading plans…" : "Select a plan"} />
								</SelectTrigger>
								<SelectContent>
									{(seoProduct?.plans ?? []).map((plan) => (
										<SelectItem key={plan.id} value={plan.id}>
											{plan.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Management / reporting fee</Label>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
								<Input
									value={managementFee}
									onChange={(e) => setManagementFee(e.target.value)}
									placeholder="e.g. 10% or 15000"
									disabled={createMutation.isPending}
								/>
								<Select
									value={managementFeeCurrency}
									onValueChange={(v) => setManagementFeeCurrency(v as "USD" | "EUR" | "KES")}
									disabled={createMutation.isPending}
								>
									<SelectTrigger>
										<SelectValue placeholder="Currency" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="KES">KES</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{props.scope === "SEARCH_CONSOLE" ? "Search Console site" : "GA4 property"}</Label>
							<Input value={readonlyResource} disabled readOnly />
						</div>

						<div className="space-y-2">
							<Label>Link to team</Label>
							<Select
								value={teamId}
								onValueChange={setTeamId}
								disabled={isLoadingTeams || createMutation.isPending}
							>
								<SelectTrigger>
									<SelectValue placeholder={isLoadingTeams ? "Loading teams…" : "Select a team"} />
								</SelectTrigger>
								<SelectContent>
									{teams.map((team) => (
										<SelectItem key={team.id} value={team.id}>
											{team.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{(selectedTeam || selectedPlan) && (
							<div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
								{selectedTeam ? `Team: ${selectedTeam.name}` : ""}
								{selectedTeam && selectedPlan ? " · " : ""}
								{selectedPlan ? `Plan: ${selectedPlan.name}` : ""}
								{(selectedTeam || selectedPlan) && managementFee.trim().length > 0 ? " · " : ""}
								{managementFee.trim().length > 0
									? `Fee: ${managementFee.trim()} ${managementFeeCurrency}`
									: ""}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={
								createMutation.isPending ||
								teamId.length === 0 ||
								productPlanId.length === 0 ||
								managementFee.trim().length === 0
							}
						>
							{createMutation.isPending ? (
								<>
									<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
									Creating…
								</>
							) : (
								"Create subscription"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
