import { cache } from "react";
import { headers as getHeaders, cookies as getCookies } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import prisma from "@nPanel/db";

// Type-safe redirect wrapper for dynamic routes
function redirect(url: string): never {
  return nextRedirect(url as never);
}

/**
 * Server-side auth utilities
 * Uses React cache to deduplicate session fetches within a single request
 * Includes account status validation to ensure only ACTIVE users can access the app
 * Handles team-based access for CUSTOMER users
 */

type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

interface UserWithStatus {
  id: string;
  status?: UserStatus;
  role?: string;
  lastAccessedTeamId?: string | null;
  [key: string]: unknown;
}

/**
 * Get the current session (cached per request)
 * This prevents multiple DB calls when checking auth in layouts + pages
 * Uses fetch() to match middleware behavior and avoid origin validation issues
 */
// Direct import from the auth package - requires no HTTP overhead
import { auth } from "@nPanel/auth";

/**
 * Get the current session (cached per request)
 * This prevents multiple DB calls when checking auth in layouts + pages
 * optimized: Uses direct function call instead of HTTP fetch to avoid internal network overhead and deadlocks
 */
export const getSession = cache(async () => {
  const headers = await getHeaders();
  try {
    // Direct call to Better Auth - 0ms overhead vs 25s+ HTTP fetch loop
    const session = await auth.api.getSession({
      headers: headers,
    });

    return session;
  } catch (error) {
    console.error("[Auth Server] Error fetching session:", error);
    return null;
  }
});

/**
 * Sign out the current user by clearing the session
 */
async function signOutUser() {
  try {
    const headers = await getHeaders();
    await auth.api.signOut({
      headers: headers,
    });
  } catch (error) {
    console.error("[Auth Server] Error signing out user:", error);
  }
}

/**
 * Get the current user (null if not authenticated)
 * Does NOT check account status - use requireAuth() for full validation
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

/**
 * Validate user account status
 * Signs out and redirects if account is not ACTIVE
 */
async function validateUserStatus(user: UserWithStatus) {
  const userStatus = user.status;

  if (!userStatus || userStatus !== "ACTIVE") {
    // Sign out the user immediately
    await signOutUser();

    // Redirect to account status page with the status
    const statusParam = userStatus || "INACTIVE";
    redirect(`/account-status?status=${statusParam}`);
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Also validates account status and signs out if not ACTIVE
 */
export async function requireAuth() {
  console.log("[Auth Server] requireAuth() called");
  const user = await getCurrentUser();
  console.log("[Auth Server] requireAuth() - getCurrentUser() returned:", user ? `User ID: ${user.id}` : "null");

  if (!user) {
    console.log("[Auth Server] requireAuth() - No user, redirecting to /auth/login");
    redirect("/auth/login");
  }

  // Validate account status (ACTIVE, SUSPENDED, BANNED)
  console.log("[Auth Server] requireAuth() - Validating user status");
  await validateUserStatus(user as UserWithStatus);
  console.log("[Auth Server] requireAuth() - User validated, returning user");

  return user;
}

/**
 * Require specific role(s) - redirects to appropriate dashboard if role doesn't match
 * First validates account status, then checks role permissions
 * For CUSTOMER users, ensures they have a team before allowing access
 * @param allowedRoles - Array of allowed role strings
 */
export async function requireRole(allowedRoles: string[]) {
  console.log("[Auth Server] requireRole() called with allowedRoles:", allowedRoles);
  // First, ensure user is authenticated and has ACTIVE status
  const user = await requireAuth();
  const userRole = (user as UserWithStatus).role;
  console.log("[Auth Server] requireRole() - User role:", userRole);

  if (!userRole) {
    console.log("[Auth Server] requireRole() - No role assigned, redirecting to customer dashboard");
    // No role assigned - ensure team and redirect to customer dashboard
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    redirect(`/${teamSlug}/dashboard`);
  }

  // Check if user's role is in the allowed roles
  const isAllowed = allowedRoles.includes(userRole);
  console.log("[Auth Server] requireRole() - Is allowed:", isAllowed);

  if (!isAllowed) {
    console.log("[Auth Server] requireRole() - Role not allowed, redirecting based on role");
    // Redirect to appropriate dashboard based on role
    if (userRole === "CUSTOMER") {
      // Ensure customer has a team before redirecting
      const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
      redirect(`/${teamSlug}/dashboard`);
    }

    if (userRole.includes("AGENCY")) {
      console.log("[Auth Server] requireRole() - Redirecting AGENCY user to /agency/dashboard");
      redirect("/agency/dashboard");
    }

    // Fallback - ensure team for customer
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    redirect(`/${teamSlug}/dashboard`);
  }

  // If user is a CUSTOMER with correct role, ensure they have a team
  if (userRole === "CUSTOMER" && isAllowed) {
    await ensureCustomerHasTeam(user as UserWithStatus);
  }

  console.log("[Auth Server] requireRole() - Role check passed, returning user");
  return user;
}

/**
 * Check if user has customer role
 * Note: Does not validate account status - use requireRole() for protected routes
 */
export async function isCustomer() {
  const user = await getCurrentUser();
  if (!user) return false;

  const userRole = (user as UserWithStatus).role;
  return userRole === "CUSTOMER";
}

/**
 * Check if user has any agency role
 * Note: Does not validate account status - use requireRole() for protected routes
 */
export async function isAgency() {
  const user = await getCurrentUser();
  if (!user) return false;

  const userRole = (user as UserWithStatus).role;
  return userRole?.includes("AGENCY") ?? false;
}

/**
 * Verify user has access to a team by its slug
 * Updates lastAccessedTeamId if valid
 * Returns team data if accessible, null otherwise
 * 
 * Optimized: Batches database queries to reduce connection usage
 */
export async function verifyTeamAccess(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const userId = user.id;

  // Find the team by slug
  const team = await prisma.team.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      baseCurrency: true,
      isActive: true,
    },
  });

  if (!team || !team.isActive) return null;

  // Check if user is a member of this team
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) return null;

  // Update lastAccessedTeamId if different from current
  // Batch: Update user and log activity in a single transaction
  // This reduces connection usage from 2 sequential queries to 1 transaction
  const currentLastAccessedTeamId = (user as UserWithStatus).lastAccessedTeamId;
  if (currentLastAccessedTeamId !== team.id) {
    // Batch user update and activity log in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { lastAccessedTeamId: team.id },
      });

      // Log the team access
      await tx.userActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: userId,
          action: "TEAM_SWITCHED",
          description: `User switched to team: ${team.name}`,
          metadata: {
            teamId: team.id,
            teamName: team.name,
            teamSlug: team.slug,
            fromUrl: true,
          },
          createdAt: new Date(),
        },
      });
    });
  }

  return {
    ...team,
    role: membership.role,
  };
}

