"use client";

import { Link, useLocation } from "react-router";
import { ArrowUpRight } from "lucide-react";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetricStats } from "@/components/dashboard-metric-stats";
import { trpc } from "@/utils/trpc";

const REALTIME_QUERY_OPTIONS = {
	placeholderData: (prev: unknown) => prev,
	refetchOnWindowFocus: false,
	refetchOnMount: true,
} as const;

function SectionCardsSkeleton() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{[1, 2, 3, 4].map((i) => (
				<Card key={i} className="@container/card">
					<CardHeader>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-20 mt-2" />
					</CardHeader>
					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-40" />
					</CardFooter>
				</Card>
			))}
		</div>
	);
}

function MetricCardLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			to={href}
			className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
		>
			{label}
			<ArrowUpRight className="h-3.5 w-3.5" />
		</Link>
	);
}

export function SectionCards() {
	const { pathname } = useLocation();
	const teamSlug = pathname?.split("/")[1] ?? "";

	const { data: domainsSummary, isLoading: isDomainsLoading } =
		trpc.clientSubscriptions.getTeamLiveDomainsSummary.useQuery(
			{ teamSlug },
			{ ...REALTIME_QUERY_OPTIONS, enabled: !!teamSlug },
		);

	const { data: teamData, isLoading: isTeamLoading } =
		trpc.teams.getTeamIdBySlug.useQuery(
			{ slug: teamSlug },
			{ enabled: !!teamSlug, staleTime: 5 * 60 * 1000 },
		);

	const teamId = teamData?.id;

	const { data: scopedInvoiceData, isLoading: isScopedInvoicesLoading } =
		trpc.invoicing.list.useQuery(
			{ teamId: teamId ?? undefined, limit: 100 },
			{ ...REALTIME_QUERY_OPTIONS, enabled: !!teamId },
		);

	const { data: hostingSummary, isLoading: isHostingLoading } =
		trpc.clientSubscriptions.getTeamHostingSummary.useQuery(
			{ teamSlug },
			{ ...REALTIME_QUERY_OPTIONS, enabled: !!teamSlug },
		);

	const { data: subscriptionSummary, isLoading: isSubsLoading } =
		trpc.clientSubscriptions.getTeamSubscriptionSummary.useQuery(
			{ teamSlug },
			{ ...REALTIME_QUERY_OPTIONS, enabled: !!teamSlug },
		);

	const isLoading =
		isTeamLoading ||
		isDomainsLoading ||
		isScopedInvoicesLoading ||
		isHostingLoading ||
		isSubsLoading;

	if (isLoading) {
		return <SectionCardsSkeleton />;
	}

	const domainsTotal = domainsSummary?.total ?? 0;
	const domainsActive = domainsSummary?.active ?? 0;
	const domainsExpired = domainsSummary?.expired ?? 0;

	const invoices = scopedInvoiceData?.invoices ?? [];
	const invoicesTotal = scopedInvoiceData?.total ?? 0;
	const invoicesPaid = invoices.filter((i) => i.status === "PAID").length;
	const invoicesUnpaid = invoicesTotal - invoicesPaid;

	const hostingTotal = hostingSummary?.total ?? 0;
	const hostingActive = hostingSummary?.active ?? 0;
	const hostingOther = hostingSummary?.other ?? 0;

	const subsTotal = subscriptionSummary?.total ?? 0;
	const subsActive = subscriptionSummary?.active ?? 0;
	const subsOther = subscriptionSummary?.other ?? 0;

	const cardLinks = [
		{ label: "Domains", href: `/${teamSlug}/domains-portfolio` },
		{ label: "Invoices", href: `/${teamSlug}/invoices` },
		{ label: "Hosting", href: `/${teamSlug}/hosting` },
		{ label: "Subscriptions", href: `/${teamSlug}/subscriptions` },
	] as const;

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Domains</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{domainsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{ label: "Active", value: domainsActive, variant: "positive" },
							{ label: "Expired", value: domainsExpired, variant: "negative" },
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...cardLinks[0]} />
					</div>
				</CardFooter>
			</Card>

			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Invoices</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{invoicesTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{ label: "Paid", value: invoicesPaid, variant: "positive" },
							{ label: "Unpaid", value: invoicesUnpaid, variant: "negative" },
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...cardLinks[1]} />
					</div>
				</CardFooter>
			</Card>

			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Hosting</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{hostingTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{ label: "Active", value: hostingActive, variant: "positive" },
							{ label: "Inactive", value: hostingOther, variant: "negative" },
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...cardLinks[2]} />
					</div>
				</CardFooter>
			</Card>

			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Subscriptions</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{subsTotal}
					</CardTitle>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<DashboardMetricStats
						items={[
							{ label: "Active", value: subsActive, variant: "positive" },
							{ label: "Pending/Expired", value: subsOther, variant: "negative" },
						]}
					/>
					<div className="text-muted-foreground">
						<MetricCardLink {...cardLinks[3]} />
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
