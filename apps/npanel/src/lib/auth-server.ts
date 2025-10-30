import { cache } from "react";
import { headers as getHeaders, cookies as getCookies } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { auth } from "@nPanel/auth";
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
 */
export const getSession = cache(async () => {
  const headers = await getHeaders();
  try {
    const host = headers.get("x-forwarded-host") || headers.get("host") || "";
    const proto = headers.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";
    const res = await fetch(`${origin}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: headers.get("cookie") ?? "",
        host,
        "x-forwarded-host": headers.get("x-forwarded-host") ?? host,
        "x-forwarded-proto": headers.get("x-forwarded-proto") ?? proto,
        "user-agent": headers.get("user-agent") ?? "",
        accept: "application/json",
      },
      cache: "no-store",
      redirect: "manual",
    });
    if (!res.ok) return null;
    return await res.json();
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
    const host = headers.get("x-forwarded-host") || headers.get("host") || "";
    const proto = headers.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";
    await fetch(`${origin}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        cookie: headers.get("cookie") ?? "",
        host,
        "x-forwarded-host": headers.get("x-forwarded-host") ?? host,
        "x-forwarded-proto": headers.get("x-forwarded-proto") ?? proto,
        "user-agent": headers.get("user-agent") ?? "",
        accept: "application/json",
      },
      cache: "no-store",
      redirect: "manual",
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
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  // Validate account status (ACTIVE, SUSPENDED, BANNED)
  await validateUserStatus(user as UserWithStatus);
  
  return user;
}

/**
 * Require specific role(s) - redirects to appropriate dashboard if role doesn't match
 * First validates account status, then checks role permissions
 * For CUSTOMER users, ensures they have a team before allowing access
 * @param allowedRoles - Array of allowed role strings
 */
export async function requireRole(allowedRoles: string[]) {
  // First, ensure user is authenticated and has ACTIVE status
  const user = await requireAuth();
  const userRole = (user as UserWithStatus).role;
  
  if (!userRole) {
    // No role assigned - ensure team and redirect to customer dashboard
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    redirect(`/${teamSlug}/default`);
  }
  
  // Check if user's role is in the allowed roles
  const isAllowed = allowedRoles.includes(userRole);
  
  if (!isAllowed) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "CUSTOMER") {
      // Ensure customer has a team before redirecting
      const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
      redirect(`/${teamSlug}/default`);
    }
    
    if (userRole.includes("AGENCY")) {
      redirect("/agency/default");
    }
    
    // Fallback - ensure team for customer
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    redirect(`/${teamSlug}/default`);
  }
  
  // If user is a CUSTOMER with correct role, ensure they have a team
  if (userRole === "CUSTOMER" && isAllowed) {
    await ensureCustomerHasTeam(user as UserWithStatus);
  }
  
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
  const currentLastAccessedTeamId = (user as UserWithStatus).lastAccessedTeamId;
  if (currentLastAccessedTeamId !== team.id) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastAccessedTeamId: team.id },
    });
    
    // Log the team access
    await prisma.userActivityLog.create({
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
 */
async function ensureCustomerHasTeam(user: UserWithStatus): Promise<string> {
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
  
  // Update user's lastAccessedTeamId
  await prisma.user.update({
    where: { id: userId },
    data: { lastAccessedTeamId: teamId },
  });
  
  // Log the team access
  await prisma.userActivityLog.create({
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
  
  return teamSlug;
}

/**
 * Redirect authenticated users away from auth pages
 * Validates account status and signs out inactive users before redirecting
 * For CUSTOMER users, ensures they have a team before redirecting to dashboard
 */
export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();
  
  if (user) {
    // Validate account status first
    await validateUserStatus(user as UserWithStatus);
    
    const userRole = (user as UserWithStatus).role;
    
    if (userRole === "CUSTOMER") {
      // Ensure customer has a team, redirect to /create-team if not
      const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
      redirect(`/${teamSlug}/default`);
    }
    
    if (userRole?.includes("AGENCY")) {
      redirect("/agency/default");
    }
    
    // Fallback
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    redirect(`/${teamSlug}/default`);
  }
}

