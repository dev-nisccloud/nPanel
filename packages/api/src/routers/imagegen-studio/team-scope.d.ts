import { type SQL, type AnyColumn } from "@npanel/db";
/** Team IDs the user belongs to (for team-scoped asset access). */
export declare function getUserTeamIds(userId: string): Promise<string[]>;
/**
 * Prisma-equivalent: `{ userId } OR { team: { members: { some: { userId } } } }`
 * i.e. personal owner OR row attached to a team the user is a member of.
 */
export declare function orUserOrTeamMember(userIdCol: AnyColumn, teamIdCol: AnyColumn, userId: string, userTeamIds: string[]): SQL;
/** Personal-only rows: owned by user and not tied to a team workspace. */
export declare function personalScope(userIdCol: AnyColumn, teamIdCol: AnyColumn, userId: string): SQL;
