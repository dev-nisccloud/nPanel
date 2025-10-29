import { WordPressDataTable } from "./_components/wordpress-data-table";

export default function WordPressPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">WordPress installations</h1>
        <p className="text-muted-foreground">
          Manage and monitor all WordPress installations across your hosting infrastructure
        </p>
      </div>
      <WordPressDataTable />
    </div>
  );
}
