"use client";

import { MetricPieCard } from "@/components/dashboard/metric-pie-card";
import type { CustomerDashboardMetrics } from "./use-customer-dashboard-metrics";

const COLORS = {
	positive: "#10b981",
	negative: "#ef4444",
	warning: "#f59e0b",
};

export function DashboardMetricsGrid({ metrics }: { metrics: CustomerDashboardMetrics }) {
	const { teamSlug } = metrics;
	const base = `/${teamSlug}`;

	return (
		<section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			<MetricPieCard
				title="Domains"
				description="Portfolio health"
				loading={metrics.domains.isLoading}
				error={metrics.domains.isError}
				slices={[
					{ key: "active", label: "Active", value: metrics.domains.active ?? 0, color: COLORS.positive },
					{ key: "expired", label: "Expired", value: metrics.domains.expired ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.domains.total}
				centerLabel="total"
				stats={[
					{ label: "Active", value: metrics.domains.active, tone: "positive" },
					{ label: "Expired", value: metrics.domains.expired, tone: "negative" },
				]}
				actions={[
					{ label: "Portfolio", href: `${base}/domains-portfolio` },
					{ label: "Register", href: `${base}/domains` },
				]}
			/>

			<MetricPieCard
				title="Hosting"
				description="Website hosting"
				loading={metrics.hosting.isLoading}
				error={metrics.hosting.isError}
				slices={[
					{ key: "active", label: "Active", value: metrics.hosting.active ?? 0, color: COLORS.positive },
					{ key: "inactive", label: "Inactive", value: metrics.hosting.inactive ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.hosting.total}
				centerLabel="plans"
				stats={[
					{ label: "Active", value: metrics.hosting.active, tone: "positive" },
					{ label: "Inactive", value: metrics.hosting.inactive, tone: "negative" },
				]}
				actions={[
					{ label: "Hosting", href: `${base}/hosting` },
					{ label: "WordPress", href: `${base}/wordpress` },
				]}
			/>

			<MetricPieCard
				title="Invoices"
				description="Billing status"
				loading={metrics.invoices.isLoading}
				error={metrics.invoices.isError}
				slices={[
					{ key: "paid", label: "Paid", value: metrics.invoices.paid ?? 0, color: COLORS.positive },
					{ key: "unpaid", label: "Unpaid", value: metrics.invoices.unpaid ?? 0, color: COLORS.warning },
					{ key: "overdue", label: "Overdue", value: metrics.invoices.overdue ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.invoices.total}
				centerLabel="invoices"
				stats={[
					{ label: "Paid", value: metrics.invoices.paid, tone: "positive" },
					{ label: "Unpaid", value: metrics.invoices.unpaid, tone: "negative" },
					{ label: "Overdue", value: metrics.invoices.overdue, tone: "negative" },
				]}
				actions={[{ label: "Invoices", href: `${base}/invoices` }]}
			/>

			<MetricPieCard
				title="Subscriptions"
				description="Active services"
				loading={metrics.subscriptions.isLoading}
				error={metrics.subscriptions.isError}
				slices={[
					{ key: "active", label: "Active", value: metrics.subscriptions.active ?? 0, color: COLORS.positive },
					{ key: "other", label: "Pending / expired", value: metrics.subscriptions.other ?? 0, color: COLORS.warning },
				]}
				centerValue={metrics.subscriptions.total}
				centerLabel="subs"
				stats={[
					{ label: "Active", value: metrics.subscriptions.active, tone: "positive" },
					{ label: "Pending / expired", value: metrics.subscriptions.other, tone: "negative" },
				]}
				actions={[
					{ label: "Subscriptions", href: `${base}/subscriptions` },
					{ label: "Marketplace", href: `${base}/marketplace` },
				]}
			/>
		</section>
	);
}
