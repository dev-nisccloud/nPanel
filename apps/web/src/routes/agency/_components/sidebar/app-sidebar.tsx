"use client";

import * as React from "react";
import { useLocation } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarBrandMenu } from "@/components/sidebar-brand-menu";
import { type NavGroup, type NavMainItem, type NavSubItem, agencysidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useAgencyPermissions } from "@/contexts/agency-permissions-context";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { isZeepoAiChatSessionPath, NavZeepoAiHistory } from "./nav-zeepo-ai-history";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

function navEntryAllowed(
  entry: { permissionKey?: string; permissionModule?: string },
  can: (key: string) => boolean,
  canModule: (module: string) => boolean,
): boolean {
  if (entry.permissionKey) return can(entry.permissionKey);
  if (entry.permissionModule) return canModule(entry.permissionModule);
  return false;
}

function filterSidebarItems(
  groups: readonly NavGroup[],
  can: (key: string) => boolean,
  canModule: (module: string) => boolean,
): NavGroup[] {
  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.subItems?.length) {
            const filteredSubItems = item.subItems.filter((sub: NavSubItem) =>
              navEntryAllowed(sub, can, canModule),
            );
            if (filteredSubItems.length === 0) return null;
            return {
              ...item,
              subItems: filteredSubItems,
            } as NavMainItem;
          }

          if (!navEntryAllowed(item, can, canModule)) return null;
          return item;
        })
        .filter((item): item is NavMainItem => item !== null);

      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
      } as NavGroup;
    })
    .filter((group): group is NavGroup => group !== null);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();
  const showZeepoAiHistory = isZeepoAiChatSessionPath(pathname);
  const { can, canModule, isLoading, unrestricted } = useAgencyPermissions();

  const filteredItems = React.useMemo(() => {
    if (showZeepoAiHistory) return [];
    if (unrestricted) return agencysidebarItems;
    if (isLoading) return [];
    return filterSidebarItems(agencysidebarItems, can, canModule);
  }, [can, canModule, isLoading, showZeepoAiHistory, unrestricted]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarBrandMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {showZeepoAiHistory ? (
          <NavZeepoAiHistory />
        ) : isLoading && !unrestricted ? (
          <div className="flex grow flex-col items-center justify-center gap-2 p-4">
            <Spinner variant="ellipsis" className="text-primary" />
            <span className="text-muted-foreground animate-pulse text-[10px] font-medium uppercase tracking-wider">
              Loading...
            </span>
          </div>
        ) : (
          <NavMain items={filteredItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