/**
 * Ensure customer user has a team and lastAccessedTeamId is set
 * Redirects to /create-team if user has no teams
 * Sets lastAccessedTeamId to first team if not set
 * Returns team slug for URL routing
 * 
 * Optimized: Batches database queries to reduce connection usage
 */
export async function ensureCustomerHasTeam(user: UserWithStatus): Promise<string> {
  const userId = user.id;
  const lastAccessedTeamId = user.lastAccessedTeamId;

  // If user already has a lastAccessedTeamId, verify it still exists
  if (lastAccessedTeamId) {
    const teamStillExists = await prisma.teamMember.findFirst({
      where: {
        userId: userId,
        teamId: lastAccessedTeamId,
      },
      include: {
        team: {
          select: {
            isActive: true,
            slug: true,
          },
        },
      },
    });

    // If team exists and is active, return its slug
    if (teamStillExists && teamStillExists.team.isActive) {
      return teamStillExists.team.slug;
    }
  }

  // Find all teams user is a member of
  const userTeams = await prisma.teamMember.findMany({
    where: {
      userId: userId,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc", // Get oldest membership first
    },
  });

  // Filter for active teams only
  const activeTeams = userTeams.filter((membership) => membership.team.isActive);

  // If user has no active teams, redirect to create-team page
  if (activeTeams.length === 0) {
    redirect("/create-team");
  }

  // Pick the first active team
  const firstTeam = activeTeams[0];
  const teamId = firstTeam.team.id;
  const teamSlug = firstTeam.team.slug;

  // Batch: Update user's lastAccessedTeamId and log activity in a single transaction
  // This reduces connection usage from 2 queries to 1 transaction
  await prisma.$transaction(async (tx) => {
    // Update user's lastAccessedTeamId
    await tx.user.update({
      where: { id: userId },
      data: { lastAccessedTeamId: teamId },
    });

    // Log the team access
    await tx.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        action: "TEAM_ACCESSED",
        description: `User accessed team: ${firstTeam.team.name}`,
        metadata: {
          teamId: teamId,
          teamName: firstTeam.team.name,
          teamSlug: teamSlug,
          autoSet: !lastAccessedTeamId, // Track if it was auto-set
        },
        createdAt: new Date(),
      },
    });
  });

  return teamSlug;
}

