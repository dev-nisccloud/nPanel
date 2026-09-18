import { useEffect } from "react";

import { captureEvent } from "@/lib/posthog";
import { DashboardZeepoHero } from "./agency.dashboard/_components/dashboard-zeepo-hero";
import { NeedsAttention } from "./agency.dashboard/_components/needs-attention";
import { OperationsSnapshot } from "./agency.dashboard/_components/operations-snapshot";
import { GetStarted } from "./agency.dashboard/_components/get-started";
import { RecentActivity } from "./agency.dashboard/_components/recent-activity";
import { EmailMarketingChart } from "./agency.dashboard/_components/email-marketing-chart";
import { useAgencyDashboardMetrics } from "./agency.dashboard/_components/use-agency-dashboard-metrics";

export default function DashboardPage() {
	const metrics = useAgencyDashboardMetrics();

	useEffect(() => {
		captureEvent("agency_dashboard_viewed");
	}, []);

	return (
		<div className="@container/main flex flex-col gap-8 px-4 py-6 md:gap-10 md:px-6 md:py-8 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:gap-10">
				<DashboardZeepoHero />
				<NeedsAttention metrics={metrics} />
				<OperationsSnapshot metrics={metrics} />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<GetStarted />
					<RecentActivity />
				</div>
				<EmailMarketingChart />
			</div>
		</div>
	);
}
