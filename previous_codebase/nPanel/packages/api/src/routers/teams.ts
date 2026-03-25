import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@npanel/db";
import * as crypto from "crypto";
import { renderTeamInviteEmail } from "../lib/email-templates";
import { sendEmail } from "react-email-starter/src/email";

// Zod schemas for API - independent from database schema
const createTeamInputSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  baseCurrency: z.string().length(3, "Currency must be a 3-letter code"),
  inviteEmails: z.array(z.string().email()).optional().default([]),
});

const createTeamOutputSchema = z.object({
  success: z.boolean(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    baseCurrency: z.string(),
  }),
});

const teamMembershipSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  baseCurrency: z.string(),
  logoUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
  memberCount: z.number(),
});

const slugCheckInputSchema = z.object({
  slug: z.string().min(1),
});

const slugCheckOutputSchema = z.object({
  available: z.boolean(),
});

const getInviteInputSchema = z.object({
  code: z.string().uuid("Invalid invite code"),
});

const getInviteOutputSchema = z.object({
  valid: z.boolean(),
  invite: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
    status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
    expiresAt: z.date(),
    team: z.object({
      id: z.string(),
      name: z.string(),
      logoUrl: z.string().nullable(),
    }),
  }).optional(),
  error: z.string().optional(),
});

const acceptInviteInputSchema = z.object({
  code: z.string().uuid("Invalid invite code"),
});

const acceptInviteOutputSchema = z.object({
  success: z.boolean(),
  teamId: z.string().optional(),
  teamSlug: z.string().optional(),
  error: z.string().optional(),
});