/**
 * Same as ensureCustomerHasTeam but returns redirect path instead of calling redirect().
 * Used by API route so we can return JSON { redirect } for client-side navigation.
 */
export async function getCustomerTeamRedirectPath(user: UserWithStatus): Promise<string> {
  const userId = user.id;
  const lastAccessedTeamId = user.lastAccessedTeamId;

  if (lastAccessedTeamId) {
    const teamStillExists = await prisma.teamMember.findFirst({
      where: { userId, teamId: lastAccessedTeamId },
      include: { team: { select: { isActive: true, slug: true } } },
    });
    if (teamStillExists?.team.isActive) return `/${teamStillExists.team.slug}/dashboard`;
  }

  const userTeams = await prisma.teamMember.findMany({
    where: { userId },
    include: { team: { select: { id: true, name: true, slug: true, isActive: true } } },
    orderBy: { createdAt: "asc" },
  });
  const activeTeams = userTeams.filter((m) => m.team.isActive);
  if (activeTeams.length === 0) return "/create-team";

  const firstTeam = activeTeams[0];
  const teamId = firstTeam.team.id;
  const teamSlug = firstTeam.team.slug;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { lastAccessedTeamId: teamId } });
    await tx.userActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: "TEAM_ACCESSED",
        description: `User accessed team: ${firstTeam.team.name}`,
        metadata: { teamId, teamName: firstTeam.team.name, teamSlug, autoSet: !lastAccessedTeamId },
        createdAt: new Date(),
      },
    });
  });
  return `/${teamSlug}/dashboard`;
}

/**
 * Returns the redirect URL for the root path "/" without throwing.
 * Used by GET /api/auth/redirect-target so the root page can show a loader and redirect client-side.
 */
export async function getRootRedirectTarget(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return "/auth/login";

  const u = user as UserWithStatus;
  const status = u.status;
  if (!status || status !== "ACTIVE") {
    await signOutUser();
    return `/account-status?status=${status || "INACTIVE"}`;
  }

  const role = u.role;
  if (role === "CUSTOMER") return getCustomerTeamRedirectPath(u);
  if (role?.includes("AGENCY")) return "/agency/dashboard";
  return getCustomerTeamRedirectPath(u);
}

/**
 * Redirect authenticated users away from auth pages
 * Validates account status and signs out inactive users before redirecting
 * For CUSTOMER users, ensures they have a team before redirecting to dashboard
 */
export async function redirectIfAuthenticated() {
  console.log("[Auth Server] redirectIfAuthenticated() called");
  const user = await getCurrentUser();
  console.log("[Auth Server] getCurrentUser() returned:", user ? `User ID: ${user.id}, Role: ${(user as UserWithStatus).role}` : "null");

  if (user) {
    console.log("[Auth Server] User found, validating status and redirecting...");
    // Validate account status first
    await validateUserStatus(user as UserWithStatus);

    const userRole = (user as UserWithStatus).role;
    console.log("[Auth Server] User role:", userRole);

    if (userRole === "CUSTOMER") {
      // Ensure customer has a team, redirect to /create-team if not
      const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
      console.log("[Auth Server] Redirecting CUSTOMER to:", `/${teamSlug}/dashboard`);
      redirect(`/${teamSlug}/dashboard`);
    }

    if (userRole?.includes("AGENCY")) {
      console.log("[Auth Server] Redirecting AGENCY to: /agency/dashboard");
      console.log("[Auth Server] About to call redirect() - this will throw a NEXT_REDIRECT error");
      // Use absolute URL to ensure redirect works correctly
      const redirectUrl = "/agency/dashboard";
      console.log("[Auth Server] Calling redirect() with URL:", redirectUrl);
      // redirect() throws a NEXT_REDIRECT error that Next.js catches to perform the redirect
      redirect(redirectUrl);
      // This line should never be reached
      console.error("[Auth Server] ERROR: redirect() did not throw - this should never happen!");
    }

    // Fallback
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    console.log("[Auth Server] Redirecting fallback to:", `/${teamSlug}/dashboard`);
    redirect(`/${teamSlug}/dashboard`);
  } else {
    console.log("[Auth Server] No user found, not redirecting");
  }
}

