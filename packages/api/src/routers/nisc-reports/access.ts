import { TRPCError } from "@trpc/server";
import { inArray, type SQL } from "@npanel/db";

type ActorRole = string | null | undefined;

export function isAgencyUserRole(role: ActorRole): boolean {
  return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}

export function isAgencySuperAdmin(role: ActorRole): boolean {
  return role === "AGENCY_SUPER_ADMIN";
}

/** NISC reports are agency-only. */
export function requireAgencyReportAccess(role: ActorRole): void {
  if (!isAgencyUserRole(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "NISC reports are only available to agency users.",
    });
  }
}

export type ReportScope = {
  userId: string;
  role: string;
  /** Optional dashboard filter; empty = all teams. */
  teamIds: string[];
};

/** Agency readers see all data; optional teamIds narrows the result set. */
export async function resolveReportReadScope(params: {
  userId: string;
  role: ActorRole;
  requestedTeamIds?: string[];
}): Promise<ReportScope> {
  requireAgencyReportAccess(params.role);
  return {
    userId: params.userId,
    role: params.role ?? "",
    teamIds: params.requestedTeamIds ?? [],
  };
}

/** Optional team filter (agency users only reach this via resolveReportReadScope). */
export function buildReportEntityScope(params: {
  teamColumn: Parameters<typeof inArray>[0];
  teamIds: string[];
}): SQL<unknown> | undefined {
  if (params.teamIds.length === 0) return undefined;
  return inArray(params.teamColumn, params.teamIds);
}

/**
 * Write access on report-related resources: owner, or agency super admin override.
 * (Report endpoints are read-only today; use this for future mutations.)
 */
export function assertAgencyMutationAccess(params: {
  actorUserId: string;
  role: ActorRole;
  ownerUserId: string;
}): void {
  requireAgencyReportAccess(params.role);
  if (isAgencySuperAdmin(params.role)) return;
  if (params.actorUserId === params.ownerUserId) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Only the record owner or an agency super admin can perform this action.",
  });
}
