import { and, eq, inArray, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";

/** Team IDs the user belongs to (for team-scoped asset access). */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, userId));
  return rows.map((r) => r.teamId);
}

/**
 * Prisma-equivalent: `{ userId } OR { team: { members: { some: { userId } } } }`
 * i.e. personal owner OR row attached to a team the user is a member of.
 */
export function orUserOrTeamMember(
  userIdCol: AnyPgColumn,
  teamIdCol: AnyPgColumn,
  userId: string,
  userTeamIds: string[],
): SQL {
  if (userTeamIds.length === 0) {
    return eq(userIdCol, userId);
  }
  const teamMatch = and(isNotNull(teamIdCol), inArray(teamIdCol, userTeamIds));
  return or(eq(userIdCol, userId), teamMatch)!;
}

/** Personal-only rows: owned by user and not tied to a team workspace. */
export function personalScope(userIdCol: AnyPgColumn, teamIdCol: AnyPgColumn, userId: string): SQL {
  return and(eq(userIdCol, userId), isNull(teamIdCol))!;
}
