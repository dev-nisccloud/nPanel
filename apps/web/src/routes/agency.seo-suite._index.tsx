import { SeoProjectsTable } from "./agency.seo-suite/_components/seo-projects-table";

export default function SeoSuitePage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">SEO Suite</h1>
          <p className="text-xs text-muted-foreground">
            Research, track, audit, and monitor AI visibility for client domains
          </p>
        </div>
        <div className="mt-6">
          <SeoProjectsTable />
        </div>
      </div>
    </div>
  );
}
