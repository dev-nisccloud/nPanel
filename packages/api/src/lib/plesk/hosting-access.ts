import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingSubscription } from "@npanel/db/schema/hosting";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { serviceSubscription } from "@npanel/db/schema/service-subscriptions";
import { team, teamMember } from "@npanel/db/schema/teams";

export function isAgencyUserRole(role: string | null | undefined): boolean {
  return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}

async function userCanReadTeam(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const [membership, ownedTeam] = await Promise.all([
    db.query.teamMember.findFirst({
      where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
      columns: { id: true },
    }),
    db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.createdById, userId)),
      columns: { id: true },
    }),
  ]);
  return !!(membership || ownedTeam);
}

async function teamIdsLinkedToPleskSite(siteId: number): Promise<string[]> {
  const idStr = String(siteId);
  const [direct, viaHosting, viaLegacy] = await Promise.all([
    db
      .select({ teamId: niscClientSubscription.teamId })
      .from(niscClientSubscription)
      .where(
        or(
          eq(niscClientSubscription.pleskFilterId, idStr),
          sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`,
        ),
      ),
    db
      .select({ teamId: niscClientSubscription.teamId })
      .from(niscClientSubscription)
      .innerJoin(
        hostingSubscription,
        eq(niscClientSubscription.hostingSubscriptionId, hostingSubscription.id),
      )
      .where(eq(hostingSubscription.pleskFilterId, idStr)),
    db
      .select({ teamId: serviceSubscription.teamId })
      .from(serviceSubscription)
      .innerJoin(
        hostingSubscription,
        eq(serviceSubscription.hostingSubscriptionId, hostingSubscription.id),
      )
      .where(eq(hostingSubscription.pleskFilterId, idStr)),
  ]);

  const ids = new Set<string>();
  for (const row of [...direct, ...viaHosting, ...viaLegacy]) {
    if (row.teamId) ids.add(row.teamId);
  }
  return [...ids];
}

/**
 * Agency staff may act on any Plesk webspace. Customers must have a linked
 * nisc_client_subscription (or legacy service_subscription) for a team they can read.
 */
export async function assertCanAccessPleskSite(params: {
  siteId: number;
  userId: string;
  role: string | null | undefined;
  teamId?: string;
}): Promise<void> {
  if (isAgencyUserRole(params.role)) return;

  const linkedTeamIds = await teamIdsLinkedToPleskSite(params.siteId);
  const candidateIds = params.teamId
    ? linkedTeamIds.filter((id) => id === params.teamId)
    : linkedTeamIds;

  if (candidateIds.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this resource",
    });
  }

  for (const teamId of candidateIds) {
    if (await userCanReadTeam(teamId, params.userId)) return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have access to this resource",
  });
}
