import { useEffect } from "react";

import { captureEvent } from "@/lib/posthog";
import { DashboardZeepoHero } from "./$slug.dashboard/_components/dashboard-zeepo-hero";
import { DashboardSetupTodos } from "./$slug.dashboard/_components/dashboard-setup-todos";
import { NeedsAttention } from "./$slug.dashboard/_components/needs-attention";
import { AccountSnapshot } from "./$slug.dashboard/_components/account-snapshot";
import { GetStarted } from "./$slug.dashboard/_components/get-started";
import { RecentActivity } from "./$slug.dashboard/_components/recent-activity";
import { DashboardPromoSection } from "./$slug.dashboard/_components/dashboard-promo-section";
import { useCustomerDashboardMetrics } from "./$slug.dashboard/_components/use-customer-dashboard-metrics";

export default function DashboardPage() {
	const metrics = useCustomerDashboardMetrics();

	useEffect(() => {
		captureEvent("dashboard_viewed", { user_type: "customer" });
	}, []);

	return (
		<div className="@container/main flex flex-col gap-8 px-4 py-6 md:gap-10 md:px-6 md:py-8 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:gap-10">
				<DashboardZeepoHero />
				<DashboardSetupTodos />
				<NeedsAttention metrics={metrics} />
				<AccountSnapshot metrics={metrics} />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<GetStarted />
					<RecentActivity />
				</div>
				<DashboardPromoSection />
			</div>
		</div>
	);
}
