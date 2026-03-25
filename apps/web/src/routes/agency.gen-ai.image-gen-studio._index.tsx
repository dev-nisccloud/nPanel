import { Banner } from "./_agency.gen-ai/image-gen-studio/_dashboard/banner";
import { ProjectsSection } from "./_agency.gen-ai/image-gen-studio/_dashboard/projects-section";
import { TemplatesSection } from "./_agency.gen-ai/image-gen-studio/_dashboard/templates-section";

export default function ImageGenStudioPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <Banner />
        <div className="mt-6">
          <TemplatesSection />
        </div>
        <div className="mt-6">
          <ProjectsSection />
        </div>
      </div>
    </div>
  );
}
