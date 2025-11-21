import { HostingDataTable } from "./_components/hosting-data-table";

export default function HostingPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Hosting subscriptions</h1>
        <p className="text-muted-foreground">
          Customers obtain hosting services from you by subscribing to a hosting plan
        </p>
      </div>
      <HostingDataTable />
    </div>
  );
}
