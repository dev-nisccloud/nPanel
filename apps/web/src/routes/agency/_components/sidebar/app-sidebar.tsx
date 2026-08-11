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
import { trpc } from "@/utils/trpc";
import { type NavGroup, type NavMainItem, agencysidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { isZeepoAiChatSessionPath, NavZeepoAiHistory } from "./nav-zeepo-ai-history";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const NISC_REPORTS_PREFIX = "/agency/nisc-reports";

function hasMenuKey(url: string, allowedKeys: Set<string>): boolean {
  if (allowedKeys.has(url)) return true;
  if (url === NISC_REPORTS_PREFIX) {
    return [...allowedKeys].some((key) => key.startsWith(NISC_REPORTS_PREFIX));
  }
  // Activity lives under Zeepo AI — inherit parent access when not granted separately.
  if (url === "/agency/zeepo-ai/activity" && allowedKeys.has("/agency/zeepo-ai")) {
    return true;
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
          const filteredSubItems = item.subItems?.filter((sub) =>
            hasMenuKey(sub.url, allowedKeys)
          );

          const isItemVisible =
            hasMenuKey(item.url, allowedKeys) ||
            (filteredSubItems && filteredSubItems.length > 0);

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
  const { pathname } = useLocation();
  const showZeepoAiHistory = isZeepoAiChatSessionPath(pathname);
  const { data: menuAccess, isLoading } = trpc.agencyRbac.myMenuAccess.useQuery(undefined, {
    enabled: !showZeepoAiHistory,
  });

  const filteredItems = React.useMemo(() => {
    if (showZeepoAiHistory) return [];
    if (isLoading || !menuAccess) return [];
    const allowedKeys = new Set(menuAccess.allowedKeys);
    return filterSidebarItems(agencysidebarItems, allowedKeys);
  }, [menuAccess, isLoading, showZeepoAiHistory]);

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
        ) : isLoading ? (
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
