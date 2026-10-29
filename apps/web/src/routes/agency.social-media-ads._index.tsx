import { Navigate } from "react-router";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAgencyPermissions } from "@/contexts/agency-permissions-context";

export default function SocialMediaAdsIndex() {
  const { canModule, isLoading, unrestricted } = useAgencyPermissions();

  if (isLoading && !unrestricted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (unrestricted || canModule("social")) {
    return <Navigate to="/agency/social-media-ads/facebook" replace />;
  }

  if (canModule("social_instagram")) {
    return <Navigate to="/agency/social-media-ads/instagram" replace />;
  }

  if (canModule("social_linkedin")) {
    return <Navigate to="/agency/social-media-ads/linkedin" replace />;
  }

  return <Navigate to="/agency/social-media-ads/google" replace />;
}
