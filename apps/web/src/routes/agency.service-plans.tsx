import { HostingPlansDataTable } from "./agency.service-plans/_components/hosting-plans-data-table";

export default function ServicePlansPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Service Plans</h1>
          <p className="text-xs text-muted-foreground">
            Manage NISC service plans and pricing for your customers. Create and manage hosting, SEO, videography, and other service plans.
          </p>
        </div>

        <div className="mt-6">
          <HostingPlansDataTable />
        </div>
      </div>
    </div>
  );
}

