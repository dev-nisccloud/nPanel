import { WordPressDataTable } from "./$slug.wordpress/_components/wordpress-data-table";

export default function WordPressPage() {
  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">WordPress Hosting</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Lightning-fast managed WordPress hosting - NVMe storage, automatic updates, daily backups, and enterprise security.
          </p>
        </div>
        <div className="mt-6 min-h-0 flex-1">
          <WordPressDataTable />
        </div>
      </div>
    </div>
  );
}
