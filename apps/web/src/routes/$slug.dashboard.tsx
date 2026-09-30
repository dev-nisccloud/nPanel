import { useEffect } from "react";

import { captureEvent } from "@/lib/posthog";
import { CustomerDashboardGuide } from "@/components/customer-guide/customer-dashboard-guide";
import { DashboardZeepoHero } from "./$slug.dashboard/_components/dashboard-zeepo-hero";
import { DashboardSetupTodos } from "./$slug.dashboard/_components/dashboard-setup-todos";
import { NeedsAttention } from "./$slug.dashboard/_components/needs-attention";
import { DashboardMetricsGrid } from "./$slug.dashboard/_components/dashboard-metrics-grid";
import { KpiStatsGrid } from "./$slug.dashboard/_components/kpi-stats-grid";
import { QuickActionsGrid } from "./$slug.dashboard/_components/quick-actions-grid";
import { RecentActivity } from "./$slug.dashboard/_components/recent-activity";
import { useCustomerDashboardMetrics } from "./$slug.dashboard/_components/use-customer-dashboard-metrics";

export default function DashboardPage() {
	const metrics = useCustomerDashboardMetrics();

	useEffect(() => {
		captureEvent("dashboard_viewed", { user_type: "customer" });
	}, []);

	return (
		<div className="@container/main flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8">
			<CustomerDashboardGuide />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4">
				<KpiStatsGrid metrics={metrics} />
				<NeedsAttention metrics={metrics} />
				<div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-5">
					<div className="flex flex-col gap-3 xl:col-span-3">
						<DashboardZeepoHero />
						<QuickActionsGrid />
					</div>
					<div className="xl:col-span-2">
						<DashboardSetupTodos />
					</div>
				</div>
				<div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-5">
					<div className="xl:col-span-3">
						<DashboardMetricsGrid metrics={metrics} />
					</div>
					<div className="xl:col-span-2">
						<RecentActivity />
					</div>
				</div>
			</div>
		</div>
	);
}
