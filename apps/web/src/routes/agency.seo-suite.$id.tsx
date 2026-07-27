import { useParams } from "react-router";
import { SeoSuiteDetailPage } from "./agency.seo-suite/_components/seo-suite-detail-page";

export default function SeoSuiteDetailRoute() {
  const { id } = useParams();

  if (!id) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-base font-semibold tracking-tight">Project not found</h1>
          <p className="text-xs text-muted-foreground">SEO project ID is missing from the URL.</p>
        </div>
      </div>
    );
  }

  return <SeoSuiteDetailPage projectId={id} />;
}
