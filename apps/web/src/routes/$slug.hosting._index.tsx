import { HostingDataTable } from "./$slug.hosting/_components/hosting-data-table";

export default function HostingPage() {
  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Website Hosting</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Fast, secure hosting for your website - SSD storage, SSL, backups, and local support from Nisc Cloud.
          </p>
        </div>
        <div className="mt-6 min-h-0 flex-1">
          <HostingDataTable />
        </div>
      </div>
    </div>
  );
}
