import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import { team, teamMember } from "@npanel/db/schema/teams";
import { and, asc, eq } from "@npanel/db";
import { auth } from "./index";
import { parseSafeLandingPageRedirect } from "./landing-page-origins";
/**
 * First path segments that are never treated as customer team slugs when validating
 * post-login redirects (avoids open redirects and non-app paths).
 */
const NON_TEAM_ROOT_SEGMENTS = new Set([
    "auth",
    "api",
    "agency",
    "offline",
    "create-organization",
    "create-team", // legacy alias → /create-organization
    "accept-invite",
    "account-status",
    "unauthorized",
    "update-role",
    "reset-password",
    "register",
    "manifest.webmanifest",
]);
/** Remap legacy UI paths after Team → Organization rename. */
function remapLegacyUiPath(pathWithQuery) {
    const qIdx = pathWithQuery.indexOf("?");
    const pathname = qIdx >= 0 ? pathWithQuery.slice(0, qIdx) : pathWithQuery;
    const query = qIdx >= 0 ? pathWithQuery.slice(qIdx) : "";
    const p = pathname.toLowerCase();
    if (p === "/create-team" || p.startsWith("/create-team/")) {
        return `/create-organization${pathname.slice("/create-team".length)}${query}`;
    }
    if (p === "/agency/manage-teams" || p.startsWith("/agency/manage-teams/")) {
        return `/agency/manage-organizations${pathname.slice("/agency/manage-teams".length)}${query}`;
    }
    if (p === "/agency/teams" || p.startsWith("/agency/teams/")) {
        return `/agency/organizations${pathname.slice("/agency/teams".length)}${query}`;
    }
    if (p.startsWith("/agency/invoices/teams/") || p === "/agency/invoices/teams") {
        return `/agency/invoices/organizations${pathname.slice("/agency/invoices/teams".length)}${query}`;
    }
    return pathWithQuery;
}
function parseSafeInternalRedirectPath(raw) {
    if (raw == null)
        return null;
    let s = raw.trim();
    if (!s)
        return null;
    try {
        s = decodeURIComponent(s);
    }
    catch {
        return null;
    }
    const hashIdx = s.indexOf("#");
    if (hashIdx >= 0)
        s = s.slice(0, hashIdx);
    let query = "";
    const qIdx = s.indexOf("?");
    if (qIdx >= 0) {
        query = s.slice(qIdx);
        s = s.slice(0, qIdx);
    }
    if (!s.startsWith("/"))
        return null;
    if (s.startsWith("//"))
        return null;
    if (s.includes("://") || s.includes("\\"))
        return null;
    if (s.includes("\0") || s.includes("\n") || s.includes("\r") || s.includes("<")) {
        return null;
    }
    const lowerPath = s.toLowerCase();
    if (lowerPath.startsWith("/javascript:") ||
        lowerPath.startsWith("/data:") ||
        lowerPath.startsWith("/vbscript:")) {
        return null;
    }
    const segments = s.split("/").filter(Boolean);
    for (const seg of segments) {
        if (seg === ".." || seg === ".")
            return null;
    }
    if (s.length > 512 || query.length > 512)
        return null;
    if (s === "/")
        return null;
    if (s === "/auth" || s.startsWith("/auth/"))
        return null;
    return s + query;
}
async function userHasAccessToTeamSlug(userId, teamSlug) {
    const rows = await db
        .select({ id: team.id })
        .from(teamMember)
        .innerJoin(team, eq(teamMember.teamId, team.id))
        .where(and(eq(teamMember.userId, userId), eq(team.slug, teamSlug), eq(team.isActive, true)))
        .limit(1);
    return Boolean(rows[0]);
}
async function isUserAuthorizedForRedirectPath(pathWithQuery, userId, role) {
    const pathname = pathWithQuery.split("?")[0] ?? pathWithQuery;
    const pLower = pathname.toLowerCase();
    const isAgency = role?.includes("AGENCY") ?? false;
    if (pLower === "/agency" || pLower.startsWith("/agency/")) {
        return isAgency;
    }
    if (pLower === "/create-organization" || pLower.startsWith("/create-organization/")) {
        return !isAgency;
    }
    if (pLower === "/accept-invite" ||
        pLower.startsWith("/accept-invite/") ||
        pLower === "/update-role" ||
        pLower.startsWith("/update-role/") ||
        pLower === "/unauthorized" ||
        pLower.startsWith("/unauthorized/")) {
        return true;
    }
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];
    if (!first)
        return false;
    if (NON_TEAM_ROOT_SEGMENTS.has(first.toLowerCase())) {
        return false;
    }
    if (isAgency) {
        return false;
    }
    return userHasAccessToTeamSlug(userId, first);
}
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
        return "/create-organization";
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
 *
 * When `requestedRedirect` is set (e.g. from `?redirect=` on `/api/auth/redirect-target`), it is
 * used only if it is a safe internal path and allowed for the user's role (agency vs customer team).
 */
