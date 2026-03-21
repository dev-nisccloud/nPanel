"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
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
import {
  SwitchingTeamOverlay,
} from "@/contexts/switching-team-context";

/** Load only on client so tRPC context is available (avoids "Unable to find tRPC Context" when layout streams before root QueryProvider has mounted). Single chunk ensures switchers never run during SSR. */
const ClientTrpcSwitchers = dynamic(
  () => import("./client-trpc-switchers").then((m) => ({ default: m.ClientTrpcSwitchers })),
  { ssr: false }
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
              <ClientTrpcSwitchers />
              <CartSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div className="h-full p-4 md:p-6 bg-[#f8fafb] dark:bg-background">{children}</div>
        <NavigationLoader />
        <SwitchingTeamOverlay />
      </SidebarInset>
    </SidebarProvider>
  );
}
