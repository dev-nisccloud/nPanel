import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, isAgency, verifyTeamAccess } from "@/lib/auth-server";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/types/preferences/layout";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Import sidebars based on role
import { AppSidebar as AgencySidebar } from "@/app/(main)/agency/_components/sidebar/app-sidebar";
import { AppSidebar as CustomerSidebar } from "@/app/(main)/[slug]/_components/sidebar/app-sidebar";
import { SearchDialog as AgencySearchDialog } from "@/app/(main)/agency/_components/sidebar/search-dialog";
import { SearchDialog as CustomerSearchDialog } from "@/app/(main)/[slug]/_components/sidebar/search-dialog";
import { ThemeSwitcher } from "@/app/(main)/agency/_components/sidebar/theme-switcher";
import { TeamSwitcher } from "@/app/(main)/[slug]/_components/sidebar/team-switcher";
import { CartSwitcher } from "@/app/(main)/[slug]/_components/sidebar/cart-switcher";
import { PrefetchTeams } from "@/app/(main)/[slug]/_components/prefetch-teams";
import { TeamContextProvider } from "./_components/team-context";

export const dynamic = "force-dynamic";

export default async function ImageGenStudioDashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const userRole = (user as { role?: string }).role;
  const isAgencyUser = userRole?.includes("AGENCY") ?? false;

  // For customers, get team context
  let team = null;
  if (!isAgencyUser) {
    const prisma = (await import("@nPanel/db")).default;
    const lastAccessedTeamId = (user as { lastAccessedTeamId?: string }).lastAccessedTeamId;
    
    if (!lastAccessedTeamId) {
      redirect("/create-team");
    }

    // Get team data by ID
    const teamData = await prisma.team.findUnique({
      where: { id: lastAccessedTeamId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        baseCurrency: true,
        isActive: true,
      },
    });

    if (!teamData || !teamData.isActive) {
      redirect("/create-team");
    }

    // Verify user is a member of this team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamData.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      redirect("/create-team");
    }

    team = {
      ...teamData,
      role: membership.role,
    };
  }

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  const [sidebarVariant, sidebarCollapsible, contentLayout] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "floating"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "full-width"),
  ]);

  // Render agency layout
  if (isAgencyUser) {
    return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <AgencySidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
        <SidebarInset
          data-content-layout={contentLayout}
          className={cn(
            "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
            "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto"
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <AgencySearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Render customer layout with team context
  return (
    <TeamContextProvider teamId={team!.id} teamSlug={team!.slug}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <PrefetchTeams />
        <CustomerSidebar
          variant={sidebarVariant}
          collapsible={sidebarCollapsible}
          teamSlug={team!.slug}
        />
        <SidebarInset
          data-content-layout={contentLayout}
          className={cn(
            "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
            "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto"
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <CustomerSearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <TeamSwitcher />
                <CartSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TeamContextProvider>
  );
}
