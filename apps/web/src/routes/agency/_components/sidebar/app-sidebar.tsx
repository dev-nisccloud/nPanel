"use client";

import * as React from "react";
import { Settings, CircleHelp, Search, Database, ClipboardList, File } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { trpc } from "@/utils/trpc";
import { type NavGroup, type NavMainItem, agencysidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const NISC_REPORTS_PREFIX = "/agency/nisc-reports";

function hasMenuKey(url: string, allowedKeys: Set<string>): boolean {
  if (allowedKeys.has(url)) return true;
  if (url === NISC_REPORTS_PREFIX) {
    return [...allowedKeys].some((key) => key.startsWith(NISC_REPORTS_PREFIX));
  }
  return false;
}

/**
 * Recursively filters sidebar items based on allowed keys.
 */
function filterSidebarItems(
  groups: readonly NavGroup[],
  allowedKeys: Set<string>
): NavGroup[] {
  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          // If item has subItems, filter them too
          const filteredSubItems = item.subItems?.filter((sub) =>
            hasMenuKey(sub.url, allowedKeys)
          );

          // An item is visible if:
          // 1. Its URL is directly in allowedKeys
          // 2. It has at least one visible subItem
          const isItemVisible = hasMenuKey(item.url, allowedKeys) || (filteredSubItems && filteredSubItems.length > 0);

          if (!isItemVisible) return null;

          return {
            ...item,
            subItems: filteredSubItems,
          } as NavMainItem;
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
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const { data: menuAccess, isLoading } = trpc.agencyRbac.myMenuAccess.useQuery();

  const filteredItems = React.useMemo(() => {
    if (isLoading || !menuAccess) return [];
    const allowedKeys = new Set(menuAccess.allowedKeys);
    return filterSidebarItems(agencysidebarItems, allowedKeys);
  }, [menuAccess, isLoading]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!py-6 !px-4">
              <a href="#">
                {isExpanded ? (
                  <img
                    src="/nisclogooriginal.png"
                    alt={APP_CONFIG.name}
                    className="h-12 w-auto max-w-full"
                  />
                ) : (
                  <img
                    src="/nisciconoriginal.png"
                    alt={APP_CONFIG.name}
                    className="h-24 w-auto max-w-full object-contain"
                  />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="flex grow flex-col items-center justify-center gap-2 p-4">
            <Spinner variant="ellipsis" className="text-primary" />
            <span className="text-muted-foreground animate-pulse text-[10px] font-medium uppercase tracking-wider">
              Loading roles...
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
