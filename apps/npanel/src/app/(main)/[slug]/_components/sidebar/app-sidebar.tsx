"use client";

import { Settings, CircleHelp, Search, Database, ClipboardList, File, Command } from "lucide-react";

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
import { rootUser } from "@/data/users";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

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

export function AppSidebar({ 
  teamSlug,
  ...props 
}: React.ComponentProps<typeof Sidebar> & { teamSlug?: string }) {
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
                  className="h-11 w-auto max-w-full object-contain"
                />
              )}
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} teamSlug={teamSlug} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
