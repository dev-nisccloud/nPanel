import { TRPCError } from "@trpc/server";
import { and, eq, ilike, inArray, sql, desc } from "@npanel/db";
import { db } from "@npanel/db";
import { googleAdsAccount, googleAdsIntegration } from "@npanel/db/schema/google-ads";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";
import { getGoogleAdsIntegrationForSession } from "../../lib/google-ads-user-integration";

type AuthCtx = {
  session?: {
    user?: {
      id?: string;
      role?: string | null;
    };
  } | null;
};

const isAgencyUserRole = (role: string | null | undefined) =>
  role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";

async function getAccessibleTeamIds(userId: string): Promise<string[]> {
  const [memberships, ownedTeams] = await Promise.all([
    db.query.teamMember.findMany({
      where: eq(teamMember.userId, userId),
      columns: { teamId: true },
    }),
    db.query.team.findMany({
      where: eq(team.createdById, userId),
      columns: { id: true },
    }),
  ]);
  return [...new Set([...memberships.map((m) => m.teamId), ...ownedTeams.map((t) => t.id)])];
}

function formatGoogleCustomerIdDashed(customerId: string): string {
  const raw = customerId.replace(/-/g, "");
  return raw.length === 10 ? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}` : customerId;
}

async function hasGoogleSubscriptionAccess(teamIds: string[], customerId: string): Promise<boolean> {
  if (teamIds.length === 0) return false;
  const raw = customerId.replace(/-/g, "");
  const dashed = formatGoogleCustomerIdDashed(raw);
  const [linked] = await db
    .select({ id: niscClientSubscription.id })
    .from(niscClientSubscription)
    .innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
    .where(
      and(
        inArray(niscClientSubscription.teamId, teamIds),
        ilike(niscProduct.name, "%media buying%"),
        sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${"GOOGLE_ADS"}`,
        sql`((${niscClientSubscription.serviceRefs}->>'adAccountId') = ${raw} OR (${niscClientSubscription.serviceRefs}->>'adAccountId') = ${dashed})`,
      ),
    )
    .limit(1);
  return !!linked;
}

export async function getGoogleAdsExecutionContext(ctx: AuthCtx, customerId: string) {
  const userId = ctx.session?.user?.id;
  const role = ctx.session?.user?.role;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
  }

  const customerIdWithoutDashes = customerId.replace(/-/g, "");
  if (isAgencyUserRole(role)) {
    const integration = await getGoogleAdsIntegrationForSession({ userId, role });
    return { userId, role, customerIdWithoutDashes, integration };
  }

  const teamIds = await getAccessibleTeamIds(userId);
  if (teamIds.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this Google Ads account",
    });
  }

  const [linkedAccount] = await db
    .select()
    .from(googleAdsAccount)
    .where(
      and(
        eq(googleAdsAccount.customerId, customerIdWithoutDashes),
        inArray(googleAdsAccount.teamId, teamIds),
      ),
    )
    .limit(1);

  const hasSubscriptionAccess = await hasGoogleSubscriptionAccess(teamIds, customerIdWithoutDashes);
  if (!linkedAccount && !hasSubscriptionAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this Google Ads account",
    });
  }

  const { assertTeamModulePermission } = await import("../../lib/team-permissions/assert");
  const permissionTeamId = linkedAccount?.teamId ?? teamIds[0];
  if (permissionTeamId) {
    await assertTeamModulePermission({
      teamId: permissionTeamId,
      userId,
      userRole: role,
      module: "ads.google",
      access: "read",
    });
  }

  const [integration] = linkedAccount
    ? await db
        .select()
        .from(googleAdsIntegration)
        .where(
          and(
            eq(googleAdsIntegration.id, linkedAccount.integrationId),
            eq(googleAdsIntegration.status, "ACTIVE"),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(googleAdsIntegration)
        .where(eq(googleAdsIntegration.status, "ACTIVE"))
        .orderBy(desc(googleAdsIntegration.createdAt))
        .limit(1);

  if (!integration) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active Google Ads integration found for this account",
    });
  }

  return { userId, role, customerIdWithoutDashes, integration };
}
