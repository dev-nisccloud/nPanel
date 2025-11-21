import { HostingPlansDataTable } from "./_components/hosting-plans-data-table";

export default function ServicePlansPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Service Plans</h1>
        <p className="text-muted-foreground">
          Manage NISC service plans and pricing for your customers. Create and manage hosting, SEO, videography, and other service plans.
        </p>
      </div>
      <HostingPlansDataTable />
    </div>
  );
}

