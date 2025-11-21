import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

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
  profile: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    postalCode: z.string().nullable(),
  }).nullable(),
});

const updateProfileInputSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
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

// Schema for getUserById input
const getUserByIdInputSchema = z.object({
  userId: z.string(),
  fields: z.array(z.enum([
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
  ])).optional(),
});

export const userProfileRouter = router({
  /**
   * Get current user's full profile information
   */
  getUserInfo: publicProcedure
    .output(userInfoOutputSchema)
    .query(async ({ ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
        status: user.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED",
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          address: user.profile.address,
          city: user.profile.city,
          state: user.profile.state,
          country: user.profile.country,
          postalCode: user.profile.postalCode,
        } : null,
      };
    }),

  /**
   * Update user profile information
   */
  updateProfile: publicProcedure
    .input(updateProfileInputSchema)
    .output(updateProfileOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      // Separate user fields from profile fields
      const { name, firstName, lastName, phone, address, city, state, country, postalCode } = input;

      // Update user name if provided
      if (name) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            name,
            updatedAt: new Date(),
          },
        });
      }

      // Check if profile exists
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      const profileData = {
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        updatedAt: new Date(),
      };

      if (existingProfile) {
        // Update existing profile
        await prisma.userProfile.update({
          where: { userId },
          data: profileData,
        });
      } else {
        // Create new profile
        await prisma.userProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            ...profileData,
            createdAt: new Date(),
          },
        });
      }

      // Log the profile update
      await prisma.userActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action: "PROFILE_UPDATED",
          description: "User updated their profile information",
          metadata: {
            updatedFields: Object.keys(input),
          },
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Profile updated successfully",
      };
    }),

  /**
   * Get all active sessions for current user
   */
  getSessions: publicProcedure
    .output(sessionsOutputSchema)
    .query(async ({ ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;
      
      // Get current session token from headers
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          sessions: {
            where: {
              expiresAt: {
                gt: new Date(),
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      });
      
      const currentSessionToken = currentUser?.sessions[0]?.token;

      const sessions = await prisma.session.findMany({
        where: { 
          userId,
          expiresAt: {
            gt: new Date(), // Only return non-expired sessions
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return sessions.map((s) => ({
        id: s.id,
        token: s.token.substring(0, 10) + "...", // Only show partial token for security
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        expiresAt: s.expiresAt,
        isCurrent: s.token === currentSessionToken,
      }));
    }),

  /**
   * Revoke a specific session
   */
  revokeSession: publicProcedure
    .input(revokeSessionInputSchema)
    .output(revokeSessionOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      // Find the session to revoke
      const sessionToRevoke = await prisma.session.findUnique({
        where: { id: input.sessionId },
      });

      if (!sessionToRevoke) {
        throw new Error("Session not found");
      }

      // Verify session belongs to current user
      if (sessionToRevoke.userId !== userId) {
        throw new Error("You can only revoke your own sessions");
      }

      // Get the most recent session to prevent revoking current one
      const currentSession = await prisma.session.findFirst({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      // Prevent revoking current session
      if (currentSession && sessionToRevoke.token === currentSession.token) {
        throw new Error("You cannot revoke your current session. Please log out instead.");
      }

      // Delete the session
      await prisma.session.delete({
        where: { id: input.sessionId },
      });

      // Log the session revocation
      await prisma.userActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action: "SESSION_REVOKED",
          description: "User revoked a session",
          metadata: {
            sessionId: input.sessionId,
            ipAddress: sessionToRevoke.ipAddress,
          },
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Session revoked successfully",
      };
    }),

  /**
   * Get user information by ID with optional field selection
   * This is useful for cases where you only need specific user fields
   */
  getUserById: protectedProcedure
    .input(getUserByIdInputSchema)
    .query(async ({ input }) => {
      const { userId, fields } = input;
      
      // Build Prisma select object based on requested fields
      const selectFields: Record<string, boolean> = {};
      const includeProfile = fields?.includes("profile") ?? false;
      
      // If no fields specified, get all fields
      if (!fields || fields.length === 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
          status: user.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED",
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile: user.profile ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            address: user.profile.address,
            city: user.profile.city,
            state: user.profile.state,
            country: user.profile.country,
            postalCode: user.profile.postalCode,
          } : null,
        };
      }

      // Build select based on requested fields
      // Always include id since we need it for the response mapping
      selectFields.id = true;
      if (fields.includes("name")) selectFields.name = true;
      if (fields.includes("email")) selectFields.email = true;
      if (fields.includes("emailVerified")) selectFields.emailVerified = true;
      if (fields.includes("image")) selectFields.image = true;
      if (fields.includes("role")) selectFields.role = true;
      if (fields.includes("status")) selectFields.status = true;
      if (fields.includes("lastLoginAt")) selectFields.lastLoginAt = true;
      if (fields.includes("createdAt")) selectFields.createdAt = true;
      if (fields.includes("updatedAt")) selectFields.updatedAt = true;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          ...selectFields,
          ...(includeProfile && {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
              },
            },
          }),
        },
      }) as any; // Type assertion needed due to dynamic select

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Build response object based on requested fields
      const response: Record<string, any> = {};
      
      // Always include id in response (we always fetch it)
      if (fields.includes("id")) response.id = user.id;
      if (fields.includes("name")) response.name = user.name;
      if (fields.includes("email")) response.email = user.email;
      if (fields.includes("emailVerified")) response.emailVerified = user.emailVerified;
      if (fields.includes("image")) response.image = user.image;
      if (fields.includes("role")) response.role = user.role as "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
      if (fields.includes("status")) response.status = user.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
      if (fields.includes("lastLoginAt")) response.lastLoginAt = user.lastLoginAt;
      if (fields.includes("createdAt")) response.createdAt = user.createdAt;
      if (fields.includes("updatedAt")) response.updatedAt = user.updatedAt;
      if (fields.includes("profile")) {
        response.profile = user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          address: user.profile.address,
          city: user.profile.city,
          state: user.profile.state,
          country: user.profile.country,
          postalCode: user.profile.postalCode,
        } : null;
      }

      return response;
    }),
});

