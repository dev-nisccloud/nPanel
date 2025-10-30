import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireRole, verifyTeamAccess } from "@/lib/auth-server";
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

import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { TeamSwitcher } from "./_components/sidebar/team-switcher";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";

export const dynamic = "force-dynamic";

export default async function TeamLayout({ 
  children, 
  params 
}: Readonly<{ 
  children: ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  // Server-side auth check - redirects if not authenticated or not a customer
  await requireRole(["CUSTOMER"]);
  
  // Await params in Next.js 15+
  const { slug } = await params;
  
  // Verify user has access to this team
  const team = await verifyTeamAccess(slug);
  
  if (!team) {
    // User doesn't have access to this team, redirect to create-team
    // The auth system will redirect them to their correct team
    redirect("/create-team");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const [sidebarVariant, sidebarCollapsible, contentLayout] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "centered"),
  ]);

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar 
          variant={sidebarVariant} 
          collapsible={sidebarCollapsible} 
          teamSlug={team.slug}
        />
        <SidebarInset
          data-content-layout={contentLayout}
          className={cn(
            "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
            // Adds right margin for inset sidebar in centered layout up to 113rem.
            // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
            "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <TeamSwitcher />
                <LayoutControls {...layoutPreferences} />
                <ThemeSwitcher />
                {/* <AccountSwitcher users={users} /> */}
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
  );
}
