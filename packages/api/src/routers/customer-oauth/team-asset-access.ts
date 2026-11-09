import { TRPCError } from "@trpc/server";
import { and, eq, type SQL } from "drizzle-orm";

import { customerPlatformAsset } from "@npanel/db/schema";
import { assertTeamPermission, type TeamPermissionKey } from "../../lib/team-permissions/assert";
import { sessionIsAgency } from "./agency-access";

const PLATFORM_PERMISSION: Record<string, TeamPermissionKey> = {
  meta_facebook: "social_ads.facebook",
  meta_instagram: "social_ads.instagram",
  linkedin_ads: "social_ads.linkedin",
  google_ads: "social_ads.google",
};

type SessionUser = { id: string; role?: string | null };

export function permissionForPlatform(platform: string): TeamPermissionKey | null {
  return PLATFORM_PERMISSION[platform] ?? null;
}

export function assetReadWhere(user: SessionUser, assetId: string, teamId?: string | null): SQL | undefined {
  const scope = teamId
    ? eq(customerPlatformAsset.teamId, teamId)
    : sessionIsAgency(user)
      ? undefined
      : eq(customerPlatformAsset.userId, user.id);
  return and(eq(customerPlatformAsset.id, assetId), scope);
}

export async function assertPlatformTeamRead(user: SessionUser, platform: string, teamId: string) {
  const key = permissionForPlatform(platform);
  if (!key) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a platform" });
  }
  await assertTeamPermission({
    teamId,
    userId: user.id,
    userRole: user.role,
    key,
    access: "read",
  });
}
