import { WordPressDataTable } from "./_components/wordpress-data-table";

export default function WordPressPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">WordPress installations</h1>
          <p className="text-xs text-muted-foreground">
            Manage and monitor all WordPress installations across your hosting infrastructure
          </p>
        </div>
        <div className="mt-6">
          <WordPressDataTable />
        </div>
      </div>
    </div>
  );
}
