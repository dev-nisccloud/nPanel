import * as crypto from "node:crypto";
import { z } from "zod";
import { and, count, desc, eq, inArray } from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import { hostingSubscription } from "@npanel/db/schema/hosting";
import { team, teamInvite, teamMember } from "@npanel/db/schema/teams";
import { renderTeamInviteEmail } from "../lib/email-templates";
import { getSesClient, sendSesRawEmail } from "../lib/ses-client";

const isAgencyRole = (role: string | null | undefined) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
const isAgencySuperAdmin = (role: string | null | undefined) => role === "AGENCY_SUPER_ADMIN";

async function assertTeamMutationAccess(teamId: string, actorUserId: string, actorRole: string | null | undefined) {
  if (isAgencySuperAdmin(actorRole)) return;
  const [teamRow] = await db
    .select({ createdById: team.createdById })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  if (!teamRow || teamRow.createdById !== actorUserId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to modify this team",
    });
  }
}

/**
 * Sends a transactional HTML email via AWS SES using the same sender/config
 * pattern as the agency invoicing flow (NISC_TX_* env vars + configuration set).
 * Returns { success } rather than throwing, so batch callers can decide per-recipient.
 */
async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const fromDomainRaw = process.env.NISC_TX_EMAIL_DOMAIN?.trim();
    const fromDomain =
      fromDomainRaw && !fromDomainRaw.includes("@") ? fromDomainRaw : undefined;
    const fromEmail = (process.env.NISC_TX_FROM_EMAIL?.trim() ||
      (fromDomain ? `noreply@${fromDomain}` : "noreply@npanel.com")) as string;
    const fromName = process.env.NISC_TX_FROM_NAME?.trim() || "nPanel";
    const replyTo = process.env.NISC_TX_REPLY_TO?.trim() || undefined;

    const stripHeaderUnsafe = (value: string) =>
      value.replace(/[\r\n]+/g, " ").trim();
    const toRfc2047Utf8 = (value: string): string => {
      if (/^[\x00-\x7F]*$/.test(value)) return value;
      const buf = Buffer.from(value, "utf8");
      return `=?UTF-8?B?${buf.toString("base64")}?=`;
    };
    const parseDisplayEmail = (
      value: string,
    ): { name: string | null; email: string } => {
      const v = stripHeaderUnsafe(value);
      const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
      if (m) return { name: m[1]?.trim() || null, email: m[2]!.trim() };
      return { name: null, email: v };
    };
    const buildFromHeader = (n: string | null, e: string) => {
      const parsed = parseDisplayEmail(e);
      const name = stripHeaderUnsafe(n ?? parsed.name ?? "");
      const email = stripHeaderUnsafe(parsed.email);
      return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
    };

    const boundary = `npanel-alt-${crypto.randomUUID()}`;
    const lines: string[] = [];
    lines.push(`From: ${buildFromHeader(fromName, fromEmail)}`);
    lines.push(`To: ${stripHeaderUnsafe(params.to)}`);
    lines.push(
      `Subject: ${toRfc2047Utf8(stripHeaderUnsafe(params.subject))}`,
    );
    if (replyTo) lines.push(`Reply-To: ${stripHeaderUnsafe(replyTo)}`);
    lines.push("MIME-Version: 1.0");
    lines.push(
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    );
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(params.html);
    lines.push("");
    lines.push(`--${boundary}--`);
    lines.push("");
    const raw = Buffer.from(lines.join("\r\n"), "utf8");

    const ses = getSesClient();
    await sendSesRawEmail(ses, {
      RawMessage: { Data: raw },
      Destinations: [params.to],
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

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
  invite: z
    .object({
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
    })
    .optional(),
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
  create: protectedProcedure
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

      while (true) {
        const [existing] = await db.select({ id: team.id }).from(team).where(eq(team.slug, slug)).limit(1);
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Get user's name for email personalization
      const [inviter] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      const inviterName = inviter?.name || inviter?.email || "A team member";

      // Create team with transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        const now = new Date();
        const [newTeam] = await tx
          .insert(team)
          .values({
            id: crypto.randomUUID(),
            name: input.name,
            slug,
            baseCurrency: input.baseCurrency,
            isActive: true,
            createdById: userId,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!newTeam) {
          throw new Error("Failed to create team");
        }

        await tx.insert(teamMember).values({
          id: crypto.randomUUID(),
          teamId: newTeam.id,
          userId,
          role: "OWNER",
          createdAt: now,
          updatedAt: now,
        });

        await tx
          .update(user)
          .set({ lastAccessedTeamId: newTeam.id, updatedAt: new Date() })
          .where(eq(user.id, userId));

        await tx.insert(userActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          action: "TEAM_CREATED",
          description: `Created team: ${newTeam.name}`,
          metadata: {
            teamId: newTeam.id,
            teamName: newTeam.name,
            teamSlug: newTeam.slug,
            inviteCount: input.inviteEmails?.length || 0,
          },
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });

        const createdInvites: Array<{ email: string; code: string }> = [];

        if (input.inviteEmails && input.inviteEmails.length > 0) {
          const invitePromises = input.inviteEmails.map(async (email) => {
            const inviteCode = crypto.randomUUID();

            await tx.insert(teamInvite).values({
              id: crypto.randomUUID(),
              code: inviteCode,
              teamId: newTeam.id,
              email,
              role: "MEMBER",
              status: "PENDING",
              invitedById: userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            });

            createdInvites.push({ email, code: inviteCode });
          });

          await Promise.all(invitePromises);
        }

        return { team: newTeam, invites: createdInvites };
      });

      const { team: createdTeam, invites } = result;

      // Send invite emails after successful team creation (via SES, matching
      // the transactional email pattern used by agency invoicing).
      if (invites.length > 0) {
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";

        const emailsToSend = await Promise.all(
          invites.map(async (invite) => {
            const acceptInviteUrl = `${frontendUrl}/accept-invite?code=${invite.code}`;

            const html = await renderTeamInviteEmail({
              invitedUserEmail: invite.email,
              inviterName,
              teamName: createdTeam.name,
              teamRole: "Member",
              acceptInviteLink: acceptInviteUrl,
              expiresInDays: 7,
            });

            return {
              to: invite.email,
              subject: `You've been invited to join ${createdTeam.name} on Nisc Cloud`,
              html,
              inviteCode: invite.code,
            };
          }),
        );

        const results = await Promise.all(
          emailsToSend.map(async (e) => {
            const r = await sendTransactionalEmail({
              to: e.to,
              subject: e.subject,
              html: e.html,
            });
            return {
              email: e.to,
              success: r.success,
              error: r.success ? undefined : r.error,
            };
          }),
        );

        const activityLogs = results
          .map((result) => {
            const invite = invites.find((inv) => inv.email === result.email);
            if (!invite) return null;

            if (result.success) {
              return {
                id: crypto.randomUUID(),
                userId,
                action: "TEAM_INVITE_SENT",
                description: `Sent team invite to ${result.email}`,
                metadata: {
                  teamId: createdTeam.id,
                  teamName: createdTeam.name,
                  invitedEmail: result.email,
                  inviteCode: invite.code.substring(0, 8) + "...",
                },
                createdAt: new Date(),
              };
            }
            console.error(`Failed to send invite email to ${result.email}: ${result.error}`);
            return {
              id: crypto.randomUUID(),
              userId,
              action: "TEAM_INVITE_EMAIL_FAILED",
              description: `Failed to send invite email to ${result.email}`,
              metadata: {
                teamId: createdTeam.id,
                invitedEmail: result.email,
                error: result.error || "Unknown error",
              },
              createdAt: new Date(),
            };
          })
          .filter((log): log is NonNullable<typeof log> => log !== null);

        if (activityLogs.length > 0) {
          await db
            .transaction(async (tx) => {
              for (const log of activityLogs) {
                await tx.insert(userActivityLog).values({
                  id: log.id,
                  userId: log.userId,
                  action: log.action,
                  description: log.description,
                  metadata: log.metadata,
                  ipAddress: null,
                  userAgent: null,
                  createdAt: log.createdAt,
                });
              }
            })
            .catch((error) => {
              console.error("Failed to batch log invite email activities:", error);
            });
        }
      }

      return {
        success: true,
        team: {
          id: createdTeam.id,
          name: createdTeam.name,
          slug: createdTeam.slug,
          baseCurrency: createdTeam.baseCurrency,
        },
      };
    }),

  getInviteByCode: protectedProcedure
    .input(getInviteInputSchema)
    .output(getInviteOutputSchema)
    .query(async ({ input }) => {
      const invite = await db.query.teamInvite.findFirst({
        where: eq(teamInvite.code, input.code),
        with: {
          team: {
            columns: {
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

      if (!invite.team.isActive) {
        return {
          valid: false,
          error: "This team is no longer active",
        };
      }

      if (invite.expiresAt < new Date()) {
        return {
          valid: false,
          error: "This invitation has expired",
        };
      }

      if (invite.status === "ACCEPTED") {
        return {
          valid: false,
          error: "This invitation has already been accepted",
        };
      }

      if (invite.status === "CANCELLED") {
        return {
          valid: false,
          error: "This invitation has been cancelled",
        };
      }

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
          role: invite.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
          status: invite.status as "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED",
          expiresAt: invite.expiresAt,
          team: {
            id: invite.team.id,
            name: invite.team.name,
            logoUrl: invite.team.logoUrl,
          },
        },
      };
    }),

  acceptInvite: protectedProcedure
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

      const invite = await db.query.teamInvite.findFirst({
        where: eq(teamInvite.code, input.code),
        with: {
          team: {
            columns: {
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

      if (invite.email !== userEmail) {
        return {
          success: false,
          error: "This invitation was sent to a different email address",
        };
      }

      if (!invite.team.isActive) {
        return {
          success: false,
          error: "This team is no longer active",
        };
      }

      if (invite.expiresAt < new Date()) {
        return {
          success: false,
          error: "This invitation has expired",
        };
      }

      if (invite.status === "ACCEPTED") {
        return {
          success: false,
          error: "You have already accepted this invitation",
        };
      }

      try {
        const result = await db.transaction(async (tx) => {
          const [existingMembership] = await tx
            .select({ id: teamMember.id })
            .from(teamMember)
            .where(and(eq(teamMember.teamId, invite.team.id), eq(teamMember.userId, userId)))
            .limit(1);

          if (existingMembership) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You are already a member of this team",
            });
          }

          const now = new Date();
          await tx.insert(teamMember).values({
            id: crypto.randomUUID(),
            teamId: invite.team.id,
            userId,
            role: invite.role,
            createdAt: now,
            updatedAt: now,
          });

          await tx
            .update(teamInvite)
            .set({ status: "ACCEPTED", updatedAt: now })
            .where(eq(teamInvite.id, invite.id));

          await tx
            .update(user)
            .set({ lastAccessedTeamId: invite.team.id, updatedAt: new Date() })
            .where(eq(user.id, userId));

          await tx.insert(userActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            action: "TEAM_JOINED",
            description: `Joined team: ${invite.team.name}`,
            metadata: {
              teamId: invite.team.id,
              teamName: invite.team.name,
              role: invite.role,
              inviteCode: invite.code.substring(0, 8) + "...",
            },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
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
        if (error instanceof TRPCError) {
          return {
            success: false,
            error: error.message,
          };
        }
        throw error;
      }
    }),

  getUserTeams: protectedProcedure
    .output(z.array(teamMembershipSchema))
    .query(async ({ ctx }) => {
      const session = ctx.session;

      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      const teamMemberships = await db.query.teamMember.findMany({
        where: eq(teamMember.userId, userId),
        orderBy: [desc(teamMember.createdAt)],
        with: {
          team: true,
        },
      });

      const teamIds = [...new Set(teamMemberships.map((m) => m.team.id))];
      let countByTeam = new Map<string, number>();
      if (teamIds.length > 0) {
        const countRows = await db
          .select({ teamId: teamMember.teamId, n: count(teamMember.id) })
          .from(teamMember)
          .where(inArray(teamMember.teamId, teamIds))
          .groupBy(teamMember.teamId);
        countByTeam = new Map(countRows.map((r) => [r.teamId, Number(r.n)]));
      }

      return teamMemberships.map((membership) => ({
        ...membership.team,
        role: membership.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
        memberCount: countByTeam.get(membership.team.id) ?? 0,
      }));
    }),

  checkSlugAvailable: protectedProcedure
    .input(slugCheckInputSchema)
    .output(slugCheckOutputSchema)
    .query(async ({ input }) => {
      const [found] = await db.select({ id: team.id }).from(team).where(eq(team.slug, input.slug)).limit(1);

      return {
        available: !found,
      };
    }),

  updateLastAccessedTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session;

      if (!session?.user?.id) {
        throw new Error("Unauthorized: You must be logged in");
      }

      const userId = session.user.id;

      await db.transaction(async (tx) => {
        const [membership] = await tx
          .select({ id: teamMember.id })
          .from(teamMember)
          .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)))
          .limit(1);

        if (!membership) {
          throw new Error("You are not a member of this team");
        }

        await tx
          .update(user)
          .set({ lastAccessedTeamId: input.teamId, updatedAt: new Date() })
          .where(eq(user.id, userId));
      });

      return {
        success: true,
      };
    }),

  getAll: protectedProcedure
    .output(
      z.array(
        z.object({
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
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view teams",
        });
      }

      const userRole = session.user.role;
      if (!userRole?.includes("AGENCY")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view all teams",
        });
      }

      const teamsList = await db.select().from(team).orderBy(desc(team.createdAt));

      const countRows = await db
        .select({ teamId: teamMember.teamId, n: count(teamMember.id) })
        .from(teamMember)
        .groupBy(teamMember.teamId);
      const countByTeam = new Map(countRows.map((r) => [r.teamId, Number(r.n)]));

      return teamsList.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        baseCurrency: t.baseCurrency,
        logoUrl: t.logoUrl,
        isActive: t.isActive,
        createdById: t.createdById,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        memberCount: countByTeam.get(t.id) ?? 0,
      }));
    }),

  getTeamIdBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [teamRow] = await db
        .select({
          id: team.id,
          name: team.name,
          slug: team.slug,
        })
        .from(team)
        .where(eq(team.slug, input.slug))
        .limit(1);

      if (!teamRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const [membershipResult] = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(and(eq(teamMember.teamId, teamRow.id), eq(teamMember.userId, session.user.id)))
        .limit(1);

      if (!membershipResult) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      return teamRow;
    }),

  getMembersAsMember: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
          createdAt: z.date(),
          updatedAt: z.date(),
          userName: z.string().nullable(),
          userEmail: z.string().nullable(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [membership] = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, session.user.id)))
        .limit(1);

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      const members = await db.query.teamMember.findMany({
        where: eq(teamMember.teamId, input.teamId),
        orderBy: [desc(teamMember.createdAt)],
        with: {
          user: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        userName: m.user?.name ?? null,
        userEmail: m.user?.email ?? null,
      }));
    }),

  getInvitesAsMember: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          email: z.string(),
          role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
          status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
          invitedById: z.string(),
          expiresAt: z.date(),
          acceptedAt: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [membership] = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, session.user.id)))
        .limit(1);

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this team",
        });
      }

      const invites = await db
        .select()
        .from(teamInvite)
        .where(eq(teamInvite.teamId, input.teamId))
        .orderBy(desc(teamInvite.createdAt));

      return invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
        status: inv.status as "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED",
        invitedById: inv.invitedById,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        baseCurrency: z.string(),
        logoUrl: z.string().nullable(),
        isActive: z.boolean(),
        createdById: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const [teamRow] = await db.select().from(team).where(eq(team.id, input.teamId)).limit(1);

      if (!teamRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      return teamRow;
    }),

  getMembers: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const members = await db
        .select()
        .from(teamMember)
        .where(eq(teamMember.teamId, input.teamId))
        .orderBy(desc(teamMember.createdAt));

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
    }),

  getInvites: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          email: z.string(),
          role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
          status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
          invitedById: z.string(),
          expiresAt: z.date(),
          acceptedAt: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const invites = await db
        .select()
        .from(teamInvite)
        .where(eq(teamInvite.teamId, input.teamId))
        .orderBy(desc(teamInvite.createdAt));

      return invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
        status: inv.status as "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED",
        invitedById: inv.invitedById,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      }));
    }),

  getHostingSubscriptions: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          hostingPlanId: z.string(),
          primaryDomain: z.string().nullable(),
          billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
          nextRenewalDate: z.date().nullable(),
          expiryDate: z.date().nullable(),
          autoRenew: z.boolean(),
          hostingType: z.enum([
            "WEB_HOSTING",
            "EMAIL_HOSTING",
            "RESELLER_HOSTING",
            "VPS_HOSTING",
            "DEDICATED_HOSTING",
          ]),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const subscriptions = await db
        .select()
        .from(hostingSubscription)
        .where(eq(hostingSubscription.teamId, input.teamId))
        .orderBy(desc(hostingSubscription.createdAt));

      return subscriptions.map((s) => ({
        id: s.id,
        hostingPlanId: s.hostingPlanId,
        primaryDomain: s.primaryDomain,
        billingCycle: s.billingCycle as "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM",
        nextRenewalDate: s.nextRenewalDate,
        expiryDate: s.expiryDate,
        autoRenew: s.autoRenew,
        hostingType: s.hostingType as
          | "WEB_HOSTING"
          | "EMAIL_HOSTING"
          | "RESELLER_HOSTING"
          | "VPS_HOSTING"
          | "DEDICATED_HOSTING",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          teamId: z.string(),
          name: z.string().min(2).optional(),
          baseCurrency: z.string().length(3).optional(),
          logoUrl: z.string().nullable().optional(),
          isActive: z.boolean().optional(),
        })
        .refine(
          (data) =>
            data.name !== undefined ||
            data.baseCurrency !== undefined ||
            data.logoUrl !== undefined ||
            data.isActive !== undefined,
          { message: "At least one field must be provided for update" },
        ),
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        baseCurrency: z.string(),
        logoUrl: z.string().nullable(),
        isActive: z.boolean(),
        createdById: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }
      await assertTeamMutationAccess(input.teamId, session.user.id, userRole);

      const [existingTeam] = await db.select().from(team).where(eq(team.id, input.teamId)).limit(1);

      if (!existingTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const now = new Date();
      const updatePayload: Partial<typeof team.$inferInsert> = {
        updatedAt: now,
      };

      if (input.name !== undefined) updatePayload.name = input.name;
      if (input.baseCurrency !== undefined) updatePayload.baseCurrency = input.baseCurrency;
      if (input.logoUrl !== undefined) updatePayload.logoUrl = input.logoUrl;
      if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

      const changedFields = Object.keys(updatePayload).filter((key) => key !== "updatedAt");

      const updatedTeam = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(team)
          .set(updatePayload)
          .where(eq(team.id, input.teamId))
          .returning();

        if (!updated) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update team" });
        }

        await tx.insert(userActivityLog).values({
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
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });

        return updated;
      });

      return updatedTeam;
    }),

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
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }
      await assertTeamMutationAccess(input.teamId, session.user.id, userRole);

      const [teamRow] = await db.select().from(team).where(eq(team.id, input.teamId)).limit(1);

      if (!teamRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.delete(team).where(eq(team.id, input.teamId));

        await tx.insert(userActivityLog).values({
          id: crypto.randomUUID(),
          userId: session.user!.id,
          action: "TEAM_DELETED_BY_ADMIN",
          description: `Team deleted by admin: ${session.user!.email}`,
          metadata: {
            teamId: teamRow.id,
            teamName: teamRow.name,
            deletedBy: session.user!.id,
            deletedByEmail: session.user!.email,
          },
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });
      });

      return { success: true };
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string().email(),
        role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        inviteId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRole = session.user.role;
      const isAgency = isAgencyRole(userRole);

      const [teamRow] = await db.select().from(team).where(eq(team.id, input.teamId)).limit(1);

      if (!teamRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (isAgency) {
        await assertTeamMutationAccess(input.teamId, session.user.id, userRole);
      } else {
        const [membership] = await db
          .select({ role: teamMember.role })
          .from(teamMember)
          .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, session.user.id)))
          .limit(1);
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to invite members to this team",
          });
        }
      }

      const [userByEmail] = await db.select().from(user).where(eq(user.email, input.email)).limit(1);

      if (userByEmail) {
        const [existingTm] = await db
          .select({ id: teamMember.id })
          .from(teamMember)
          .where(and(eq(teamMember.userId, userByEmail.id), eq(teamMember.teamId, input.teamId)))
          .limit(1);
        if (existingTm) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already a member of this team",
          });
        }
      }

      const [existingInvite] = await db
        .select({ id: teamInvite.id })
        .from(teamInvite)
        .where(
          and(
            eq(teamInvite.teamId, input.teamId),
            eq(teamInvite.email, input.email),
            eq(teamInvite.status, "PENDING"),
          ),
        )
        .limit(1);

      if (existingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invite is already pending for this email",
        });
      }

      const inviteCode = crypto.randomUUID();
      const inviteId = crypto.randomUUID();
      const now = new Date();

      const [invite] = await db
        .insert(teamInvite)
        .values({
          id: inviteId,
          code: inviteCode,
          teamId: input.teamId,
          email: input.email,
          role: input.role,
          status: "PENDING",
          invitedById: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!invite) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create invite" });
      }

      const [inviter] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const inviterName = inviter?.name || inviter?.email || "A team member";

      try {
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
        const acceptInviteUrl = `${frontendUrl}/accept-invite?code=${inviteCode}`;

        const html = await renderTeamInviteEmail({
          invitedUserEmail: input.email,
          inviterName,
          teamName: teamRow.name,
          teamRole: input.role,
          acceptInviteLink: acceptInviteUrl,
          expiresInDays: 7,
        });

        const result = await sendTransactionalEmail({
          to: input.email,
          subject: `You've been invited to join ${teamRow.name} on Nisc Cloud`,
          html,
        });

        if (!result.success) {
          console.error("Failed to send invite email:", result.error);
        }
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
      }

      void db
        .insert(userActivityLog)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          action: "TEAM_MEMBER_INVITED_BY_ADMIN",
          description: `Team member invited by admin: ${session.user.email}`,
          metadata: {
            teamId: teamRow.id,
            teamName: teamRow.name,
            invitedEmail: input.email,
            role: input.role,
            inviteId: invite.id,
            invitedBy: session.user.id,
            invitedByEmail: session.user.email,
          },
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        })
        .catch((error) => {
          console.error("Failed to log team member invite activity:", error);
        });

      return {
        success: true,
        inviteId: invite.id,
      };
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        memberId: z.string(),
      }),
    )
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
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }
      await assertTeamMutationAccess(input.teamId, session.user.id, userRole);

      const member = await db.query.teamMember.findFirst({
        where: eq(teamMember.id, input.memberId),
        with: {
          team: true,
          user: {
            columns: {
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

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.delete(teamMember).where(eq(teamMember.id, input.memberId));

        await tx.insert(userActivityLog).values({
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
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });
      });

      return { success: true };
    }),

  deleteInvite: protectedProcedure
    .input(
      z.object({
        inviteId: z.string(),
      }),
    )
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
      if (!isAgencyRole(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission",
        });
      }

      const invite = await db.query.teamInvite.findFirst({
        where: eq(teamInvite.id, input.inviteId),
        with: {
          team: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }
      await assertTeamMutationAccess(invite.teamId, session.user.id, userRole);

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.delete(teamInvite).where(eq(teamInvite.id, input.inviteId));

        await tx.insert(userActivityLog).values({
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
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });
      });

      return { success: true };
    }),
});
