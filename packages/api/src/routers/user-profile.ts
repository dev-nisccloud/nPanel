import * as crypto from "node:crypto";
import { z } from "zod";
import { and, desc, eq, gt, inArray } from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { session, user } from "@npanel/db/schema/auth";
import { userActivityLog, userProfile } from "@npanel/db/schema/auth-extras";
import { team, teamMember } from "@npanel/db/schema/teams";
import { mapUserAdminFields, mapUserEmailPreferences } from "../lib/user-extra-fields";
import { invalidateSessionCache } from "@npanel/auth/session-cache";

// Zod schemas for API - independent from database schema
const userInfoOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"]),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  profile: z
    .object({
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      country: z.string().nullable(),
      postalCode: z.string().nullable(),
    })
    .nullable(),
});

const updateProfileInputSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

const updateProfileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

const sessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
  isCurrent: z.boolean(),
});

const sessionsOutputSchema = z.array(sessionSchema);

const revokeSessionInputSchema = z.object({
  sessionId: z.string(),
});

const revokeSessionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

const revokeAllSessionsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  revokedCount: z.number(),
});

// Schema for getUserById input
const getUserByIdInputSchema = z.object({
  userId: z.string(),
  fields: z
    .array(
      z.enum([
        "id",
        "name",
        "email",
        "emailVerified",
        "image",
        "role",
        "status",
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        "profile",
      ]),
    )
    .optional(),
});

// Schema for batch getUsersByIds
const getUsersByIdsInputSchema = z.object({
  userIds: z.array(z.string()).min(1).max(100), // Limit to 100 users per batch
  fields: z
    .array(
      z.enum([
        "id",
        "name",
        "email",
        "emailVerified",
        "image",
        "role",
        "status",
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        "profile",
      ]),
    )
    .optional(),
});

const getUsersByIdsOutputSchema = z.record(z.string(), z.any()); // userId -> user data map

function mapProfileRow(p: typeof userProfile.$inferSelect | undefined) {
  if (!p) return null;
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    address: p.address,
    city: p.city,
    state: p.state,
    country: p.country,
    postalCode: p.postalCode,
  };
}

function isAgencyUserRole(role: string | null | undefined): boolean {
  return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}

function getActor(ctx: { session: { user?: { id?: string; role?: string | null } } | null }) {
  const actor = ctx.session?.user;
  if (!actor?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  return { id: actor.id, role: actor.role };
}

const REGISTRANT_PROFILE_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  address: "Street address",
  city: "City",
  country: "Country",
  postalCode: "Postal code",
  phone: "Phone number",
};

function getMissingRegistrantProfileFields(
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    postalCode?: string | null;
    phone?: string | null;
  } | null | undefined,
): string[] {
  if (!profile) return Object.values(REGISTRANT_PROFILE_FIELD_LABELS);
  const missing: string[] = [];
  for (const key of Object.keys(REGISTRANT_PROFILE_FIELD_LABELS)) {
    const value = profile[key as keyof typeof profile];
    if (!value || String(value).trim() === "") {
      missing.push(REGISTRANT_PROFILE_FIELD_LABELS[key]!);
    }
  }
  return missing;
}

const customerForRegistrantOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  profileComplete: z.boolean(),
  missingFields: z.array(z.string()),
  profile: z
    .object({
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      country: z.string().nullable(),
      postalCode: z.string().nullable(),
    })
    .nullable(),
});

