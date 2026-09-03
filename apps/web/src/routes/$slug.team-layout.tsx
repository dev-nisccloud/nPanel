"use client";

import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router";

import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { NavigationLoadingProvider } from "@/contexts/navigation-loading-context";
import { SwitchingTeamProvider } from "@/contexts/switching-team-context";
import { trpc } from "@/utils/trpc";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/types/preferences/layout";

import { TeamSidebarLayout } from "@/routes/$slug/_components/team-sidebar-layout";
import { IntercomSupport } from "@/components/intercom-support";
import {
  TeamPermissionRouteGuard,
  TeamPermissionsProvider,
} from "@/contexts/team-permissions-context";

function readSidebarDefaultOpen(): boolean {
  if (typeof document === "undefined") return true;
  const m = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]*)/);
  return m?.[1] !== "false";
}

function readPreference<T extends string>(key: string, allowed: readonly string[], fallback: T): T {
  if (typeof document === "undefined") return fallback;
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;)\\s*${key}=([^;]*)`));
    const v = m?.[1]?.trim();
    return allowed.includes(v ?? "") ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function TeamLayout() {
  const params = useParams();
  const slug = params.slug as string | undefined;

  const { data: session, isPending } = authClient.useSession();
  const [prefsReady, setPrefsReady] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [sidebarVariant, setSidebarVariant] = useState<SidebarVariant>("floating");
  const [sidebarCollapsible, setSidebarCollapsible] = useState<SidebarCollapsible>("icon");
  const [contentLayout, setContentLayout] = useState<ContentLayout>("full-width");

  useEffect(() => {
    setDefaultOpen(readSidebarDefaultOpen());
    setSidebarVariant(
      readPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "floating"),
    );
    setSidebarCollapsible(
      readPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    );
    setContentLayout(
      readPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "full-width"),
    );
    setPrefsReady(true);
  }, []);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAgencyUser = role?.includes("AGENCY") ?? false;

  const teamQuery = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: slug ?? "" },
    {
      enabled: Boolean(
        prefsReady && slug && !isPending && session?.user && slug !== "agency" && !isAgencyUser,
      ),
      retry: false,
    },
  );

  const updateLast = trpc.teams.updateLastAccessedTeam.useMutation();

  useEffect(() => {
    if (!teamQuery.data?.id) return;
    updateLast.mutate({ teamId: teamQuery.data.id });
  }, [teamQuery.data?.id]);

  if (slug === "agency") {
    return <Navigate to="/agency/dashboard" replace />;
  }

  if (!prefsReady || isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isAgencyUser) {
    return <Navigate to="/agency/dashboard" replace />;
  }

  if (!slug) {
    return <Navigate to="/create-organization" replace />;
  }

  if (teamQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (teamQuery.isError) {
    return <Navigate to="/create-organization" replace />;
  }

  const teamRow = teamQuery.data;
  if (!teamRow) {
    return <Navigate to="/create-organization" replace />;
  }

  return (
    <NavigationLoadingProvider>
      <IntercomSupport user={session.user} />
      <SwitchingTeamProvider>
        <TeamPermissionsProvider teamId={teamRow.id} teamSlug={teamRow.slug}>
          <TeamSidebarLayout
            defaultOpen={defaultOpen}
            sidebarVariant={sidebarVariant}
            sidebarCollapsible={sidebarCollapsible}
            contentLayout={contentLayout}
            teamSlug={teamRow.slug}
          >
            <TeamPermissionRouteGuard>
              <Outlet />
            </TeamPermissionRouteGuard>
          </TeamSidebarLayout>
        </TeamPermissionsProvider>
      </SwitchingTeamProvider>
    </NavigationLoadingProvider>
  );
}