export async function getRootRedirectTargetFromHeaders(headers, requestedRedirect, prefetchedSession) {
    const session = prefetchedSession !== undefined
        ? prefetchedSession
        : await auth.api.getSession({ headers }).catch((err) => {
            console.error("[redirect-target] getSession failed:", err);
            throw err;
        });
    const sessionUser = session?.user ?? null;
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
    let dbStatus = normalizeStatus(u.status);
    let role = typeof u.role === "string" ? u.role.trim().toUpperCase() : undefined;
    let lastAccessedTeamId = u.lastAccessedTeamId;
    if (!dbStatus || !role) {
        const rows = await db
            .select({
            status: userTable.status,
            role: userTable.role,
            lastAccessedTeamId: userTable.lastAccessedTeamId,
        })
            .from(userTable)
            .where(eq(userTable.id, u.id))
            .limit(1)
            .catch((err) => {
            console.error("[redirect-target] DB query failed:", err);
            throw err;
        });
        const dbRow = rows[0];
        if (!dbRow) {
            await auth.api.signOut({ headers });
            return "/auth/login";
        }
        dbStatus = normalizeStatus(dbRow.status);
        role = typeof dbRow.role === "string" ? dbRow.role.trim().toUpperCase() : undefined;
        lastAccessedTeamId = dbRow.lastAccessedTeamId ?? lastAccessedTeamId;
    }
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
    u.status = dbStatus;
    u.role = role;
    u.lastAccessedTeamId = lastAccessedTeamId ?? u.lastAccessedTeamId;
    const isAgency = role?.includes("AGENCY");
    const defaultRedirect = isAgency
        ? "/agency/dashboard"
        : // CUSTOMER roles go through team routing (dashboard or create-organization).
            await getCustomerTeamRedirectPath(u);
    const safeLandingRedirect = parseSafeLandingPageRedirect(requestedRedirect ?? null);
    if (safeLandingRedirect) {
        if (process.env.NODE_ENV !== "production") {
            console.log("[redirect-target][using landing-page redirect]", {
                userId: u.id,
                role,
                safeLandingRedirect,
            });
        }
        return safeLandingRedirect;
    }
    const safeRequestedRaw = parseSafeInternalRedirectPath(requestedRedirect ?? null);
    const safeRequested = safeRequestedRaw
        ? remapLegacyUiPath(safeRequestedRaw)
        : null;
    if (safeRequested) {
        const allowed = await isUserAuthorizedForRedirectPath(safeRequested, u.id, role);
        if (allowed) {
            if (process.env.NODE_ENV !== "production") {
                console.log("[redirect-target][using requested redirect]", {
                    userId: u.id,
                    role,
                    safeRequested,
                    isAgency,
                });
            }
            return safeRequested;
        }
        if (process.env.NODE_ENV !== "production") {
            console.log("[redirect-target][requested redirect rejected]", {
                userId: u.id,
                role,
                safeRequested,
                isAgency,
                defaultRedirect,
            });
        }
    }
    if (process.env.NODE_ENV !== "production") {
        console.log("[redirect-target][role decision]", {
            userId: u.id,
            role,
            redirect: defaultRedirect,
            isAgency,
        });
    }
    return defaultRedirect;
}
