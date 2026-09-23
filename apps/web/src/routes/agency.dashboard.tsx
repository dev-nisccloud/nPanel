import { useEffect } from "react";

import { captureEvent } from "@/lib/posthog";
import { DashboardZeepoHero } from "./agency.dashboard/_components/dashboard-zeepo-hero";
import { DashboardMetricsGrid } from "./agency.dashboard/_components/dashboard-metrics-grid";
import { EmailMarketingChart } from "./agency.dashboard/_components/email-marketing-chart";
import { KpiStatsGrid } from "./agency.dashboard/_components/kpi-stats-grid";
import { NeedsAttention } from "./agency.dashboard/_components/needs-attention";
import { QuickActionsGrid } from "./agency.dashboard/_components/quick-actions-grid";
import { RecentActivity } from "./agency.dashboard/_components/recent-activity";
import { ServerMetricsCard } from "./agency.dashboard/_components/server-metrics-card";
import { WhoisLaunchCard } from "./agency.dashboard/_components/whois-launch-card";
import { useAgencyDashboardMetrics } from "./agency.dashboard/_components/use-agency-dashboard-metrics";

export default function DashboardPage() {
	const metrics = useAgencyDashboardMetrics();

	useEffect(() => {
		captureEvent("agency_dashboard_viewed");
	}, []);

	return (
		<div className="@container/main flex flex-col gap-8 px-4 py-6 md:gap-10 md:px-6 md:py-8 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:gap-8">
				<KpiStatsGrid metrics={metrics} />
				<NeedsAttention metrics={metrics} />
				<div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
					<div className="xl:col-span-3">
						<DashboardZeepoHero />
					</div>
					<div className="xl:col-span-2">
						<WhoisLaunchCard />
					</div>
				</div>
				<QuickActionsGrid />
				<ServerMetricsCard />
				<DashboardMetricsGrid metrics={metrics} />
				<div className="grid grid-cols-1 items-stretch gap-3 @4xl/main:grid-cols-2 [&>*]:min-w-0 [&>*:only-child]:col-span-full">
					<EmailMarketingChart />
					<RecentActivity />
				</div>
			</div>
		</div>
	);
}