export const userProfileRouter = router({
  /**
   * Get current user's full profile information
   */
  getUserInfo: protectedProcedure
    .output(userInfoOutputSchema)
    .query(async ({ ctx }) => {
      const sessionCtx = ctx.session;

      if (!sessionCtx?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = sessionCtx.user.id;

      const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

      if (!u) {
        throw new Error("User not found");
      }

      const [p] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        role: u.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
        status: u.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED",
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        profile: mapProfileRow(p),
      };
    }),

  /**
   * Update user profile information
   */
  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .output(updateProfileOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const sessionCtx = ctx.session;

      if (!sessionCtx?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = sessionCtx.user.id;

      const { name, firstName, lastName, phone, address, city, state, country, postalCode } = input;

      await db.transaction(async (tx) => {
        if (name) {
          await tx
            .update(user)
            .set({
              name,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));
        }

        const [existingProfile] = await tx
          .select()
          .from(userProfile)
          .where(eq(userProfile.userId, userId))
          .limit(1);

        const now = new Date();
        const profilePatch: Partial<typeof userProfile.$inferInsert> = {
          updatedAt: now,
        };
        if (firstName !== undefined) profilePatch.firstName = firstName;
        if (lastName !== undefined) profilePatch.lastName = lastName;
        if (phone !== undefined) profilePatch.phone = phone;
        if (address !== undefined) profilePatch.address = address;
        if (city !== undefined) profilePatch.city = city;
        if (state !== undefined) profilePatch.state = state;
        if (country !== undefined) profilePatch.country = country;
        if (postalCode !== undefined) profilePatch.postalCode = postalCode;

        if (existingProfile) {
          await tx.update(userProfile).set(profilePatch).where(eq(userProfile.userId, userId));
        } else {
          await tx.insert(userProfile).values({
            id: crypto.randomUUID(),
            userId,
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            phone: phone ?? null,
            address: address ?? null,
            city: city ?? null,
            state: state ?? null,
            country: country ?? null,
            postalCode: postalCode ?? null,
            createdAt: now,
            updatedAt: now,
          });
        }

        await tx.insert(userActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          action: "PROFILE_UPDATED",
          description: "User updated their profile information",
          metadata: { updatedFields: Object.keys(input) },
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });
      });

      return {
        success: true,
        message: "Profile updated successfully",
      };
    }),

  /**
   * Get all active sessions for current user
   */
  getSessions: protectedProcedure
    .output(sessionsOutputSchema)
    .query(async ({ ctx }) => {
      const sessionCtx = ctx.session;

      if (!sessionCtx?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = sessionCtx.user.id;
      const currentSessionId = sessionCtx.session?.id ?? null;

      const sessionsList = await db
        .select()
        .from(session)
        .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
        .orderBy(desc(session.updatedAt));

      return sessionsList.map((s) => ({
        id: s.id,
        token: `${s.token.substring(0, 10)}...`,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        expiresAt: s.expiresAt,
        isCurrent: Boolean(currentSessionId && s.id === currentSessionId),
      }));
    }),

  /**
   * Revoke a specific session
   */
  revokeSession: protectedProcedure
    .input(revokeSessionInputSchema)
    .output(revokeSessionOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const sessionCtx = ctx.session;

      if (!sessionCtx?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = sessionCtx.user.id;
      const currentSessionId = sessionCtx.session?.id ?? null;

      await db.transaction(async (tx) => {
        const [sessionToRevoke] = await tx
          .select()
          .from(session)
          .where(eq(session.id, input.sessionId))
          .limit(1);

        if (!sessionToRevoke) {
          throw new Error("Session not found");
        }

        if (sessionToRevoke.userId !== userId) {
          throw new Error("You can only revoke your own sessions");
        }

        if (currentSessionId && sessionToRevoke.id === currentSessionId) {
          throw new Error("You cannot revoke your current session. Please log out instead.");
        }

        await tx.delete(session).where(eq(session.id, input.sessionId));

        await tx.insert(userActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          action: "SESSION_REVOKED",
          description: "User revoked a session",
          metadata: {
            sessionId: input.sessionId,
            ipAddress: sessionToRevoke.ipAddress,
          },
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        });
      });

      await invalidateSessionCache(input.sessionId);

      return {
        success: true,
        message: "Session revoked successfully",
      };
    }),

  /**
   * Revoke all sessions for the current user, including the current session.
   */
  revokeAllSessions: protectedProcedure
    .output(revokeAllSessionsOutputSchema)
    .mutation(async ({ ctx }) => {
      const sessionCtx = ctx.session;

      if (!sessionCtx?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = sessionCtx.user.id;

      const activeSessions = await db
        .select({ id: session.id })
        .from(session)
        .where(eq(session.userId, userId));

      const sessionIds = activeSessions.map((s) => s.id);

      await db.transaction(async (tx) => {
        if (sessionIds.length > 0) {
          await tx.delete(session).where(eq(session.userId, userId));
        }

        await tx.insert(userActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          action: "SESSIONS_REVOKED_ALL",
          description: "User revoked all sessions including current",
          metadata: {
            revokedCount: sessionIds.length,
            sessionIds,
          },
          ipAddress: ctx.ipAddress ?? null,
          userAgent: ctx.req?.raw?.headers?.get("user-agent") ?? null,
          createdAt: new Date(),
        });
      });

      await Promise.all(sessionIds.map((id) => invalidateSessionCache(id)));

      return {
        success: true,
        message: "All sessions revoked successfully",
        revokedCount: sessionIds.length,
      };
    }),

  /**
   * Get user information by ID with optional field selection
   * This is useful for cases where you only need specific user fields
   */
  getUserById: protectedProcedure.input(getUserByIdInputSchema).query(async ({ ctx, input }) => {
    const actor = getActor(ctx);
    const { userId, fields } = input;
    if (!isAgencyUserRole(actor.role) && actor.id !== userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this user" });
    }

    const includeProfile = fields?.includes("profile") ?? false;

    if (!fields || fields.length === 0) {
      const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

      if (!u) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const [p] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        role: u.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
        status: u.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED",
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        ...mapUserEmailPreferences(u),
        ...mapUserAdminFields(u),
        profile: mapProfileRow(p),
      };
    }

    const selectCols: Record<string, boolean> = { id: true };
    if (fields.includes("name")) selectCols.name = true;
    if (fields.includes("email")) selectCols.email = true;
    if (fields.includes("emailVerified")) selectCols.emailVerified = true;
    if (fields.includes("image")) selectCols.image = true;
    if (fields.includes("role")) selectCols.role = true;
    if (fields.includes("status")) selectCols.status = true;
    if (fields.includes("lastLoginAt")) selectCols.lastLoginAt = true;
    if (fields.includes("createdAt")) selectCols.createdAt = true;
    if (fields.includes("updatedAt")) selectCols.updatedAt = true;

    const projection: Record<string, unknown> = { id: user.id };
    if (selectCols.name) projection.name = user.name;
    if (selectCols.email) projection.email = user.email;
    if (selectCols.emailVerified) projection.emailVerified = user.emailVerified;
    if (selectCols.image) projection.image = user.image;
    if (selectCols.role) projection.role = user.role;
    if (selectCols.status) projection.status = user.status;
    if (selectCols.lastLoginAt) projection.lastLoginAt = user.lastLoginAt;
    if (selectCols.createdAt) projection.createdAt = user.createdAt;
    if (selectCols.updatedAt) projection.updatedAt = user.updatedAt;

    const [u] = await db.select(projection as any).from(user).where(eq(user.id, userId)).limit(1);

    if (!u) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const uAny = u as Record<string, unknown>;
    let profilePayload: ReturnType<typeof mapProfileRow> | null | undefined;
    if (includeProfile) {
      const [p] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
      profilePayload = mapProfileRow(p);
    }

    const response: Record<string, unknown> = {};
    if (fields.includes("id")) response.id = uAny.id;
    if (fields.includes("name")) response.name = uAny.name;
    if (fields.includes("email")) response.email = uAny.email;
    if (fields.includes("emailVerified")) response.emailVerified = uAny.emailVerified;
    if (fields.includes("image")) response.image = uAny.image;
    if (fields.includes("role"))
      response.role = uAny.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
    if (fields.includes("status"))
      response.status = uAny.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
    if (fields.includes("lastLoginAt")) response.lastLoginAt = uAny.lastLoginAt;
    if (fields.includes("createdAt")) response.createdAt = uAny.createdAt;
    if (fields.includes("updatedAt")) response.updatedAt = uAny.updatedAt;
    if (fields.includes("profile")) {
      response.profile = profilePayload ?? null;
    }

    return response;
  }),

  /**
   * Get multiple users by IDs in a single request (batched)
   * Returns a map of userId -> user data for efficient lookups
   */
  getUsersByIds: protectedProcedure
    .input(getUsersByIdsInputSchema)
    .output(getUsersByIdsOutputSchema)
    .query(async ({ ctx, input }) => {
      const actor = getActor(ctx);
      const { userIds, fields } = input;
      const requestedUserIds = Array.from(new Set(userIds));

      const uniqueUserIds = isAgencyUserRole(actor.role)
        ? requestedUserIds
        : requestedUserIds.includes(actor.id)
          ? [actor.id]
          : [];

      if (uniqueUserIds.length === 0) {
        return {};
      }

      const includeProfile = fields?.includes("profile") ?? false;
      const allFields = !fields || fields.length === 0;

      const projection: Record<string, unknown> = { id: user.id };
      if (allFields || fields!.includes("name")) projection.name = user.name;
      if (allFields || fields!.includes("email")) projection.email = user.email;
      if (allFields || fields!.includes("emailVerified")) projection.emailVerified = user.emailVerified;
      if (allFields || fields!.includes("image")) projection.image = user.image;
      if (allFields || fields!.includes("role")) projection.role = user.role;
      if (allFields || fields!.includes("status")) projection.status = user.status;
      if (allFields || fields!.includes("lastLoginAt")) projection.lastLoginAt = user.lastLoginAt;
      if (allFields || fields!.includes("createdAt")) projection.createdAt = user.createdAt;
      if (allFields || fields!.includes("updatedAt")) projection.updatedAt = user.updatedAt;

      const rows = await db
        .select(projection as any)
        .from(user)
        .where(inArray(user.id, uniqueUserIds));

      const profilesByUserId = new Map<string, typeof userProfile.$inferSelect>();
      if (includeProfile) {
        const profiles = await db
          .select()
          .from(userProfile)
          .where(inArray(userProfile.userId, uniqueUserIds));
        for (const p of profiles) {
          profilesByUserId.set(p.userId, p);
        }
      }

      const usersMap: Record<string, unknown> = {};

      for (const row of rows) {
        const uAny = row as Record<string, unknown>;
        const uid = uAny.id as string;
        const userData: Record<string, unknown> = {};

        if (allFields || fields!.includes("id")) userData.id = uAny.id;
        if (allFields || fields!.includes("name")) userData.name = uAny.name;
        if (allFields || fields!.includes("email")) userData.email = uAny.email;
        if (allFields || fields!.includes("emailVerified")) userData.emailVerified = uAny.emailVerified;
        if (allFields || fields!.includes("image")) userData.image = uAny.image;
        if (allFields || fields!.includes("role")) userData.role = uAny.role;
        if (allFields || fields!.includes("status")) userData.status = uAny.status;
        if (allFields || fields!.includes("lastLoginAt")) userData.lastLoginAt = uAny.lastLoginAt;
        if (allFields || fields!.includes("createdAt")) userData.createdAt = uAny.createdAt;
        if (allFields || fields!.includes("updatedAt")) userData.updatedAt = uAny.updatedAt;
        if (includeProfile) {
          userData.profile = mapProfileRow(profilesByUserId.get(uid));
        }

        usersMap[uid] = userData;
      }

      return usersMap;
    }),

  /**
   * Agency: list customer users with profile completeness for domain registrant selection.
   */
  listCustomersForRegistrant: protectedProcedure
    .output(z.array(customerForRegistrantOutputSchema))
    .query(async ({ ctx }) => {
      const actor = getActor(ctx);
      if (!isAgencyUserRole(actor.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can list customers for registrant selection.",
        });
      }

      const rows = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          phone: userProfile.phone,
          address: userProfile.address,
          city: userProfile.city,
          state: userProfile.state,
          country: userProfile.country,
          postalCode: userProfile.postalCode,
          profileUserId: userProfile.userId,
        })
        .from(user)
        .leftJoin(userProfile, eq(userProfile.userId, user.id))
        .where(eq(user.role, "CUSTOMER"))
        .orderBy(desc(user.createdAt));

      return rows.map((row) => {
        const profile = row.profileUserId
          ? {
              firstName: row.firstName,
              lastName: row.lastName,
              phone: row.phone,
              address: row.address,
              city: row.city,
              state: row.state,
              country: row.country,
              postalCode: row.postalCode,
            }
          : null;
        const missingFields = getMissingRegistrantProfileFields(profile);
        return customerForRegistrantOutputSchema.parse({
          id: row.id,
          name: row.name,
          email: row.email,
          profile,
          profileComplete: missingFields.length === 0,
          missingFields,
        });
      });
    }),

  /**
   * Agency: organizations a customer belongs to, so checkout can link the order to that team.
   */
  listTeamsForCustomer: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const actor = getActor(ctx);
      if (!isAgencyUserRole(actor.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can list a customer's organizations.",
        });
      }

      const memberships = await db
        .select({ id: team.id, name: team.name, slug: team.slug })
        .from(teamMember)
        .innerJoin(team, eq(team.id, teamMember.teamId))
        .where(eq(teamMember.userId, input.userId));

      const created = await db
        .select({ id: team.id, name: team.name, slug: team.slug })
        .from(team)
        .where(eq(team.createdById, input.userId));

      const byId = new Map<string, { id: string; name: string; slug: string }>();
      for (const row of [...memberships, ...created]) {
        byId.set(row.id, row);
      }
      return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    }),
});
