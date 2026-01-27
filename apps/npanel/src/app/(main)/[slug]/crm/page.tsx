import { InsightCards } from "./_components/insight-cards";
import { OperationalCards } from "./_components/operational-cards";
import { OverviewCards } from "./_components/overview-cards";
import { TableCards } from "./_components/table-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <OverviewCards />
        <div className="mt-6">
          <InsightCards />
        </div>
        <div className="mt-6">
          <OperationalCards />
        </div>
        <div className="mt-6">
          <TableCards />
        </div>
      </div>
    </div>
  );
}
