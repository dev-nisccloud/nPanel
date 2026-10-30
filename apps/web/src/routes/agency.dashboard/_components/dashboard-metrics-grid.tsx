"use client";

import { Icons } from "@/components/icons";
import { AgencyMetricCard } from "./agency-metric-card";
import type { AgencyDashboardMetrics } from "./use-agency-dashboard-metrics";

const COLORS = {
	positive: "#10b981",
	negative: "#ef4444",
	warning: "#f59e0b",
	clients: "#3b82f6",
	agency: "#8b5cf6",
};

export function DashboardMetricsGrid({ metrics }: { metrics: AgencyDashboardMetrics }) {
	const connected = metrics.mediaBuying.platforms.filter((p) => p.connected).length;
	const disconnected = Math.max(0, metrics.mediaBuying.platforms.length - connected);

	return (
		<section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
			<AgencyMetricCard
				icon={Icons.Site}
				title="Domains"
				description="Portfolio health"
				loading={metrics.domains.isLoading}
				error={metrics.domains.total == null && metrics.domains.isError}
				slices={[
					{ key: "active", label: "Active", value: metrics.domains.active ?? 0, color: COLORS.positive },
					{ key: "expired", label: "Expired", value: metrics.domains.expired ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.domains.total}
				centerLabel="total"
				stats={[
					{ label: "Active", value: metrics.domains.active, tone: "positive" },
					{ label: "Expired", value: metrics.domains.expired, tone: "negative" },
					{ label: "OP balance", value: metrics.balances.opLoading ? "…" : metrics.balances.op },
					{ label: "KC balance", value: metrics.balances.kc },
				]}
				actions={[
					{ label: "Portfolio", href: "/agency/domains-portfolio" },
					{ label: "Register", href: "/agency/domains" },
				]}
			/>

			<AgencyMetricCard
				icon={Icons.Hosting}
				title="Hosting"
				description="Plesk subscriptions"
				loading={metrics.hosting.isLoading}
				error={metrics.hosting.isError}
				slices={[
					{ key: "active", label: "Active", value: metrics.hosting.active ?? 0, color: COLORS.positive },
					{ key: "suspended", label: "Suspended", value: metrics.hosting.suspended ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.hosting.total}
				centerLabel="plans"
				stats={[
					{ label: "Active", value: metrics.hosting.active, tone: "positive" },
					{ label: "Suspended", value: metrics.hosting.suspended, tone: "negative" },
				]}
				actions={[
					{ label: "Hosting", href: "/agency/hosting" },
					{ label: "VPS", href: "/agency/vps" },
				]}
			/>

			<AgencyMetricCard
				icon={Icons.Invoices}
				title="Invoices"
				description="KRA eTIMS sync"
				loading={metrics.invoices.isLoading}
				error={metrics.invoices.isError}
				slices={[
					{ key: "synced", label: "KRA synced", value: metrics.invoices.kraSynced ?? 0, color: COLORS.positive },
					{ key: "pending", label: "Not synced", value: metrics.invoices.notSynced ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.invoices.total}
				centerLabel="invoices"
				stats={[
					{ label: "Synced", value: metrics.invoices.kraSynced, tone: "positive" },
					{ label: "Not synced", value: metrics.invoices.notSynced, tone: "negative" },
				]}
				actions={[
					{ label: "Invoices", href: "/agency/invoices" },
					{ label: "New invoice", href: "/agency/invoices/create" },
				]}
			/>

			<AgencyMetricCard
				icon={Icons.Subscriptions}
				title="Payments"
				description="Gateway outcomes"
				loading={metrics.transactions.isLoading}
				error={metrics.transactions.isError}
				slices={[
					{ key: "success", label: "Success", value: metrics.transactions.success ?? 0, color: COLORS.positive },
					{ key: "failed", label: "Failed", value: metrics.transactions.failed ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.transactions.total}
				centerLabel="txns"
				stats={[
					{ label: "Success", value: metrics.transactions.success, tone: "positive" },
					{ label: "Failed", value: metrics.transactions.failed, tone: "negative" },
				]}
				actions={[{ label: "Transactions", href: "/agency/transactions" }]}
			/>

			<AgencyMetricCard
				icon={Icons.File}
				title="Orders"
				description="Service orders"
				loading={metrics.orders.isLoading}
				error={metrics.orders.isError}
				slices={[
					{ key: "completed", label: "Processed", value: metrics.orders.completed ?? 0, color: COLORS.positive },
					{ key: "failed", label: "Failed", value: metrics.orders.failed ?? 0, color: COLORS.negative },
				]}
				centerValue={metrics.orders.total}
				centerLabel="orders"
				stats={[
					{ label: "Processed", value: metrics.orders.completed, tone: "positive" },
					{ label: "Failed", value: metrics.orders.failed, tone: "negative" },
				]}
				actions={[{ label: "Service orders", href: "/agency/nisc-service-orders" }]}
			/>

			<AgencyMetricCard
				icon={Icons.File}
				title="Quotations"
				description="Pipeline"
				loading={metrics.quotations.isLoading}
				error={metrics.quotations.isError}
				slices={[
					{ key: "pending", label: "Pending", value: metrics.quotations.pending ?? 0, color: COLORS.warning },
					{ key: "closed", label: "Closed", value: metrics.quotations.closed ?? 0, color: COLORS.positive },
				]}
				centerValue={metrics.quotations.total}
				centerLabel="quotes"
				stats={[
					{ label: "Pending", value: metrics.quotations.pending, tone: "muted" },
					{ label: "Closed", value: metrics.quotations.closed, tone: "positive" },
				]}
				actions={[
					{ label: "Quotations", href: "/agency/quotations" },
					{ label: "New quote", href: "/agency/quotations/create" },
				]}
			/>

			<AgencyMetricCard
				icon={Icons.Help}
				title="Tickets"
				description="Support queue"
				loading={metrics.tickets.isLoading}
				error={metrics.tickets.isError}
				slices={[
					{ key: "open", label: "Open", value: metrics.tickets.open ?? 0, color: COLORS.warning },
					{ key: "closed", label: "Closed", value: metrics.tickets.closed ?? 0, color: COLORS.positive },
				]}
				centerValue={metrics.tickets.total}
				centerLabel="tickets"
				stats={[
					{ label: "Open", value: metrics.tickets.open, tone: "negative" },
					{ label: "Closed", value: metrics.tickets.closed, tone: "positive" },
				]}
				actions={[{ label: "Support", href: "/agency/support" }]}
			/>

			<AgencyMetricCard
				icon={Icons.Clients}
				title="Accounts"
				description="Clients and agency users"
				loading={metrics.accounts.isLoading}
				error={metrics.accounts.isError}
				slices={[
					{ key: "customers", label: "Clients", value: metrics.accounts.customers ?? 0, color: COLORS.clients },
					{ key: "agency", label: "Agency", value: metrics.accounts.agency ?? 0, color: COLORS.agency },
				]}
				centerValue={
					metrics.accounts.customers == null && metrics.accounts.agency == null
						? null
						: (metrics.accounts.customers ?? 0) + (metrics.accounts.agency ?? 0)
				}
				centerLabel="users"
				stats={[
					{ label: "Clients", value: metrics.accounts.customers },
					{ label: "Agency", value: metrics.accounts.agency },
					{ label: "Client active", value: metrics.accounts.customerActive, tone: "positive" },
					{
						label: "Ads connected",
						value: metrics.mediaBuying.isLoading ? "…" : connected,
						tone: disconnected > 0 ? "muted" : "positive",
					},
				]}
				actions={[
					{ label: "Clients", href: "/agency/clients" },
					{ label: "Social ads", href: "/agency/social-media-ads" },
				]}
			/>
		</section>
	);
}
