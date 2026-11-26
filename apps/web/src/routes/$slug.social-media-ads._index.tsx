"use client";

import { Navigate, useParams } from "react-router";

import { useCanTeamPermission } from "@/contexts/team-permissions-context";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function CustomerSocialAdsIndex() {
  const { slug = "" } = useParams();
  const { can, isLoading } = useCanTeamPermission();
  const base = `/${slug}/social-media-ads`;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (can("social_ads.facebook")) return <Navigate to={`${base}/facebook`} replace />;
  if (can("social_ads.instagram")) return <Navigate to={`${base}/instagram`} replace />;
  if (can("social_ads.linkedin")) return <Navigate to={`${base}/linkedin`} replace />;
  return <Navigate to={`${base}/google`} replace />;
}
