"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  accessSatisfies,
  matchCustomerRoutePermission,
  moduleAccessSatisfies,
  type TeamPermissionGrantedAccess,
} from "@/lib/team-permissions";
import { TeamPermissionDenied } from "@/components/team-permissions/team-permission-denied";
import { useOptionalAgencyPermissions } from "@/contexts/agency-permissions-context";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type TeamPermissionsValue = {
  teamId: string;
  teamSlug: string;
  isLoading: boolean;
  isOwner: boolean;
  role: string | null;
  permissions: Record<string, string>;
  can: (key: string, access?: TeamPermissionGrantedAccess) => boolean;
  canModule: (module: string, access?: TeamPermissionGrantedAccess) => boolean;
};

const TeamPermissionsContext = createContext<TeamPermissionsValue | null>(null);

export function TeamPermissionsProvider({
  teamId,
  teamSlug,
  children,
}: {
  teamId: string;
  teamSlug: string;
  children: ReactNode;
}) {
  const query = trpc.teams.permissions.myPermissions.useQuery(
    { teamId },
    { enabled: Boolean(teamId) },
  );

  const isOwner = query.data?.isOwner ?? false;
  const permissions = query.data?.permissions ?? {};

  const can = useCallback(
    (key: string, access: TeamPermissionGrantedAccess = "read") => {
      if (query.isLoading) return false;
      if (isOwner) return true;
      return accessSatisfies(permissions[key], access);
    },
    [isOwner, permissions, query.isLoading],
  );

  const canModule = useCallback(
    (module: string, access: TeamPermissionGrantedAccess = "read") => {
      if (query.isLoading) return false;
      if (isOwner) return true;
      return moduleAccessSatisfies(permissions, module, access);
    },
    [isOwner, permissions, query.isLoading],
  );

  const value = useMemo<TeamPermissionsValue>(
    () => ({
      teamId,
      teamSlug,
      isLoading: query.isLoading,
      isOwner,
      role: query.data?.role ?? null,
      permissions,
      can,
      canModule,
    }),
    [teamId, teamSlug, query.isLoading, query.data?.role, isOwner, permissions, can, canModule],
  );

  return (
    <TeamPermissionsContext.Provider value={value}>
      {children}
    </TeamPermissionsContext.Provider>
  );
}

export function useTeamPermissions(): TeamPermissionsValue {
  const ctx = useContext(TeamPermissionsContext);
  if (!ctx) {
    throw new Error("useTeamPermissions must be used within TeamPermissionsProvider");
  }
  return ctx;
}

export function useOptionalTeamPermissions(): TeamPermissionsValue | null {
  return useContext(TeamPermissionsContext);
}

export function useCanTeamPermission() {
  const ctx = useOptionalTeamPermissions();
  const agency = useOptionalAgencyPermissions();
  const { data: session } = authClient.useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";
  if (isSuperAdmin || agency?.unrestricted) {
    return {
      isLoading: false,
      isOwner: true,
      can: () => true,
      canModule: () => true,
    };
  }
  const active = ctx ?? agency;
  return {
    isLoading: active?.isLoading ?? false,
    isOwner: ctx ? ctx.isOwner : agency ? agency.unrestricted : true,
    can: (key: string, access: TeamPermissionGrantedAccess = "read") => {
      if (ctx) return ctx.can(key, access);
      if (agency) return agency.can(key, access);
      return true;
    },
    canModule: (module: string, access: TeamPermissionGrantedAccess = "read") => {
      if (ctx) return ctx.canModule(module, access);
      if (agency) return agency.canModule(module, access);
      return true;
    },
  };
}

export function TeamPermissionRouteGuard({ children }: { children: ReactNode }) {
  const ctx = useTeamPermissions();
  const { data: session } = authClient.useSession();
  const { pathname } = useLocation();
  if ((session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN") {
    return children;
  }
  const rule = matchCustomerRoutePermission(pathname, ctx.teamSlug);

  if (rule.type === "allow") return children;

  if (ctx.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  const allowed =
    rule.type === "key"
      ? ctx.can(rule.key, rule.access ?? "read")
      : ctx.canModule(rule.module, rule.access ?? "read");

  if (!allowed) {
    return <TeamPermissionDenied teamSlug={ctx.teamSlug} />;
  }

  return children;
}
