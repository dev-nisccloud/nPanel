import { HostingDataTable } from "./_components/hosting-data-table";

export default function EmailsPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Email Hosting subscriptions</h1>
          <p className="text-xs text-muted-foreground">
            Customers obtain email hosting services from you by subscribing to an Email Hosting plan
          </p>
        </div>
        <div className="mt-6">
          <HostingDataTable />
        </div>
      </div>
    </div>
  );
}