export const teamsRouter = router({
  /**
   * Create a new team
   * Also creates the first team member with OWNER role
   */
  create: publicProcedure
    .input(createTeamInputSchema)
    .output(createTeamOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in to create a team");
      }

      const userId = session.user.id;
      
      // Generate unique slug from team name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      // Check if slug already exists and make it unique
      let slug = baseSlug;
      let counter = 1;
      
      while (await prisma.team.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Get user's name for email personalization
      const inviter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      const inviterName = inviter?.name || inviter?.email || "A team member";

      // Create team with transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Create the team
        const newTeam = await tx.team.create({
          data: {
            id: crypto.randomUUID(),
            name: input.name,
            slug,
            baseCurrency: input.baseCurrency,
            isActive: true,
            createdById: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Add creator as team owner
        await tx.teamMember.create({
          data: {
            id: crypto.randomUUID(),
            teamId: newTeam.id,
            userId: userId,
            role: "OWNER",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update user's lastAccessedTeamId
        await tx.user.update({
          where: { id: userId },
          data: { lastAccessedTeamId: newTeam.id },
        });

        // Log team creation activity
        await tx.userActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: userId,
            action: "TEAM_CREATED",
            description: `Created team: ${newTeam.name}`,
            metadata: {
              teamId: newTeam.id,
              teamName: newTeam.name,
              teamSlug: newTeam.slug,
              inviteCount: input.inviteEmails?.length || 0,
            },
            createdAt: new Date(),
          },
        });

        // Create team invites if emails provided
        const createdInvites: Array<{ email: string; code: string }> = [];
        
        if (input.inviteEmails && input.inviteEmails.length > 0) {
          const invitePromises = input.inviteEmails.map(async (email) => {
            const inviteCode = crypto.randomUUID();
            
            await tx.teamInvite.create({
              data: {
                id: crypto.randomUUID(),
                code: inviteCode,
                teamId: newTeam.id,
                email: email,
                role: "MEMBER", // Default role for invited members
                status: "PENDING",
                invitedById: userId, // Who sent the invite
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            createdInvites.push({ email, code: inviteCode });
          });

          await Promise.all(invitePromises);
        }

        return { team: newTeam, invites: createdInvites };
      });

      const { team, invites } = result;

      // Send invite emails after successful team creation
      // Email sending is done outside transaction to prevent rollback on email failures
      if (invites.length > 0) {
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
        
        // Prepare all email data first
        const emailsToSend = await Promise.all(
          invites.map(async (invite) => {
            const acceptInviteUrl = `${frontendUrl}/accept-invite?code=${invite.code}`;
            
            const html = await renderTeamInviteEmail({
              invitedUserEmail: invite.email,
              inviterName: inviterName,
              teamName: team.name,
              teamRole: "Member",
              acceptInviteLink: acceptInviteUrl,
              expiresInDays: 7,
            });

            return {
              to: invite.email,
              subject: `You've been invited to join ${team.name} on nPanel`,
              html,
              inviteCode: invite.code,
            };
          })
        );

        // Send emails sequentially with rate limiting
        const { sendEmailBatch } = await import("react-email-starter/src/email");
        const results = await sendEmailBatch(emailsToSend);

        // Batch all activity logs in a single transaction to reduce connection usage
        const activityLogs = results
          .map((result) => {
            const invite = invites.find((inv) => inv.email === result.email);
            if (!invite) return null;

            if (result.success) {
              return {
                id: crypto.randomUUID(),
                userId: userId,
                action: "TEAM_INVITE_SENT",
                description: `Sent team invite to ${result.email}`,
                metadata: {
                  teamId: team.id,
                  teamName: team.name,
                  invitedEmail: result.email,
                  inviteCode: invite.code.substring(0, 8) + "...", // Partial code for security
                },
                createdAt: new Date(),
              };
            } else {
              // Log email failure but don't throw (team already created)
              console.error(`Failed to send invite email to ${result.email}: ${result.error}`);
              return {
                id: crypto.randomUUID(),
                userId: userId,
                action: "TEAM_INVITE_EMAIL_FAILED",
                description: `Failed to send invite email to ${result.email}`,
                metadata: {
                  teamId: team.id,
                  invitedEmail: result.email,
                  error: result.error || "Unknown error",
                },
                createdAt: new Date(),
              };
            }
          })
          .filter((log): log is NonNullable<typeof log> => log !== null);

        // Batch create all activity logs in a single transaction
        if (activityLogs.length > 0) {
          await prisma.$transaction(
            activityLogs.map((log) =>
              prisma.userActivityLog.create({ data: log })
            )
          ).catch((error) => {
            console.error("Failed to batch log invite email activities:", error);
          });
        }
      }

      return {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          baseCurrency: team.baseCurrency,
        },
      };
    }),

  /**
   * Get invite details by code
   * Public endpoint - no authentication required for viewing invite
   */
  getInviteByCode: publicProcedure
    .input(getInviteInputSchema)
    .output(getInviteOutputSchema)
    .query(async ({ input }) => {
      const invite = await prisma.teamInvite.findUnique({
        where: { code: input.code },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              isActive: true,
            },
          },
        },
      });

      if (!invite) {
        return {
          valid: false,
          error: "Invite not found",
        };
      }

      // Check if team is active
      if (!invite.team.isActive) {
        return {
          valid: false,
          error: "This team is no longer active",
        };
      }

      // Check if invite has expired
      if (invite.expiresAt < new Date()) {
        return {
          valid: false,
          error: "This invitation has expired",
        };
      }

      // Check if invite is already accepted
      if (invite.status === "ACCEPTED") {
        return {
          valid: false,
          error: "This invitation has already been accepted",
        };
      }

      // Check if invite is cancelled
      if (invite.status === "CANCELLED") {
        return {
          valid: false,
          error: "This invitation has been cancelled",
        };
      }

      // Check if invite is declined
      if (invite.status === "DECLINED") {
        return {
          valid: false,
          error: "You have declined this invitation",
        };
      }

      return {
        valid: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          team: {
            id: invite.team.id,
            name: invite.team.name,
            logoUrl: invite.team.logoUrl,
          },
        },
      };
    }),

  /**
   * Accept a team invitation
   * Requires authentication
   */
  acceptInvite: publicProcedure
    .input(acceptInviteInputSchema)
    .output(acceptInviteOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;

      if (!session?.user?.id) {
        return {
          success: false,
          error: "You must be logged in to accept this invitation",
        };
      }

      const userId = session.user.id;
      const userEmail = (session.user as { email?: string }).email;

      // Get the invite
      const invite = await prisma.teamInvite.findUnique({
        where: { code: input.code },
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
      });

      if (!invite) {
        return {
          success: false,
          error: "Invite not found",
        };
      }

      // Validate invite email matches user email
      if (invite.email !== userEmail) {
        return {
          success: false,
          error: "This invitation was sent to a different email address",
        };
      }

      // Check if team is active
      if (!invite.team.isActive) {
        return {
          success: false,
          error: "This team is no longer active",
        };
      }

      // Check if invite has expired
      if (invite.expiresAt < new Date()) {
        return {
          success: false,
          error: "This invitation has expired",
        };
      }

      // Check if invite is already accepted
      if (invite.status === "ACCEPTED") {
        return {
          success: false,
          error: "You have already accepted this invitation",
        };
      }

      // Accept the invitation with transaction (includes membership check)
      // This batches all related operations and reduces connection usage
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Check if user is already a member (inside transaction)
          const existingMembership = await tx.teamMember.findFirst({
            where: {
              teamId: invite.team.id,
              userId: userId,
            },
          });

          if (existingMembership) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You are already a member of this team",
            });
          }
          // Add user as team member
          await tx.teamMember.create({
            data: {
              id: crypto.randomUUID(),
              teamId: invite.team.id,
              userId: userId,
              role: invite.role,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Update invite status to ACCEPTED
          await tx.teamInvite.update({
            where: { id: invite.id },
            data: { 
              status: "ACCEPTED",
              updatedAt: new Date(),
            },
          });

          // Always update user's lastAccessedTeamId to the team they just joined
          // This ensures they're redirected to the newly joined team
          await tx.user.update({
            where: { id: userId },
            data: { lastAccessedTeamId: invite.team.id },
          });

          // Log the team join activity
          await tx.userActivityLog.create({
            data: {
              id: crypto.randomUUID(),
              userId: userId,
              action: "TEAM_JOINED",
              description: `Joined team: ${invite.team.name}`,
              metadata: {
                teamId: invite.team.id,
                teamName: invite.team.name,
                role: invite.role,
                inviteCode: invite.code.substring(0, 8) + "...",
              },
              createdAt: new Date(),
            },
          });

          return {
            teamId: invite.team.id,
            teamSlug: invite.team.slug,
          };
        });

        return {
          success: true,
          teamId: result.teamId,
          teamSlug: result.teamSlug,
        };
      } catch (error) {
        // Handle TRPCError from transaction
        if (error instanceof TRPCError) {
          return {
            success: false,
            error: error.message,
          };
        }
        // Re-throw other errors
        throw error;
      }
    }),

  /**
   * Get all teams for the current user
   */
  getUserTeams: publicProcedure
    .output(z.array(teamMembershipSchema))
    .query(async ({ ctx }) => {
    const session = ctx.session;
    
    if (!session?.user?.id) {
      throw new Error("Unauthorized: You must be logged in");
    }

    const userId = session.user.id;

    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseCurrency: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return teamMemberships.map((membership) => ({
      ...membership.team,
      role: membership.role,
      memberCount: membership.team._count.members,
    }));
  }),

  /**
   * Check if a team slug is available
   */
  checkSlugAvailable: publicProcedure
    .input(slugCheckInputSchema)
    .output(slugCheckOutputSchema)
    .query(async ({ input }) => {
      const team = await prisma.team.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

      return {
        available: !team,
      };
    }),

  /**
   * Update user's last accessed team
   */
  updateLastAccessedTeam: publicProcedure
    .input(z.object({
      teamId: z.string(),
    }))
    .output(z.object({
      success: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;
      
      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      // Batch: Verify membership and update lastAccessedTeamId in a single transaction
      // This reduces connection usage from 2 sequential queries to 1 transaction
      await prisma.$transaction(async (tx) => {
        // Verify user is a member of this team
        const membership = await tx.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId,
            },
          },
        });

        if (!membership) {
          throw new Error("You are not a member of this team");
        }

        // Update lastAccessedTeamId
        await tx.user.update({
          where: { id: userId },
          data: {
            lastAccessedTeamId: input.teamId,
          },
        });
      });

      return {
        success: true,
      };
    }),

  // ============================================================================
  // ADMIN TEAM MANAGEMENT (for agency/admin use)
  // ============================================================================

  /**
   * Get all teams (for admin/agency management)
   */
  getAll: protectedProcedure
    .output(z.array(z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      baseCurrency: z.string(),
      logoUrl: z.string().nullable(),
      isActive: z.boolean(),
      createdById: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      memberCount: z.number(),
    })))
    .query(async ({ ctx }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view teams",
        });
      }

      // Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN
      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view all teams",
        });
      }

      const teams = await prisma.team.findMany({
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return teams.map((team) => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        baseCurrency: team.baseCurrency,
        logoUrl: team.logoUrl,
        isActive: team.isActive,
        createdById: team.createdById,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team._count.members,
      }));
    }),

  /**
   * Get team ID by slug
   */
  getTeamIdBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .output(z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Batch: Fetch team and check membership in parallel to reduce connection usage
      const [team, membership] = await Promise.all([
        prisma.team.findUnique({
          where: { slug: input.slug },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
        // We need team.id for membership check, so we'll check after team is found
        null as any,
      ]);

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Verify user has access to this team (parallel query now that we have team.id)
      const membershipResult = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: session.user.id,
          },
        },
      });

      if (!membershipResult) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      return team;
    }),

  /**
   * Get team members (for current user when they are a member of the team).
   * Returns members with user name and email for display in company settings.
   */
  getMembersAsMember: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      userId: z.string(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
      createdAt: z.date(),
      updatedAt: z.date(),
      userName: z.string().nullable(),
      userEmail: z.string().nullable(),
    })))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      const members = await prisma.teamMember.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        userName: m.user.name ?? null,
        userEmail: m.user.email ?? null,
      }));
    }),

  /**
   * Get team invites (for current user when they are a member of the team).
   */
  getInvitesAsMember: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      email: z.string(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
      status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
      invitedById: z.string(),
      expiresAt: z.date(),
      acceptedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      const invites = await prisma.teamInvite.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
      });

      return invites;
    }),

  /**
   * Get team by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      baseCurrency: z.string(),
      logoUrl: z.string().nullable(),
      isActive: z.boolean(),
      createdById: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const team = await prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      return team;
    }),

  /**
   * Get team members (returns userIds only)
   */
  getMembers: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      userId: z.string(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
      createdAt: z.date(),
      updatedAt: z.date(),
    })))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const members = await prisma.teamMember.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
      });

      return members;
    }),

  /**
   * Get team invites
   */
  getInvites: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      email: z.string(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
      status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
      invitedById: z.string(),
      expiresAt: z.date(),
      acceptedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const invites = await prisma.teamInvite.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
      });

      return invites;
    }),

  /**
   * Get team hosting subscriptions
   */
  getHostingSubscriptions: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      hostingPlanId: z.string(),
      primaryDomain: z.string().nullable(),
      billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
      nextRenewalDate: z.date().nullable(),
      expiryDate: z.date().nullable(),
      autoRenew: z.boolean(),
      hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]),
      createdAt: z.date(),
      updatedAt: z.date(),
    })))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const subscriptions = await prisma.hostingSubscription.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
      });

      return subscriptions;
    }),

  /**
   * Update team (slug not editable)
   */
  update: protectedProcedure
    .input(z.object({
      teamId: z.string(),
      name: z.string().min(2).optional(),
      baseCurrency: z.string().length(3).optional(),
      logoUrl: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }).refine(
      (data) => data.name !== undefined || data.baseCurrency !== undefined || data.logoUrl !== undefined || data.isActive !== undefined,
      { message: "At least one field must be provided for update" }
    ))
    .output(z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      baseCurrency: z.string(),
      logoUrl: z.string().nullable(),
      isActive: z.boolean(),
      createdById: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const existingTeam = await prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!existingTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.baseCurrency !== undefined) updateData.baseCurrency = input.baseCurrency;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      // Batch: Update team and log activity in a transaction
      const changedFields = Object.keys(updateData).filter(key => key !== "updatedAt");
      const updatedTeam = await prisma.$transaction(async (tx) => {
        const updated = await tx.team.update({
          where: { id: input.teamId },
          data: updateData,
        });

        // Log activity
        await tx.userActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user!.id,
            action: "TEAM_UPDATED_BY_ADMIN",
            description: `Team updated by admin: ${session.user!.email}`,
            metadata: {
              teamId: updated.id,
              teamName: updated.name,
              updatedBy: session.user!.id,
              updatedByEmail: session.user!.email,
              changedFields,
              previousValues: {
                name: existingTeam.name,
                baseCurrency: existingTeam.baseCurrency,
                logoUrl: existingTeam.logoUrl,
                isActive: existingTeam.isActive,
              },
              newValues: {
                name: updated.name,
                baseCurrency: updated.baseCurrency,
                logoUrl: updated.logoUrl,
                isActive: updated.isActive,
              },
            },
            createdAt: new Date(),
          },
        });

        return updated;
      });

      return updatedTeam;
    }),

  /**
   * Delete team
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const team = await prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Batch: Delete team and log activity in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete team (cascade will handle related records)
        await tx.team.delete({
          where: { id: input.teamId },
        });

        // Log activity
        await tx.userActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user!.id,
            action: "TEAM_DELETED_BY_ADMIN",
            description: `Team deleted by admin: ${session.user!.email}`,
            metadata: {
              teamId: team.id,
              teamName: team.name,
              deletedBy: session.user!.id,
              deletedByEmail: session.user!.email,
            },
            createdAt: new Date(),
          },
        });
      });

      return { success: true };
    }),

  /**
   * Invite member to team
   */
  inviteMember: protectedProcedure
    .input(z.object({
      teamId: z.string(),
      email: z.string().email(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
    }))
    .output(z.object({
      success: z.boolean(),
      inviteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      const isAgency = userRole === "AGENCY_ADMIN" || userRole === "AGENCY_SUPER_ADMIN";

      const team = await prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (!isAgency) {
        const membership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: session.user.id,
            },
          },
        });
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to invite members to this team",
          });
        }
      }

      // Batch: Check user membership and pending invites in parallel
      const [existingMember, existingInvite] = await Promise.all([
        prisma.user.findUnique({
          where: { email: input.email },
          include: {
            teamMemberships: {
              where: { teamId: input.teamId },
            },
          },
        }),
        prisma.teamInvite.findFirst({
          where: {
            teamId: input.teamId,
            email: input.email,
            status: "PENDING",
          },
        }),
      ]);

      if (existingMember && existingMember.teamMemberships.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this team",
        });
      }

      if (existingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invite is already pending for this email",
        });
      }

      const inviteCode = crypto.randomUUID();
      const inviteId = crypto.randomUUID();

      // Batch: Create invite and get inviter info in parallel
      const [invite, inviter] = await Promise.all([
        prisma.teamInvite.create({
          data: {
            id: inviteId,
            code: inviteCode,
            teamId: input.teamId,
            email: input.email,
            role: input.role,
            status: "PENDING",
            invitedById: session.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true },
        }),
      ]);

      const inviterName = inviter?.name || inviter?.email || "A team member";

      // Send invite email
      try {
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
        const acceptInviteUrl = `${frontendUrl}/accept-invite?code=${inviteCode}`;

        const html = await renderTeamInviteEmail({
          invitedUserEmail: input.email,
          inviterName,
          teamName: team.name,
          teamRole: input.role,
          acceptInviteLink: acceptInviteUrl,
          expiresInDays: 7,
        });

        await sendEmail({
          to: input.email,
          subject: `You've been invited to join ${team.name} on Nisc Cloud`,
          html,
        });
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
      }

      // Log activity (non-blocking, done after invite creation)
      prisma.userActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          action: "TEAM_MEMBER_INVITED_BY_ADMIN",
          description: `Team member invited by admin: ${session.user.email}`,
          metadata: {
            teamId: team.id,
            teamName: team.name,
            invitedEmail: input.email,
            role: input.role,
            inviteId: invite.id,
            invitedBy: session.user.id,
            invitedByEmail: session.user.email,
          },
          createdAt: new Date(),
        },
      }).catch((error) => {
        console.error("Failed to log team member invite activity:", error);
      });

      return {
        success: true,
        inviteId: invite.id,
      };
    }),

  /**
   * Remove member from team
   */
  removeMember: protectedProcedure
    .input(z.object({
      teamId: z.string(),
      memberId: z.string(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const member = await prisma.teamMember.findUnique({
        where: { id: input.memberId },
        include: {
          team: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team member not found",
        });
      }

      if (member.teamId !== input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Member does not belong to this team",
        });
      }

      // Batch: Delete member and log activity in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the team member
        await tx.teamMember.delete({
          where: { id: input.memberId },
        });

        // Log activity
        await tx.userActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user!.id,
            action: "TEAM_MEMBER_REMOVED_BY_ADMIN",
            description: `Team member removed by admin: ${session.user!.email}`,
            metadata: {
              teamId: member.team.id,
              teamName: member.team.name,
              removedMemberId: member.userId,
              removedMemberName: member.user.name,
              removedMemberEmail: member.user.email,
              removedBy: session.user!.id,
              removedByEmail: session.user!.email,
            },
            createdAt: new Date(),
          },
        });
      });

      return { success: true };
    }),

  /**
   * Delete invite
   */
  deleteInvite: protectedProcedure
    .input(z.object({
      inviteId: z.string(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const invite = await prisma.teamInvite.findUnique({
        where: { id: input.inviteId },
        include: {
          team: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      // Batch: Delete invite and log activity in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the invite
        await tx.teamInvite.delete({
          where: { id: input.inviteId },
        });

        // Log activity
        await tx.userActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user!.id,
            action: "TEAM_INVITE_DELETED_BY_ADMIN",
            description: `Team invite deleted by admin: ${session.user!.email}`,
            metadata: {
              teamId: invite.team.id,
              teamName: invite.team.name,
              deletedInviteId: invite.id,
              deletedInviteEmail: invite.email,
              deletedBy: session.user!.id,
              deletedByEmail: session.user!.email,
            },
            createdAt: new Date(),
          },
        });
      });

      return { success: true };
    }),
});
