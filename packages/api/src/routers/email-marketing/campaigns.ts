import { z } from "zod";
import { TRPCError, type AnyRouter } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import db from "@nPanel/db";
import { queueCampaignSend, scheduleCampaignSend } from "../../lib/queue/email-queue";

// Dedicated Zod schemas for campaign management
const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  teamId: z.string().optional(),
  emailDomainId: z.string(),
  audienceId: z.string(),
  fromAddress: z.string().email(),
  replyToAddress: z.string().email(),
  subject: z.string().min(1),
  htmlContent: z.string(),
  textContent: z.string().optional(),
});

const updateCampaignSchema = z.object({
  id: z.string(),
  updates: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    fromAddress: z.string().email().optional(),
    replyToAddress: z.string().email().optional(),
    subject: z.string().min(1).optional(),
    htmlContent: z.string().optional(),
    textContent: z.string().optional(),
  }),
});

const getCampaignByIdSchema = z.object({
  id: z.string(),
});

const scheduleCampaignSchema = z.object({
  id: z.string(),
  scheduledAt: z.date(),
});

const sendCampaignSchema = z.object({
  id: z.string(),
});

const pauseCampaignSchema = z.object({
  id: z.string(),
});

const deleteCampaignSchema = z.object({
  id: z.string(),
});

