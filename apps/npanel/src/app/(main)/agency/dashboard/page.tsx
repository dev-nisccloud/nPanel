import { MetricCards } from "./_components/metric-cards";
import { DashboardCharts } from "./_components/dashboard-charts";
import { DashboardTabs } from "./_components/dashboard-tabs";

export default function DashboardPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Overview of your agency's key metrics and activities
          </p>
        </div>

        {/* Metric Cards */}
        <div className="mt-6">
          <MetricCards />
        </div>

        {/* Charts */}
        <div className="mt-6">
          <DashboardCharts />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <DashboardTabs />
        </div>
      </div>
    </div>
  );
}
