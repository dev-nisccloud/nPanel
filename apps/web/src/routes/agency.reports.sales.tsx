"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	Calendar as CalendarIcon,
	RefreshCw,
	TrendingUp,
	TrendingDown,
	FileText,
	Building2,
	Users,
	Globe,
	Percent,
	Layers,
	Wallet,
	ArrowUpRight,
	ArrowDownRight,
	Activity,
	PieChart,
	BarChart2,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CURRENCY = "KES";

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: CURRENCY,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

export default function SalesReportsPage() {
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
		from: subDays(new Date(), 30),
		to: new Date(),
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	const utils = trpc.useUtils();
	const overview = trpc.reports.sales.getSalesReportOverview.useQuery(
		{
			from: dateRange?.from,
			to: dateRange?.to,
			monthsTrend: 12,
			topTeamsLimit: 10,
		},
		{ staleTime: 1000 * 60 * 2 },
	);

	const handleRefresh = (e: React.MouseEvent) => {
		e.stopPropagation();
		void utils.reports.sales.getSalesReportOverview.invalidate();
	};

	const data = overview.data;
	const isLoading = overview.isLoading;

	if (isLoading || !data) {
		return <ReportsSkeleton />;
	}

	const {
		executive,
		mrrByCategory,
		mrrMovement,
		revenueTrend,
		customer,
		revenueByTeam,
		commission,
		activeSubscriptions,
		domainRenewalRate,
		invoicing,
		revenueByProduct,
		revenueByPlan,
		billingMix,
		averageDealSize,
		revenueConcentration,
		churnRate,
		subscriptionTenure,
		upgradesDowngrades,
		autoRenewRate,
		renewalsDue,
		expiringSoon,
		paymentVelocity,
		overdueAging,
		invoiceStatusMix,
		taxAndCredits,
		revenueByPaymentMethod,
		newCustomers,
		newSubscriptionsByProduct,
		orderPipeline,
		promoEffectiveness,
		marginByCategory,
		multiProductCustomers,
		topCustomersTrend,
		atRiskCustomers,
		timeComparison,
	} = data;
	const maxMrrCategory = Math.max(...mrrByCategory.map((c) => c.mrr), 1);

	return (
		<div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans">
			<div className="w-full max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-bold tracking-tight">
						Sales & Revenue Report
					</h1>
					<p className="text-xs text-muted-foreground">
						Actionable insights from subscriptions, invoicing, and product categories. Data is aggregated in real time.
					</p>
				</div>

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
					<div
						className="flex items-center gap-2"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
						role="group"
						aria-label="Date range and refresh"
					>
						<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-10 w-full md:w-auto justify-start shadow-sm border-muted/60 font-medium whitespace-nowrap px-4"
								>
									<CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
									{dateRange?.from && dateRange?.to
										? format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd")
											? format(dateRange.from, "MMM dd, yyyy")
											: `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
										: "Pick a date range"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="range"
									defaultMonth={dateRange?.from}
									selected={dateRange}
									onSelect={setDateRange}
									numberOfMonths={2}
									disabled={(date) => date > new Date()}
								/>
							</PopoverContent>
						</Popover>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-10 w-10 shadow-sm border-muted/60 shrink-0"
							onClick={handleRefresh}
							disabled={overview.isFetching}
							aria-label="Refresh report"
						>
							<RefreshCw
								className={cn("h-4 w-4", overview.isFetching && "animate-spin")}
								aria-hidden
							/>
						</Button>
					</div>
				</div>

				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="revenue">Revenue</TabsTrigger>
						<TabsTrigger value="retention">Retention</TabsTrigger>
						<TabsTrigger value="invoicing">Invoicing</TabsTrigger>
						<TabsTrigger value="pipeline">Pipeline</TabsTrigger>
						<TabsTrigger value="customers">Customers</TabsTrigger>
						<TabsTrigger value="comparisons">Comparisons</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="mt-6 space-y-6">
				{/* ─── Executive summary ─── */}
				<section aria-labelledby="executive-heading">
					<h2 id="executive-heading" className="sr-only">
						Executive summary
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="overflow-hidden border-muted/60 shadow-none bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
							<CardContent className="p-5">
								<div className="flex items-center justify-between gap-2">
									<div>
										<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
											Monthly Recurring Revenue
										</p>
										<p className="text-2xl font-bold tracking-tight mt-1">
											{formatCurrency(executive.mrr)}
										</p>
									</div>
									<div className="p-2 rounded-lg bg-primary/20 text-primary">
										<TrendingUp className="h-5 w-5" aria-hidden />
									</div>
								</div>
								<div className="mt-3 flex items-center gap-1.5 text-xs">
									{executive.mrrChangeAmount >= 0 ? (
										<ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
									) : (
										<ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden />
									)}
									<span
										className={cn(
											"font-semibold",
											executive.mrrChangeAmount >= 0
												? "text-emerald-600 dark:text-emerald-400"
												: "text-red-600 dark:text-red-400",
										)}
									>
										{executive.mrrChangeAmount >= 0 ? "+" : ""}
										{executive.mrrChangePercent.toFixed(1)}%
									</span>
									<span className="text-muted-foreground">
										vs last month ({formatCurrency(Math.abs(executive.mrrChangeAmount))})
									</span>
								</div>
							</CardContent>
						</Card>

						<MetricCard
							title="New MRR (this month)"
							value={formatCurrency(mrrMovement.newMrr)}
							icon={<TrendingUp className="h-4 w-4" aria-hidden />}
							color="emerald"
						/>
						<MetricCard
							title="Lost MRR (this month)"
							value={formatCurrency(mrrMovement.lostMrr)}
							icon={<TrendingDown className="h-4 w-4" aria-hidden />}
							color="red"
						/>
						<MetricCard
							title="Customers (with revenue)"
							value={String(customer.customerCount)}
							icon={<Users className="h-4 w-4" aria-hidden />}
							color="blue"
							sub={formatCurrency(customer.arpc) + " ARPC"}
						/>
					</div>
				</section>

				<Separator className="my-2" />

				{/* ─── MRR by category & Revenue trend ─── */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="lg:col-span-1 border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Layers className="h-4 w-4 text-primary" aria-hidden />
								MRR by category
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{mrrByCategory.map((c) => (
								<div key={c.category} className="space-y-2">
									<div className="flex justify-between items-baseline text-xs">
										<span className="font-medium">{c.label}</span>
										<span className="font-mono font-semibold">
											{formatCurrency(c.mrr)}
											{c.subscriptionCount > 0 && (
												<span className="text-muted-foreground font-normal ml-1">
													({c.subscriptionCount})
												</span>
											)}
										</span>
									</div>
									<Progress
										value={maxMrrCategory > 0 ? (c.mrr / maxMrrCategory) * 100 : 0}
										className="h-2"
									/>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="lg:col-span-2 border-muted/60 shadow-none overflow-hidden">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Activity className="h-4 w-4 text-primary" aria-hidden />
								Revenue trend (paid)
							</CardTitle>
							<CardDescription className="text-xs">
								Last 12 months
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-4">
							<div className="h-[240px] w-full flex items-end gap-1 pb-8">
								{revenueTrend.map((t) => {
									const maxPaid = Math.max(
										...revenueTrend.map((x) => x.paidRevenue),
										1,
									);
									const h = (t.paidRevenue / maxPaid) * 200;
									return (
										<TooltipProvider key={t.month}>
											<Tooltip delayDuration={0}>
												<TooltipTrigger asChild>
													<div
														className="flex-1 min-w-0 group relative rounded-t transition-colors bg-primary/30 hover:bg-primary/50"
														style={{ height: `${Math.max(8, h)}px` }}
													>
														<span className="sr-only">
															{t.month}: {formatCurrency(t.paidRevenue)}
														</span>
													</div>
												</TooltipTrigger>
												<TooltipContent side="top" className="text-xs">
													<p className="font-semibold">{t.month}</p>
													<p>Paid: {formatCurrency(t.paidRevenue)}</p>
													<p className="text-muted-foreground">
														{t.paidInvoiceCount} paid / {t.invoiceCount} invoices
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									);
								})}
							</div>
							<div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
								<span>{revenueTrend[0]?.month ?? ""}</span>
								<span>{revenueTrend[revenueTrend.length - 1]?.month ?? ""}</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ─── Subscriptions & Domain renewal & Invoicing ─── */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card className="border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Globe className="h-4 w-4 text-primary" aria-hidden />
								Active subscriptions
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Web hosting</span>
								<span className="font-mono font-semibold">{activeSubscriptions.webHosting}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Email hosting</span>
								<span className="font-mono font-semibold">{activeSubscriptions.emailHosting}</span>
							</div>
							<Separator />
							<div className="flex justify-between text-sm font-medium">
								<span>Total active</span>
								<span className="font-mono">{activeSubscriptions.totalActive}</span>
							</div>
						</CardContent>
					</Card>

					<Card className="border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Percent className="h-4 w-4 text-primary" aria-hidden />
								Domain renewal rate
							</CardTitle>
							<CardDescription className="text-xs">
								{domainRenewalRate.periodLabel}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tracking-tight">
								{domainRenewalRate.ratePercent.toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{domainRenewalRate.renewedCount} renewed / {domainRenewalRate.dueCount} due
							</p>
						</CardContent>
					</Card>

					<Card className="border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Wallet className="h-4 w-4 text-primary" aria-hidden />
								Invoicing health
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Invoiced this month</span>
								<span className="font-mono font-semibold">{formatCurrency(invoicing.invoicedThisMonth)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Paid this month</span>
								<span className="font-mono font-semibold">{formatCurrency(invoicing.paidThisMonth)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Overdue invoices</span>
								<span className="font-mono font-semibold">{invoicing.overdueCount}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Outstanding (A/R)</span>
								<span className="font-mono font-semibold">{formatCurrency(invoicing.outstandingAmount)}</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ─── Commission & Revenue by team ─── */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					<Card className="border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<FileText className="h-4 w-4 text-primary" aria-hidden />
								Commission (agency fees)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tracking-tight">
								{commission.commissionSubscriptionCount}{" "}
								<span className="text-sm font-normal text-muted-foreground">
									subscriptions
								</span>
							</p>
							{commission.hasBaseData ? (
								<p className="text-xs text-muted-foreground mt-1">
									Est. fees: {formatCurrency(commission.estimatedFeesAmount)}
								</p>
							) : (
								<p className="text-xs text-muted-foreground mt-1">
									Base amount not recorded; fee total unavailable.
								</p>
							)}
						</CardContent>
					</Card>

					<Card className="lg:col-span-3 border-muted/60 shadow-none">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold tracking-tight uppercase opacity-80 flex items-center gap-2">
								<Building2 className="h-4 w-4 text-primary" aria-hidden />
								Revenue by company (paid in period)
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{revenueByTeam.length > 0 ? (
								revenueByTeam.map((t) => (
									<div key={t.teamId} className="space-y-2">
										<div className="flex justify-between items-baseline text-sm">
											<span className="font-medium truncate max-w-[60%]">{t.teamName}</span>
											<span className="font-mono font-semibold shrink-0">
												{formatCurrency(t.amount)}
												{t.percentOfTotal != null && (
													<span className="text-muted-foreground font-normal ml-1">
														({t.percentOfTotal.toFixed(1)}%)
													</span>
												)}
											</span>
										</div>
										<Progress
											value={t.percentOfTotal ?? 0}
											className="h-1.5"
										/>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground italic py-4">
									No paid invoices in this period.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
					</TabsContent>

					<TabsContent value="revenue" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80 flex items-center gap-2">
										<PieChart className="h-4 w-4 text-primary" aria-hidden /> Revenue by product
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{revenueByProduct.length > 0 ? (
										revenueByProduct.slice(0, 10).map((p) => (
											<div key={p.productId} className="flex justify-between text-sm">
												<span className="truncate max-w-[60%]">{p.productName}</span>
												<span className="font-mono font-semibold shrink-0">{formatCurrency(p.mrr)} ({p.subscriptionCount})</span>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">No product revenue</p>
									)}
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80 flex items-center gap-2">
										<Layers className="h-4 w-4 text-primary" aria-hidden /> Revenue by plan
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{revenueByPlan.length > 0 ? (
										revenueByPlan.slice(0, 10).map((p) => (
											<div key={p.planId} className="flex justify-between text-sm">
												<span className="truncate max-w-[60%]">{p.planName}  ? {p.productName}</span>
												<span className="font-mono font-semibold shrink-0">{formatCurrency(p.mrr)}</span>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">No plan revenue</p>
									)}
								</CardContent>
							</Card>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Billing mix</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{billingMix.map((b) => (
										<div key={b.billingCycle} className="flex justify-between text-sm">
											<span>{b.billingCycle}</span>
											<span className="font-mono">{formatCurrency(b.mrr)} ({b.percentOfMrr.toFixed(0)}%)</span>
										</div>
									))}
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Average deal size</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-bold">Mean: {formatCurrency(averageDealSize.mean)}</p>
									<p className="text-sm text-muted-foreground">Median: {formatCurrency(averageDealSize.median)}</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Revenue concentration</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<p className="text-sm">Top 5: {revenueConcentration.top5Percent.toFixed(1)}% ({formatCurrency(revenueConcentration.top5Amount)})</p>
									<p className="text-sm">Top 10: {revenueConcentration.top10Percent.toFixed(1)}% ({formatCurrency(revenueConcentration.top10Amount)})</p>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="retention" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Churn rate</CardTitle>
									<CardDescription className="text-xs">{churnRate.periodLabel}</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{churnRate.ratePercent.toFixed(1)}%</p>
									<p className="text-xs text-muted-foreground">{churnRate.churnedCount} churned / {churnRate.activeAtStartCount} at start</p>
									<p className="text-xs mt-1">Lost MRR: {formatCurrency(churnRate.lostMrr)}</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Auto-renew rate</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{autoRenewRate.ratePercent.toFixed(0)}%</p>
									<p className="text-xs text-muted-foreground">{autoRenewRate.withAutoRenew} / {autoRenewRate.totalActive} active</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Upgrades / Downgrades</CardTitle>
									<CardDescription className="text-xs">{upgradesDowngrades.periodLabel}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-1 text-sm">
									<p>Up: {upgradesDowngrades.upgradesCount} (+{formatCurrency(upgradesDowngrades.upgradesMrrImpact)} MRR)</p>
									<p>Down: {upgradesDowngrades.downgradesCount} (−{formatCurrency(upgradesDowngrades.downgradesMrrImpact)} MRR)</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Expiring soon</CardTitle>
									<CardDescription className="text-xs">Next {expiringSoon.withinDays} days</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{expiringSoon.count}</p>
									<p className="text-xs text-muted-foreground">{formatCurrency(expiringSoon.mrr)} MRR at risk</p>
								</CardContent>
							</Card>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Subscription tenure</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{subscriptionTenure.map((t) => (
										<div key={t.label} className="flex justify-between text-sm">
											<span>{t.label}</span>
											<span className="font-mono font-semibold">{t.subscriptionCount}</span>
										</div>
									))}
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Renewals due</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex justify-between text-sm">
										<span>0?30 days</span>
										<span className="font-mono">{renewalsDue.days30.count} subs  ? {formatCurrency(renewalsDue.days30.mrr)} MRR</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>31?60 days</span>
										<span className="font-mono">{renewalsDue.days60.count}  ? {formatCurrency(renewalsDue.days60.mrr)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>61?90 days</span>
										<span className="font-mono">{renewalsDue.days90.count}  ? {formatCurrency(renewalsDue.days90.mrr)}</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="invoicing" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Payment velocity</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-bold">Avg: {paymentVelocity.avgDaysToPay} days</p>
									<p className="text-sm text-muted-foreground">Median: {paymentVelocity.medianDaysToPay} days</p>
									<p className="text-xs mt-1">{paymentVelocity.invoiceCount} invoices</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Tax & credits</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1 text-sm">
									<p>Tax this month: {formatCurrency(taxAndCredits.taxCollectedThisMonth)}</p>
									<p>Discounts: {formatCurrency(taxAndCredits.discountsThisMonth)}</p>
									<p>Credit notes (period): {formatCurrency(taxAndCredits.creditNotesIssuedPeriod)}</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Invoice status mix</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1 text-xs">
									{(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF"] as const).map((s) => (
										<div key={s} className="flex justify-between">
											<span>{s.replace("_", " ")}</span>
											<span className="font-mono">{(invoiceStatusMix as Record<string, number>)[s] ?? 0}</span>
										</div>
									))}
									<Separator className="my-2" />
									<p className="font-semibold">Total: {invoiceStatusMix.totalCount}</p>
								</CardContent>
							</Card>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Overdue aging</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>0?30 days</span>
										<span className="font-mono">{overdueAging.bucket0_30.count}  ? {formatCurrency(overdueAging.bucket0_30.amount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>31?60 days</span>
										<span className="font-mono">{overdueAging.bucket31_60.count}  ? {formatCurrency(overdueAging.bucket31_60.amount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>61?90 days</span>
										<span className="font-mono">{overdueAging.bucket61_90.count}  ? {formatCurrency(overdueAging.bucket61_90.amount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>90+ days</span>
										<span className="font-mono">{overdueAging.bucket90Plus.count}  ? {formatCurrency(overdueAging.bucket90Plus.amount)}</span>
									</div>
									<Separator className="my-2" />
									<p className="font-semibold">Total: {overdueAging.totalCount}  ? {formatCurrency(overdueAging.totalAmount)}</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Revenue by payment method</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{revenueByPaymentMethod.length > 0 ? (
										revenueByPaymentMethod.map((m) => (
											<div key={m.method} className="flex justify-between text-sm">
												<span>{m.method.replace("_", " ")}</span>
												<span className="font-mono">{formatCurrency(m.amount)} ({m.percentOfTotal.toFixed(0)}%)</span>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">No payment data in period</p>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="pipeline" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">New customers</CardTitle>
									<CardDescription className="text-xs">{newCustomers.periodLabel}</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{newCustomers.thisMonth}</p>
									<p className="text-xs text-muted-foreground">Prev month: {newCustomers.previousMonth}</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Order pipeline</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1 text-sm">
									{(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "PARTIAL"] as const).map((s) => {
										const entry = (orderPipeline as unknown as Record<string, { count: number; value: number }>)[s];
										return (
										<div key={s} className="flex justify-between">
											<span>{s}</span>
											<span className="font-mono">{entry?.count ?? 0}  ? {formatCurrency(entry?.value ?? 0)}</span>
										</div>
									);
									})}
									<Separator className="my-2" />
									<p className="font-semibold">Conversion: {orderPipeline.conversionPercent.toFixed(1)}%</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Promo effectiveness</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1 text-sm">
									<p>Redemptions: {promoEffectiveness.redemptionsThisPeriod}</p>
									<p>Orders with promo: {promoEffectiveness.ordersWithPromo}</p>
									<p>Revenue with promo: {formatCurrency(promoEffectiveness.revenueWithPromo)}</p>
									<p>Revenue without: {formatCurrency(promoEffectiveness.revenueWithoutPromo)}</p>
									{promoEffectiveness.topPromos.length > 0 && (
										<>
											<Separator className="my-2" />
											<p className="text-xs font-semibold">Top promos</p>
											{promoEffectiveness.topPromos.map((pr) => (
												<p key={pr.promoCode} className="text-xs">{pr.promoCode}: {pr.redemptions}</p>
											))}
										</>
									)}
								</CardContent>
							</Card>
						</div>
						<Card className="border-muted/60 shadow-none">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-bold uppercase opacity-80">New subscriptions by product (this month)</CardTitle>
							</CardHeader>
							<CardContent>
								{newSubscriptionsByProduct.length > 0 ? (
									<div className="flex flex-wrap gap-4">
										{newSubscriptionsByProduct.map((p) => (
											<span key={p.productId} className="text-sm font-medium px-2 py-1 rounded bg-muted">
												{p.productName}: {p.count}
											</span>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground italic">No new subscriptions this month</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="customers" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Multi-product customers</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{multiProductCustomers.multiProductPercent.toFixed(0)}%</p>
									<p className="text-sm text-muted-foreground">{multiProductCustomers.multiProductCount} multi-product / {multiProductCustomers.totalWithSubs} total</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80 flex items-center gap-2">
										<AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden /> At-risk customers
									</CardTitle>
									<CardDescription className="text-xs">{atRiskCustomers.description}</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{atRiskCustomers.count}</p>
									<p className="text-xs text-muted-foreground">No payment in {atRiskCustomers.daysWithoutPayment}+ days</p>
								</CardContent>
							</Card>
						</div>
						<div className="grid grid-cols-1 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Margin by category</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b">
													<th className="text-left py-2">Category</th>
													<th className="text-right py-2">Revenue</th>
													<th className="text-right py-2">Cost</th>
													<th className="text-right py-2">Margin %</th>
													<th className="text-right py-2">Subs</th>
												</tr>
											</thead>
											<tbody>
												{marginByCategory.map((m) => (
													<tr key={m.category} className="border-b border-muted/50">
														<td className="py-1.5">{m.category}</td>
														<td className="text-right font-mono">{formatCurrency(m.revenue)}</td>
														<td className="text-right font-mono">{formatCurrency(m.cost)}</td>
														<td className="text-right font-mono">{m.marginPercent.toFixed(1)}%</td>
														<td className="text-right">{m.subscriptionCount}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Top customers (MRR trend)</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{topCustomersTrend.length > 0 ? (
										topCustomersTrend.map((t) => (
											<div key={t.teamId} className="flex justify-between items-center text-sm">
												<span className="truncate max-w-[40%]">{t.teamName}</span>
												<span className="font-mono">{formatCurrency(t.mrrCurrent)}</span>
												<span className={cn("font-medium", t.changePercent >= 0 ? "text-emerald-600" : "text-red-600")}>
													{t.changePercent >= 0 ? "+" : ""}{t.changePercent.toFixed(0)}%
												</span>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">No team MRR data</p>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="comparisons" className="mt-6 space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">MRR MoM</CardTitle>
								</CardHeader>
								<CardContent>
									<p className={cn("text-2xl font-bold", timeComparison.mrrMonthOverMonthPercent >= 0 ? "text-emerald-600" : "text-red-600")}>
										{timeComparison.mrrMonthOverMonthPercent >= 0 ? "+" : ""}{timeComparison.mrrMonthOverMonthPercent.toFixed(1)}%
									</p>
									<p className="text-xs text-muted-foreground">vs previous month</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Paid revenue MoM</CardTitle>
								</CardHeader>
								<CardContent>
									<p className={cn("text-2xl font-bold", timeComparison.paidRevenueMonthOverMonthPercent >= 0 ? "text-emerald-600" : "text-red-600")}>
										{timeComparison.paidRevenueMonthOverMonthPercent >= 0 ? "+" : ""}{timeComparison.paidRevenueMonthOverMonthPercent.toFixed(1)}%
									</p>
									<p className="text-xs text-muted-foreground">vs previous month</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80">Paid revenue YoY</CardTitle>
								</CardHeader>
								<CardContent>
									<p className={cn("text-2xl font-bold", (timeComparison.paidRevenueYearOverYearPercent ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
										{timeComparison.paidRevenueYearOverYearPercent != null
											? `${timeComparison.paidRevenueYearOverYearPercent >= 0 ? "+" : ""}${timeComparison.paidRevenueYearOverYearPercent.toFixed(1)}%`
											: "??"}
									</p>
									<p className="text-xs text-muted-foreground">vs same month last year</p>
								</CardContent>
							</Card>
							<Card className="border-muted/60 shadow-none bg-primary/5 border-primary/20">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-bold uppercase opacity-80 flex items-center gap-2">
										<BarChart2 className="h-4 w-4 text-primary" aria-hidden /> Annual run rate
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{formatCurrency(timeComparison.annualRunRate)}</p>
									<p className="text-xs text-muted-foreground">MRR × 12</p>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

function MetricCard({
	title,
	value,
	icon,
	color,
	sub,
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	color: "blue" | "emerald" | "red" | "orange";
	sub?: string;
}) {
	const colorClasses = {
		blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
		emerald:
			"bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
		red: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
		orange:
			"bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
	};

	return (
		<Card className="overflow-hidden border-muted/60 shadow-none">
			<CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
				<div className="flex items-center justify-between">
					<div
						className={cn(
							"p-1.5 rounded-md border transition-colors",
							colorClasses[color],
						)}
					>
						{icon}
					</div>
				</div>
				<div>
					<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
						{title}
					</p>
					<h3 className="text-xl font-bold tracking-tight">{value}</h3>
					{sub && (
						<p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function ReportsSkeleton() {
	return (
		<div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto space-y-8">
				<div className="space-y-2">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-full max-w-md" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-32 w-full rounded-xl" />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Skeleton className="h-72 w-full rounded-xl" />
					<Skeleton className="lg:col-span-2 h-72 w-full rounded-xl" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className="h-44 w-full rounded-xl" />
					))}
				</div>
			</div>
		</div>
	);
}
