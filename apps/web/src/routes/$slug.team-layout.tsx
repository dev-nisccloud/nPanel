"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";

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

export default function TeamLayout({ children }: Readonly<{ children: ReactNode }>) {
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
  const isCustomer = role === "CUSTOMER";

  if (process.env.NODE_ENV !== "production") {
    console.log("[team-layout]", {
      slug,
      role,
      isCustomer,
      teamQueryEnabled:
        Boolean(
          prefsReady && slug && !isPending && session?.user && isCustomer && slug !== "agency",
        ),
    });
  }

  const teamQuery = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: slug ?? "" },
    {
      enabled: Boolean(
        prefsReady && slug && !isPending && session?.user && isCustomer && slug !== "agency",
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

  if (role?.includes("AGENCY")) {
    return <Navigate to="/agency/dashboard" replace />;
  }

  if (!isCustomer) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!slug) {
    return <Navigate to="/create-team" replace />;
  }

  if (teamQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  if (teamQuery.isError) {
    return <Navigate to="/create-team" replace />;
  }

  const teamRow = teamQuery.data;
  if (!teamRow) {
    return null;
  }

  return (
    <NavigationLoadingProvider>
      <SwitchingTeamProvider>
        <TeamSidebarLayout
          defaultOpen={defaultOpen}
          sidebarVariant={sidebarVariant}
          sidebarCollapsible={sidebarCollapsible}
          contentLayout={contentLayout}
          teamSlug={teamRow.slug}
        >
          {children}
        </TeamSidebarLayout>
      </SwitchingTeamProvider>
    </NavigationLoadingProvider>
  );
}
