import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import prisma from "@nPanel/db";
import { renderTeamInviteEmail } from "react-email-starter/src/email-templates";

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

        // Log results for each email
        for (const result of results) {
          const invite = invites.find((inv) => inv.email === result.email);
          if (!invite) continue;

          if (result.success) {
            // Log successful invite email
            await prisma.userActivityLog.create({
              data: {
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
              },
            }).catch((error) => {
              console.error("Failed to log successful email:", error);
            });
          } else {
            // Log email failure but don't throw (team already created)
            console.error(`Failed to send invite email to ${result.email}: ${result.error}`);
            
            await prisma.userActivityLog.create({
              data: {
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
              },
            }).catch(() => {
              // Swallow logging errors
            });
          }
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

      // Check if user is already a member
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          teamId: invite.team.id,
          userId: userId,
        },
      });

      if (existingMembership) {
        return {
          success: false,
          error: "You are already a member of this team",
        };
      }

      // Accept the invitation with transaction
      const result = await prisma.$transaction(async (tx) => {
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

      // Verify user is a member of this team
      const membership = await prisma.teamMember.findUnique({
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
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastAccessedTeamId: input.teamId,
        },
      });

      return {
        success: true,
      };
    }),
});
