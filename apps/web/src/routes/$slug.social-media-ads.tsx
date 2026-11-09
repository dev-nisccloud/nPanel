"use client";

import { Outlet, useParams } from "react-router";

import { SocialAdsScopeProvider } from "@/components/social-ads/social-ads-scope";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

export default function CustomerSocialAdsLayout() {
  const { slug = "" } = useParams();
  const team = trpc.teams.getTeamIdBySlug.useQuery({ slug }, { enabled: Boolean(slug) });

  if (!team.data?.id) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <SocialAdsScopeProvider audience="customer" teamId={team.data.id} basePath={`/${slug}/social-media-ads`}>
      <Outlet />
    </SocialAdsScopeProvider>
  );
}
