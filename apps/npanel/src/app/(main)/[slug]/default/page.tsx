import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import { DataTable } from "./_components/data-table";
import data from "./_components/data.json";
import { SectionCards } from "./_components/section-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <SectionCards />
        <div className="mt-6">
          <ChartAreaInteractive />
        </div>
        <div className="mt-6">
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
