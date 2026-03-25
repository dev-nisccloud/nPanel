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
import { agencysidebarItems, type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAgencySuperAdmin = userRole === "AGENCY_SUPER_ADMIN";

  const { data: menuAccess } = trpc.agencyRbac.myMenuAccess.useQuery(undefined, {
    enabled: !!session?.user && !isAgencySuperAdmin,
    staleTime: 60_000,
  });

  const effectiveItems = React.useMemo<NavGroup[]>(() => {
    if (isAgencySuperAdmin) {
      return agencysidebarItems;
    }

    // While permissions are loading, show nothing to avoid flicker
    if (!menuAccess) {
      return [];
    }

    // If this user has not been assigned an agency role yet, show full menu
    // and rely on high-level role (AGENCY_* vs CUSTOMER) for coarse access.
    if (!menuAccess.roleId) {
      return agencysidebarItems;
    }

    const allowedKeys = new Set(menuAccess.allowedKeys ?? []);

    const filtered: NavGroup[] = [];

    for (const group of agencysidebarItems) {
      const items: NavMainItem[] = [];

      for (const item of group.items) {
        const itemAllowed = allowedKeys.has(item.url as any);
        const filteredSub =
          item.subItems?.filter((sub) => allowedKeys.has(sub.url as any)) ?? [];

        if (!itemAllowed && filteredSub.length === 0) {
          continue;
        }

        items.push({
          ...item,
          subItems: filteredSub.length > 0 ? filteredSub : itemAllowed ? undefined : filteredSub,
        });
      }

      if (items.length > 0) {
        filtered.push({
          ...group,
          items,
        });
      }
    }

    return filtered;
  }, [isAgencySuperAdmin, menuAccess]);

  const { state } = useSidebar();
  const isExpanded = state === "expanded";

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
        <NavMain items={effectiveItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
