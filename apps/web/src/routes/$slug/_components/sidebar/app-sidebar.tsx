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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { SidebarBrandMenu } from "@/components/sidebar-brand-menu";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useCanTeamPermission } from "@/contexts/team-permissions-context";
import { navItemIsAllowed } from "@/lib/team-permissions";
import {
  ZeepoAiRouteProvider,
  type ZeepoAiRouteConfig,
} from "@/components/zeepo/zeepo-ai-route-context";
import {
  isZeepoAiChatSessionPath,
  NavZeepoAiHistory,
} from "@/routes/agency/_components/sidebar/nav-zeepo-ai-history";
import { trpc } from "@/utils/trpc";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

function CustomerZeepoAiHistoryNav({ teamSlug }: { teamSlug: string }) {
  const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: Boolean(teamSlug) },
  );

  const config = React.useMemo<ZeepoAiRouteConfig>(
    () => ({
      basePath: `/${teamSlug}/zeepo-ai`,
      teamId: teamData?.id ?? null,
      teamSlug,
      isCustomer: true,
    }),
    [teamSlug, teamData?.id],
  );

  if (isLoading || !teamData?.id) {
    return (
      <div className="flex grow flex-col items-center justify-center gap-2 p-4">
        <Spinner variant="ellipsis" className="text-primary" />
        <span className="animate-pulse text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Loading chats…
        </span>
      </div>
    );
  }

  return (
    <ZeepoAiRouteProvider config={config}>
      <NavZeepoAiHistory />
    </ZeepoAiRouteProvider>
  );
}

export function AppSidebar({
  teamSlug,
  ...props
}: React.ComponentProps<typeof Sidebar> & { teamSlug?: string }) {
  const { pathname } = useLocation();
  const showZeepoAiHistory = isZeepoAiChatSessionPath(pathname);
  const { can, canModule, isLoading: permissionsLoading } = useCanTeamPermission();

  const filteredItems = React.useMemo(() => {
    return sidebarItems
      .map((group) => ({
        ...group,
        items: group.items
          .map((item) => {
            if (item.subItems?.length) {
              const subItems = item.subItems.filter((sub) =>
                navItemIsAllowed(sub, can, canModule),
              );
              if (subItems.length === 0) return null;
              return { ...item, subItems };
            }
            if (permissionsLoading && (item.permissionKey || item.permissionModule)) {
              return null;
            }
            return navItemIsAllowed(item, can, canModule) ? item : null;
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      }))
      .filter((group) => group.items.length > 0);
  }, [can, canModule, permissionsLoading]);

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
        {showZeepoAiHistory && teamSlug ? (
          <CustomerZeepoAiHistoryNav teamSlug={teamSlug} />
        ) : (
          <NavMain items={filteredItems} teamSlug={teamSlug} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
