import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";

import { requireRole, verifyTeamAccess, getCurrentUser } from "@/lib/auth-server";
import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/types/preferences/layout";

import { TeamSidebarLayout } from "./_components/team-sidebar-layout";
import { NavigationLoadingProvider } from "@/contexts/navigation-loading-context";
import { SwitchingTeamProvider } from "@/contexts/switching-team-context";

// dynamic export removed to enable Client Router Cache

export default async function TeamLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  // Await params in Next.js 15+
  const { slug } = await params;

  // CRITICAL: Prevent /agency routes from ever matching this [slug] layout
  // This must be the FIRST check to prevent Next.js from compiling this route for /agency
  if (slug === "agency") {
    // Redirect immediately to prevent this layout from executing
    redirect("/agency/dashboard");
  }

  // Check user role first - if they have an agency role, redirect to agency dashboard
  // This prevents agency users from accessing customer routes
  const user = await getCurrentUser();
  if (user && (user as { role?: string }).role?.includes("AGENCY")) {
    redirect("/agency/dashboard");
  }

  // Server-side auth check - redirects if not authenticated or not a customer
  await requireRole(["CUSTOMER"]);

  // Verify user has access to this team
  const team = await verifyTeamAccess(slug);

  if (!team) {
    // User doesn't have access to this team, redirect to create-team
    // The auth system will redirect them to their correct team
    redirect("/create-team");
  }

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  // Default to true (open) unless explicitly set to "false"
  const defaultOpen = sidebarState !== "false";

  const [sidebarVariant, sidebarCollapsible, contentLayout] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "floating"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "full-width"),
  ]);

  return (
    <NavigationLoadingProvider>
      <SwitchingTeamProvider>
        <TeamSidebarLayout
          defaultOpen={defaultOpen}
          sidebarVariant={sidebarVariant}
          sidebarCollapsible={sidebarCollapsible}
          contentLayout={contentLayout}
          teamSlug={team.slug}
        >
          {children}
        </TeamSidebarLayout>
      </SwitchingTeamProvider>
    </NavigationLoadingProvider>
  );
}
