import { authClient } from "@/lib/auth-client";
import { Navigate } from "react-router";
import { Banner } from "./_agency.zeepo-canvas/_dashboard/banner";
import { ProjectsSection } from "./_agency.zeepo-canvas/_dashboard/projects-section";

export default function ZeepoCanvasPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex flex-col gap-y-6 px-4 md:px-8 py-8 lg:max-w-7xl mx-auto h-full w-full">
      <Banner />
      <ProjectsSection />
    </div>
  );
}
