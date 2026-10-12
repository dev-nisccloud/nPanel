"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  agencyAccessSatisfies,
  agencyModuleAccessSatisfies,
  matchAgencyRoutePermission,
  type AgencyPermissionGrantedAccess,
} from "@/lib/agency-permissions";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type AgencyPermissionsValue = {
  isLoading: boolean;
  unrestricted: boolean;
  roleName: string | null;
  permissions: Record<string, string>;
  can: (key: string, access?: AgencyPermissionGrantedAccess) => boolean;
  canModule: (module: string, access?: AgencyPermissionGrantedAccess) => boolean;
};

const AgencyPermissionsContext = createContext<AgencyPermissionsValue | null>(null);

export function AgencyPermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";

  const query = trpc.agencyRbac.myPermissions.useQuery(undefined, {
    staleTime: 15_000,
    enabled: !sessionPending && !isSuperAdmin,
  });

  const unrestricted = isSuperAdmin || (query.data?.unrestricted ?? false);
  const permissions = isSuperAdmin ? {} : (query.data?.permissions ?? {});
  const isLoading = isSuperAdmin ? false : sessionPending || query.isLoading;

  const can = useCallback(
    (key: string, access: AgencyPermissionGrantedAccess = "read") => {
      if (unrestricted) return true;
      if (isLoading) return false;
      return agencyAccessSatisfies(permissions[key], access);
    },
    [isLoading, permissions, unrestricted],
  );

  const canModule = useCallback(
    (module: string, access: AgencyPermissionGrantedAccess = "read") => {
      if (unrestricted) return true;
      if (isLoading) return false;
      return agencyModuleAccessSatisfies(permissions, module, access);
    },
    [isLoading, permissions, unrestricted],
  );

  const value = useMemo<AgencyPermissionsValue>(
    () => ({
      isLoading,
      unrestricted,
      roleName: isSuperAdmin ? null : (query.data?.roleName ?? null),
      permissions,
      can,
      canModule,
    }),
    [can, canModule, isLoading, isSuperAdmin, permissions, query.data?.roleName, unrestricted],
  );

  return (
    <AgencyPermissionsContext.Provider value={value}>{children}</AgencyPermissionsContext.Provider>
  );
}

export function useAgencyPermissions(): AgencyPermissionsValue {
  const ctx = useContext(AgencyPermissionsContext);
  if (!ctx) {
    throw new Error("useAgencyPermissions must be used within AgencyPermissionsProvider");
  }
  return ctx;
}

export function useOptionalAgencyPermissions(): AgencyPermissionsValue | null {
  return useContext(AgencyPermissionsContext);
}

export function AgencyPermissionRouteGuard({ children }: { children: ReactNode }) {
  const ctx = useAgencyPermissions();
  const { pathname } = useLocation();
  if (ctx.unrestricted) return children;

  const rule = matchAgencyRoutePermission(pathname);

  if (rule.type === "allow") return children;

  if (ctx.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner variant="ellipsis" className="text-primary" />
      </div>
    );
  }

  const allowed =
    rule.type === "deny"
      ? false
      : rule.type === "key"
        ? ctx.can(rule.key, rule.access ?? "read")
        : rule.type === "module"
          ? ctx.canModule(rule.module, rule.access ?? "read")
          : rule.modules.some((module) => ctx.canModule(module, rule.access ?? "read"));

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Your agency role does not include this area.
        </p>
      </div>
    );
  }

  return children;
}
