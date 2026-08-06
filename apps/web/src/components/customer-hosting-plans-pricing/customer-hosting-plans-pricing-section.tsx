"use client";

import {
	Globe,
	HardDrive,
	Mail,
	MapPin,
	Network,
	Server,
	ShieldCheck,
	Database,
	Zap,
	HelpCircle,
	type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CONTACT_TEL_HREF } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type {
	CustomerHostingPlansPricingConfig,
	HostingPlan,
	ProductFeatureRow,
} from "./types";

function deriveMonthlyPrice(niscPrice: string | null | undefined, billingCycle: string) {
	if (!niscPrice) return 0;
	const price = parseFloat(niscPrice);
	if (isNaN(price)) return 0;

	if (billingCycle === "YEARLY") return Math.round(price / 12);
	if (billingCycle === "BIENNIALLY") return Math.round(price / 24);
	return Math.round(price);
}

function formatKes(amount: number) {
	return new Intl.NumberFormat("en-KE", {
		style: "currency",
		currency: "KES",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function getFeatureIcon(label: string): LucideIcon {
	const value = label.toLowerCase();
	if (value.includes("website") || value.includes("domain") || value.includes("site")) return Globe;
	if (value.includes("storage") || value.includes("disk") || value.includes("nvme")) return HardDrive;
	if (value.includes("bandwidth") || value.includes("traffic")) return Network;
	if (value.includes("email") || value.includes("mailbox")) return Mail;
	if (value.includes("ssl") || value.includes("security") || value.includes("malware")) return ShieldCheck;
	if (value.includes("backup")) return Database;
	if (value.includes("cpanel") || value.includes("panel")) return Server;
	if (value.includes("wordpress") || value.includes("staging") || value.includes("cache")) return Zap;
	return Zap;
}

function getFeatureDisplay(plan: HostingPlan, featureIndex: number): string | null {
	const cell = plan.featureValues?.[featureIndex];
	if (!cell?.available) return null;
	if (cell.valueOverride != null && cell.valueOverride !== "") return cell.valueOverride;
	return "Included";
}

function FeatureRow({
	label,
	value,
	description,
}: {
	label: string;
	value: string;
	description?: string;
}) {
	const Icon = getFeatureIcon(label);

	return (
		<div className="flex items-start gap-2">
			<Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					{description ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
									onClick={(event) => event.stopPropagation()}
									aria-label={`More info about ${label}`}
								>
									<HelpCircle className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent side="top" className="max-w-xs text-sm">
								{description}
							</TooltipContent>
						</Tooltip>
					) : null}
				</div>
				<p className="font-semibold text-primary">{value}</p>
			</div>
		</div>
	);
}

function HostingPlanCard({
	plan,
	productFeatures,
	config,
	onGetStarted,
}: {
	plan: HostingPlan;
	productFeatures: ProductFeatureRow[];
	config: CustomerHostingPlansPricingConfig;
	onGetStarted: (plan: HostingPlan, displayPrice: number) => void;
}) {
	const PlanIcon = config.planIcon;
	const displayPrice = deriveMonthlyPrice(plan.niscPrice, plan.billingCycle);
	const visibleFeatures = productFeatures
		.map((feature, index) => ({
			feature,
			value: getFeatureDisplay(plan, index),
		}))
		.filter((entry) => entry.value != null);

	return (
		<Card className="group flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-md">
			<CardHeader className="pb-3">
				<div className="mb-1 flex items-start justify-between gap-3">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
						<PlanIcon className="h-6 w-6 text-primary" />
					</div>
					<div className="flex flex-col items-end gap-2">
						{plan.isPopular && <Badge variant="secondary">Popular</Badge>}
						{plan.isRecommended && (
							<Badge
								variant="outline"
								className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
							>
								Recommended
							</Badge>
						)}
						<Badge variant="default" className="text-[10px] uppercase">
							Available
						</Badge>
					</div>
				</div>

				<CardTitle className="line-clamp-2 text-base font-semibold" title={plan.name}>
					{plan.name}
				</CardTitle>

				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Server location
						</p>
						<div className="mt-1 flex items-center gap-1.5">
							<MapPin className="h-4 w-4 shrink-0 text-primary" />
							<p className="line-clamp-1 text-sm font-semibold">
								{config.locationLabel ?? "Nairobi, Kenya"}
							</p>
						</div>
					</div>
					<Badge variant="outline" className="border-primary text-primary">
						{config.highlightBadge}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-4 pt-0">
				<div className="grid grid-cols-1 gap-3">
					<div className="rounded-lg border bg-muted/20 p-3">
						<p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Plan includes
						</p>
						<ScrollArea className="h-[220px] w-full" thumbClassName="bg-primary">
							<div className="flex flex-col gap-3 pr-3 text-sm">
								{visibleFeatures.length > 0
									? visibleFeatures.map(({ feature, value }) => (
											<FeatureRow
												key={feature.key}
												label={feature.label}
												value={value!}
												description={feature.description}
											/>
										))
									: config.fallbackFeatures.map((feature) => (
											<FeatureRow
												key={feature.label}
												label={feature.label}
												value={feature.value}
												description={feature.description}
											/>
										))}
							</div>
						</ScrollArea>
					</div>
				</div>

				<div className="mt-auto rounded-lg border bg-muted/20 p-3">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</p>
					<div className="mt-1 flex flex-col gap-0.5">
						{displayPrice === 0 ? (
							<p className="text-xl font-bold leading-tight text-primary">Contact us</p>
						) : (
							<p className="text-xl font-bold leading-tight text-primary">
								{formatKes(displayPrice)}
								<span className="ml-1 align-super text-xs font-semibold text-muted-foreground">
									/mo
								</span>
							</p>
						)}
					</div>
				</div>

				<div className="flex justify-center gap-2 pt-1">
					{displayPrice === 0 ? (
						<Button className="w-full bg-primary text-primary-foreground" asChild>
							<a href={CONTACT_TEL_HREF}>Contact us</a>
						</Button>
					) : (
						<Button
							className="w-full bg-primary text-primary-foreground"
							onClick={() => onGetStarted(plan, displayPrice)}
						>
							Get Started
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function PlanSkeleton() {
	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-3">
				<div className="mb-2 flex justify-between">
					<Skeleton className="h-12 w-12 rounded-xl" />
					<Skeleton className="h-6 w-16" />
				</div>
				<Skeleton className="mb-2 h-6 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-4">
				<Skeleton className="h-48 w-full rounded-lg" />
				<Skeleton className="mt-auto h-20 w-full rounded-lg" />
				<Skeleton className="h-10 w-full" />
			</CardContent>
		</Card>
	);
}

export type CustomerHostingPlansPricingSectionProps = {
	config: CustomerHostingPlansPricingConfig;
	plans: HostingPlan[];
	productFeatures: ProductFeatureRow[];
	isLoading?: boolean;
	error?: string | null;
	className?: string;
	onGetStarted: (plan: HostingPlan, displayPrice: number) => void;
};

export function CustomerHostingPlansPricingSection({
	config,
	plans,
	productFeatures,
	isLoading = false,
	error = null,
	className,
	onGetStarted,
}: CustomerHostingPlansPricingSectionProps) {
	return (
		<TooltipProvider>
			<section className={cn("bg-muted/10 py-8 md:py-10", className)}>
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-8 text-center md:mb-10">
						<h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">{config.title}</h2>
						<p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
							{config.description}
						</p>
					</div>

					{error && (
						<Alert variant="destructive" className="mx-auto mb-8 max-w-2xl">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{isLoading ? (
							Array.from({ length: 3 }).map((_, index) => <PlanSkeleton key={index} />)
						) : plans.length === 0 ? (
							<div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 py-12">
								<p className="mb-4 text-muted-foreground">No plans available at this time.</p>
								<Button asChild variant="outline">
									<a href={CONTACT_TEL_HREF}>Contact us</a>
								</Button>
							</div>
						) : (
							plans.map((plan) => (
								<HostingPlanCard
									key={plan.id}
									plan={plan}
									productFeatures={productFeatures}
									config={config}
									onGetStarted={onGetStarted}
								/>
							))
						)}
					</div>
				</div>
			</section>
		</TooltipProvider>
	);
}
