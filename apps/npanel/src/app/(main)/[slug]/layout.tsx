import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";

import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireRole, verifyTeamAccess, getCurrentUser } from "@/lib/auth-server";
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
import { CartSwitcher } from "./_components/sidebar/cart-switcher";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";
import { NotificationSwitcher } from "./_components/sidebar/notification-switcher";
import { PrefetchTeams } from "./_components/prefetch-teams";
import { NavigationLoader } from "@/components/navigation-loader";
import { FloatingActionButton } from "@/components/floating-action-button";

export const dynamic = "force-dynamic";

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

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
        <PrefetchTeams />
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
                <NotificationSwitcher />
                <CartSwitcher />
                {/* <LayoutControls {...layoutPreferences} /> */}
                <ThemeSwitcher />
                {/* <AccountSwitcher users={users} /> */}
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
          <NavigationLoader />
          <FloatingActionButton />
        </SidebarInset>
      </SidebarProvider>
  );
}
