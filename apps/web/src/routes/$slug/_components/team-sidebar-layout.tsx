"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { AppSidebar } from "./sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/types/preferences/layout";
import { SearchDialog } from "./sidebar/search-dialog";
import { CartSwitcher } from "./sidebar/cart-switcher";
import { ThemeSwitcher } from "./sidebar/theme-switcher";
import { PrefetchTeams } from "./prefetch-teams";
import { NavigationLoader } from "@/components/navigation-loader";
import { SwitchingTeamOverlay } from "@/contexts/switching-team-context";

const ClientTrpcSwitchers = React.lazy(() =>
  import("./client-trpc-switchers").then((m) => ({ default: m.ClientTrpcSwitchers })),
);

const switchersFallback = (
  <div className="flex h-9 w-[72px] items-center justify-center" aria-hidden />
);

export type TeamSidebarLayoutProps = {
  defaultOpen: boolean;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
  teamSlug: string;
  children: ReactNode;
};

/**
 * Single client component that wraps SidebarProvider and AppSidebar together
 * so useSidebar() is always within SidebarProvider (avoids streaming/SSR boundary issues).
 */
export function TeamSidebarLayout({
  defaultOpen,
  sidebarVariant,
  sidebarCollapsible,
  contentLayout,
  teamSlug,
  children,
}: TeamSidebarLayoutProps) {
  const { pathname } = useLocation();
  const isZeepoAgent = pathname?.includes("/zeepo-ai-agent");

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <PrefetchTeams />
      <AppSidebar
        variant={sidebarVariant}
        collapsible={sidebarCollapsible}
        teamSlug={teamSlug}
      />
      <SidebarInset
        data-content-layout={contentLayout}
        className={cn(
          "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
          "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
          isZeepoAgent && "min-h-0 max-h-svh overflow-hidden",
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
              <React.Suspense fallback={switchersFallback}>
                <ClientTrpcSwitchers />
              </React.Suspense>
              <CartSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div
          className={cn(
            "h-full p-4 md:p-6 bg-[#f8fafb] dark:bg-background",
            isZeepoAgent && "flex min-h-0 flex-1 flex-col overflow-hidden !p-0",
          )}
        >
          {children}
        </div>
        <NavigationLoader />
        <SwitchingTeamOverlay />
      </SidebarInset>
    </SidebarProvider>
  );
}
