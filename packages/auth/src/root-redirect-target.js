import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import { team, teamMember } from "@npanel/db/schema/teams";
import { and, asc, eq } from "@npanel/db";
import { auth } from "./index";
/**
 * Same as legacy auth-server `getCustomerTeamRedirectPath`, using Drizzle.
 * Picks active team, updates lastAccessedTeamId, logs TEAM_ACCESSED.
 */
export async function getCustomerTeamRedirectPath(user) {
    const userId = user.id;
    const lastAccessedTeamId = user.lastAccessedTeamId;
    if (lastAccessedTeamId) {
        const rows = await db
            .select({ slug: team.slug })
            .from(teamMember)
            .innerJoin(team, eq(teamMember.teamId, team.id))
            .where(and(eq(teamMember.userId, userId), eq(teamMember.teamId, lastAccessedTeamId), eq(team.isActive, true)))
            .limit(1);
        if (rows[0])
            return `/${rows[0].slug}/dashboard`;
    }
    const memberships = await db
        .select({
        teamId: team.id,
        teamName: team.name,
        teamSlug: team.slug,
        teamIsActive: team.isActive,
    })
        .from(teamMember)
        .innerJoin(team, eq(teamMember.teamId, team.id))
        .where(eq(teamMember.userId, userId))
        .orderBy(asc(teamMember.createdAt));
    const activeTeams = memberships.filter((m) => m.teamIsActive);
    if (activeTeams.length === 0)
        return "/create-team";
    const firstTeam = activeTeams[0];
    const teamId = firstTeam.teamId;
    const teamSlug = firstTeam.teamSlug;
    await db
        .update(userTable)
        .set({ lastAccessedTeamId: teamId })
        .where(eq(userTable.id, userId));
    void db
        .insert(userActivityLog)
        .values({
        id: crypto.randomUUID(),
        userId,
        action: "TEAM_ACCESSED",
        description: `User accessed team: ${firstTeam.teamName}`,
        metadata: {
            teamId,
            teamName: firstTeam.teamName,
            teamSlug,
            autoSet: !lastAccessedTeamId,
        },
        createdAt: new Date(),
    })
        .catch(() => { });
    return `/${teamSlug}/dashboard`;
}
/**
 * Root "/" redirect target for authenticated users. Uses request cookies via Better Auth.
 * Safe for Hono (pass `c.req.raw.headers`) and Next (pass `await headers()`).
 */
export async function getRootRedirectTargetFromHeaders(headers) {
    console.log("[redirect-target] Calling getSession...");
    const session = await auth.api.getSession({ headers }).catch(err => {
        console.error("[redirect-target] getSession CRASHED:", err);
        throw err;
    });
    const sessionUser = session?.user ?? null;
    console.log("[redirect-target] getSession result:", { present: !!sessionUser, userId: sessionUser?.id });
    if (!sessionUser)
        return "/auth/login";
    const u = sessionUser;
    const allowedStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];
    const normalizeStatus = (s) => {
        if (typeof s !== "string")
            return undefined;
        const normalized = s.trim().toUpperCase();
        return allowedStatuses.includes(normalized)
            ? normalized
            : undefined;
    };
    console.log("[redirect-target] Fetching authoritative user data from DB for:", u.id);
    const rows = await db
        .select({
        status: userTable.status,
        role: userTable.role,
        lastAccessedTeamId: userTable.lastAccessedTeamId,
    })
        .from(userTable)
        .where(eq(userTable.id, u.id))
        .limit(1)
        .catch(err => {
        console.error("[redirect-target] DB Query CRASHED:", err);
        throw err;
    });
    const dbRow = rows[0];
    if (!dbRow) {
        await auth.api.signOut({ headers });
        return "/auth/login";
    }
    const dbStatus = normalizeStatus(dbRow.status);
    if (!dbStatus || dbStatus !== "ACTIVE") {
        if (process.env.NODE_ENV !== "production") {
            console.log("[redirect-target] Non-ACTIVE user", {
                userId: u.id,
                sessionStatus: u.status,
                sessionRole: u.role,
                dbStatus,
            });
        }
        await auth.api.signOut({ headers });
        return `/account-status?status=${dbStatus || "INACTIVE"}`;
    }
    const role = typeof dbRow.role === "string" ? dbRow.role.trim().toUpperCase() : undefined;
    u.status = dbStatus;
    u.role = role;
    u.lastAccessedTeamId = dbRow.lastAccessedTeamId ?? u.lastAccessedTeamId;
    const isAgency = role?.includes("AGENCY");
    const redirect = isAgency
        ? "/agency/dashboard"
        : // CUSTOMER roles go through team routing (dashboard or create-team).
            await getCustomerTeamRedirectPath(u);
    if (process.env.NODE_ENV !== "production") {
        console.log("[redirect-target][role decision]", {
            userId: u.id,
            role,
            redirect,
            isAgency
        });
    }
    return redirect;
}
