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
export const getSession = cache(async () => {
  const headers = await getHeaders();
  try {
    // CRITICAL FIX: Construct URL that works in both dev and production
    // Strategy:
    // 1. Use INTERNAL_SERVER_URL env var if set (for production - e.g., Render internal URL)
    // 2. Use BETTER_AUTH_URL if set (fallback)
    // 3. Construct from request headers (works for same-server requests)
    // 4. Fallback to localhost only in development
    
    // Get host and protocol from headers
    const host = headers.get("x-forwarded-host") || headers.get("host") || "";
    const xfProto = headers.get("x-forwarded-proto") || "";
    const proto = xfProto.includes("https") ? "https" : (xfProto.includes("http") ? "http" : "http");
    
    // Determine the internal server URL
    // In production (Render, Vercel, etc.), you can set INTERNAL_SERVER_URL to the actual server URL
    // For example: INTERNAL_SERVER_URL=https://your-app.onrender.com
    // If not set, we'll use the host from headers (which works for same-server requests)
    let internalUrl = process.env.INTERNAL_SERVER_URL || process.env.BETTER_AUTH_URL;
    
    if (!internalUrl) {
      // Use the host from headers - this will be the actual server URL
      // In dev: localhost:3001
      // In production: your-app.onrender.com (or whatever your server URL is)
      if (host) {
        internalUrl = `${proto}://${host}`;
      } else {
        // Last resort: localhost with PORT (development only)
        internalUrl = process.env.PORT 
          ? `http://localhost:${process.env.PORT}`
          : "http://localhost:3001";
      }
    }
    
    const url = new URL("/api/auth/get-session", internalUrl);
    
    // Preserve original request headers for Better Auth validation
    // The x-forwarded-host header tells Better Auth what the external/original domain was
    // This is critical for origin validation against trustedOrigins
    const originalHost = headers.get("x-forwarded-host") || host;
    
    console.log("[Auth Server] Fetching session from:", url.toString(), "(server URL:", internalUrl, ", original host:", originalHost, ")");
    
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      headers: {
        cookie: headers.get("cookie") ?? "",
        // Preserve original request headers for proper origin detection in Better Auth
        // x-forwarded-host is the key - it tells Better Auth the external domain
        host: originalHost || url.host,
        "x-forwarded-host": originalHost || url.host,
        "x-forwarded-proto": proto,
        "user-agent": headers.get("user-agent") ?? "",
        accept: "application/json",
        "accept-language": headers.get("accept-language") ?? "en",
      },
      cache: "no-store",
    });
    
    console.log("[Auth Server] Session fetch response status:", res.status, res.statusText);
    
    if (!res.ok) {
      console.log("[Auth Server] Session fetch failed, status:", res.status);
      return null;
    }
    
    const session = await res.json().catch((err) => {
      console.error("[Auth Server] Failed to parse session JSON:", err);
      return null;
    });
    
    console.log("[Auth Server] Session result:", session ? `User: ${session.user?.email || 'no email'}` : "null");
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
    // Use fetch() to match middleware behavior and avoid origin validation issues
    const host = headers.get("x-forwarded-host") || headers.get("host") || "";
    const xfProto = headers.get("x-forwarded-proto") || "";
    const proto = xfProto.includes("https") ? "https" : (xfProto.includes("http") ? "http" : "https");
    const origin = host ? `${proto}://${host}` : "";
    
    if (!origin) {
      console.error("[Auth Server] Could not determine origin for sign out");
      return;
    }
    
    const url = new URL("/api/auth/sign-out", origin);
    
    await fetch(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: headers.get("cookie") ?? "",
        host,
        "x-forwarded-host": headers.get("x-forwarded-host") ?? host,
        "x-forwarded-proto": proto,
        "user-agent": headers.get("user-agent") ?? "",
        accept: "application/json",
      },
      cache: "no-store",
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
    redirect(`/${teamSlug}/default`);
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
      redirect(`/${teamSlug}/default`);
    }
    
    if (userRole.includes("AGENCY")) {
      console.log("[Auth Server] requireRole() - Redirecting AGENCY user to /agency/default");
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
      console.log("[Auth Server] Redirecting CUSTOMER to:", `/${teamSlug}/default`);
      redirect(`/${teamSlug}/default`);
    }
    
    if (userRole?.includes("AGENCY")) {
      console.log("[Auth Server] Redirecting AGENCY to: /agency/default");
      console.log("[Auth Server] About to call redirect() - this will throw a NEXT_REDIRECT error");
      // Use absolute URL to ensure redirect works correctly
      const redirectUrl = "/agency/default";
      console.log("[Auth Server] Calling redirect() with URL:", redirectUrl);
      // redirect() throws a NEXT_REDIRECT error that Next.js catches to perform the redirect
      redirect(redirectUrl);
      // This line should never be reached
      console.error("[Auth Server] ERROR: redirect() did not throw - this should never happen!");
    }
    
    // Fallback
    const teamSlug = await ensureCustomerHasTeam(user as UserWithStatus);
    console.log("[Auth Server] Redirecting fallback to:", `/${teamSlug}/default`);
    redirect(`/${teamSlug}/default`);
  } else {
    console.log("[Auth Server] No user found, not redirecting");
  }
}

