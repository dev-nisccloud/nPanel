import { InsightCards } from "./agency.crm/_components/insight-cards";
import { OperationalCards } from "./agency.crm/_components/operational-cards";
import { OverviewCards } from "./agency.crm/_components/overview-cards";
import { TableCards } from "./agency.crm/_components/table-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-base font-semibold tracking-tight">CRM</h1>
          <p className="text-xs text-muted-foreground">
            View insights, operational data, and manage client relationships from one dashboard.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          <OverviewCards />
          <InsightCards />
          <OperationalCards />
          <TableCards />
        </div>
      </div>
    </div>
  );
}
