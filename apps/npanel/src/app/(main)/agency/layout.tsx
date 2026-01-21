import { ReactNode } from "react";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

import { AppSidebar } from "@/app/(main)/agency/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAuth, ensureCustomerHasTeam } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { users } from "@/data/users";
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

import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";
import { CartSwitcher } from "./_components/sidebar/cart-switcher";
import { NotificationSwitcher } from "./_components/sidebar/notification-switcher";
import { NavigationLoader } from "@/components/navigation-loader";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Server-side auth check - accepts any role except CUSTOMER
  // First check if user is authenticated
  const user = await requireAuth();
  const userRole = (user as { role?: string }).role;
  
  // If user is a CUSTOMER, redirect them to their customer dashboard
  if (userRole === "CUSTOMER") {
    const teamSlug = await ensureCustomerHasTeam(user as any);
    redirect(`/${teamSlug}/default`);
  }
  
  // All other roles (AGENCY_*, or any other role) are allowed

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
        <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
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
                <NotificationSwitcher />
                <CartSwitcher />
                {/* <LayoutControls {...layoutPreferences} /> */}
                <ThemeSwitcher />
                {/* <AccountSwitcher users={users} /> */}
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6 bg-[#f8fafb] dark:bg-background">{children}</div>
          <NavigationLoader />
        </SidebarInset>
      </SidebarProvider>
  );
}