const listCampaignsSchema = z.object({
  teamId: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "FAILED", "CANCELLED"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const campaignsRouter: AnyRouter = router({
  /**
   * Create a new email campaign
   */
  create: protectedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        name,
        description,
        teamId,
        emailDomainId,
        audienceId,
        fromAddress,
        replyToAddress,
        subject,
        htmlContent,
        textContent,
      } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Validate email domain exists and is verified
        const emailDomain = await db.emailDomain.findFirst({
          where: {
            id: emailDomainId,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!emailDomain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email domain not found",
          });
        }

        if (!emailDomain.isVerified) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email domain is not verified",
          });
        }

        // Validate audience exists
        const audience = await db.audience.findFirst({
          where: {
            id: audienceId,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        // Create campaign
        const campaign = await db.emailCampaign.create({
          data: {
            id: crypto.randomUUID(),
            name,
            description: description || null,
            teamId: teamId || null,
            userId,
            emailDomainId,
            audienceId,
            fromAddress,
            replyToAddress,
            subject,
            htmlContent,
            textContent: textContent || null,
            status: "DRAFT",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: campaign.id,
            action: "CREATE",
            description: `Campaign "${name}" created`,
            metadata: {
              name,
              emailDomainId,
              audienceId,
              fromAddress,
              replyToAddress,
            },
            createdAt: new Date(),
          },
        });

        return campaign;
      } catch (error) {
        console.error("Error creating campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create campaign",
        });
      }
    }),

  /**
   * List campaigns for user/team
   */
  list: protectedProcedure
    .input(listCampaignsSchema)
    .query(async ({ input, ctx }) => {
      const { teamId, status, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaigns = await db.emailCampaign.findMany({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
            ...(status ? { status } : {}),
          },
          include: {
            team: true,
            emailDomain: {
              select: {
                id: true,
                domainName: true,
                isVerified: true,
              },
            },
            audience: {
              select: {
                id: true,
                name: true,
                totalContacts: true,
              },
            },
            _count: {
              select: {
                logs: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.emailCampaign.count({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
            ...(status ? { status } : {}),
          },
        });

        return {
          campaigns,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing campaigns:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list campaigns",
        });
      }
    }),

  /**
   * Get campaign by ID
   */
  getById: protectedProcedure
    .input(getCampaignByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            team: true,
            emailDomain: true,
            audience: {
              include: {
                contacts: {
                  where: {
                    status: "SUBSCRIBED",
                  },
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            logs: {
              select: {
                id: true,
                eventType: true,
                timestamp: true,
                messageId: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 100,
            },
          },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        return campaign;
      } catch (error) {
        console.error("Error getting campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get campaign",
        });
      }
    }),

  /**
   * Update campaign
   */
  update: protectedProcedure
    .input(updateCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, updates } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const existingCampaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!existingCampaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // Only allow updates if campaign is in DRAFT status
        if (existingCampaign.status !== "DRAFT") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only update campaigns in DRAFT status",
          });
        }

        const updatedCampaign = await db.emailCampaign.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: id,
            action: "UPDATE",
            description: `Campaign "${existingCampaign.name}" updated`,
            metadata: {
              updates,
            },
            createdAt: new Date(),
          },
        });

        return updatedCampaign;
      } catch (error) {
        console.error("Error updating campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update campaign",
        });
      }
    }),

  /**
   * Schedule campaign for later sending
   */
  schedule: protectedProcedure
    .input(scheduleCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, scheduledAt } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        if (campaign.status !== "DRAFT") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only schedule campaigns in DRAFT status",
          });
        }

        if (scheduledAt <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Scheduled time must be in the future",
          });
        }

        // Update campaign status
        const updatedCampaign = await db.emailCampaign.update({
          where: { id },
          data: {
            status: "SCHEDULED",
            scheduledAt,
            updatedAt: new Date(),
          },
        });

        // Queue campaign for scheduled sending
        await scheduleCampaignSend(id, scheduledAt);

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: id,
            action: "SCHEDULE",
            description: `Campaign "${campaign.name}" scheduled for ${scheduledAt.toISOString()}`,
            metadata: {
              scheduledAt,
            },
            createdAt: new Date(),
          },
        });

        return updatedCampaign;
      } catch (error) {
        console.error("Error scheduling campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule campaign",
        });
      }
    }),

  /**
   * Send campaign immediately
   */
  send: protectedProcedure
    .input(sendCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            audience: {
              include: {
                contacts: {
                  where: {
                    status: "SUBSCRIBED",
                  },
                },
              },
            },
          },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only send campaigns in DRAFT or SCHEDULED status",
          });
        }

        if (campaign.audience.contacts.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Audience has no subscribed contacts",
          });
        }

        // Update campaign status
        const updatedCampaign = await db.emailCampaign.update({
          where: { id },
          data: {
            status: "SENDING",
            updatedAt: new Date(),
          },
        });

        // Queue campaign for sending
        await queueCampaignSend(id);

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: id,
            action: "SEND",
            description: `Campaign "${campaign.name}" queued for sending`,
            metadata: {
              totalRecipients: campaign.audience.contacts.length,
            },
            createdAt: new Date(),
          },
        });

        return updatedCampaign;
      } catch (error) {
        console.error("Error sending campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send campaign",
        });
      }
    }),

  /**
   * Pause campaign sending
   */
  pause: protectedProcedure
    .input(pauseCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        if (campaign.status !== "SENDING") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only pause campaigns in SENDING status",
          });
        }

        // Update campaign status
        const updatedCampaign = await db.emailCampaign.update({
          where: { id },
          data: {
            status: "PAUSED",
            updatedAt: new Date(),
          },
        });

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: id,
            action: "PAUSE",
            description: `Campaign "${campaign.name}" paused`,
            createdAt: new Date(),
          },
        });

        return updatedCampaign;
      } catch (error) {
        console.error("Error pausing campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to pause campaign",
        });
      }
    }),

  /**
   * Delete campaign
   */
  delete: protectedProcedure
    .input(deleteCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // Only allow deletion if campaign is in DRAFT or FAILED status
        if (campaign.status !== "DRAFT" && campaign.status !== "FAILED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only delete campaigns in DRAFT or FAILED status",
          });
        }

        // Delete campaign and related logs
        await db.emailCampaign.delete({
          where: { id },
        });

        // Log activity
        await db.emailCampaignActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailCampaignId: id,
            action: "DELETE",
            description: `Campaign "${campaign.name}" deleted`,
            metadata: {
              name: campaign.name,
            },
            createdAt: new Date(),
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting campaign:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete campaign",
        });
      }
    }),
});
