import { z } from "zod";
import { TRPCError, type AnyRouter } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import db from "@nPanel/db";

// Dedicated Zod schemas for email logs
const getLogsByCampaignSchema = z.object({
  campaignId: z.string(),
  eventType: z.enum(["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK", "REJECT", "RENDERING_FAILURE"]).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

const getLogsByContactSchema = z.object({
  audienceContactId: z.string(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

const getCampaignStatsSchema = z.object({
  campaignId: z.string(),
});

export const logsRouter: AnyRouter = router({
  /**
   * Get email logs for a campaign
   */
  getByCampaign: protectedProcedure
    .input(getLogsByCampaignSchema)
    .query(async ({ input, ctx }) => {
      const { campaignId, eventType, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if campaign exists and user has access
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id: campaignId,
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

        const logs = await db.emailLog.findMany({
          where: {
            campaignId,
            ...(eventType ? { eventType } : {}),
          },
          include: {
            audienceContact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.emailLog.count({
          where: {
            campaignId,
            ...(eventType ? { eventType } : {}),
          },
        });

        return {
          logs,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error getting campaign logs:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get campaign logs",
        });
      }
    }),

  /**
   * Get email logs for a contact
   */
  getByContact: protectedProcedure
    .input(getLogsByContactSchema)
    .query(async ({ input, ctx }) => {
      const { audienceContactId, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if contact exists and user has access
        const contact = await db.audienceContact.findFirst({
          where: {
            id: audienceContactId,
            audience: {
              OR: [
                { userId },
                { team: { members: { some: { userId } } } },
              ],
            },
          },
        });

        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        const logs = await db.emailLog.findMany({
          where: {
            audienceContactId,
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                subject: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.emailLog.count({
          where: {
            audienceContactId,
          },
        });

        return {
          logs,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error getting contact logs:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get contact logs",
        });
      }
    }),

  /**
   * Get campaign statistics
   */
  getStats: protectedProcedure
    .input(getCampaignStatsSchema)
    .query(async ({ input, ctx }) => {
      const { campaignId } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if campaign exists and user has access
        const campaign = await db.emailCampaign.findFirst({
          where: {
            id: campaignId,
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

        // Get all logs for the campaign
        const logs = await db.emailLog.findMany({
          where: {
            campaignId,
          },
          select: {
            eventType: true,
            timestamp: true,
            audienceContactId: true,
          },
        });

        // Calculate statistics
        const stats = {
          totalSent: logs.filter(log => log.eventType === "SEND").length,
          totalDelivered: logs.filter(log => log.eventType === "DELIVERY").length,
          totalOpened: logs.filter(log => log.eventType === "OPEN").length,
          totalClicked: logs.filter(log => log.eventType === "CLICK").length,
          totalBounced: logs.filter(log => log.eventType === "BOUNCE").length,
          totalComplained: logs.filter(log => log.eventType === "COMPLAINT").length,
          totalRejected: logs.filter(log => log.eventType === "REJECT").length,
          totalRenderingFailures: logs.filter(log => log.eventType === "RENDERING_FAILURE").length,
        };

        // Calculate rates
        const rates = {
          deliveryRate: stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0,
          openRate: stats.totalDelivered > 0 ? (stats.totalOpened / stats.totalDelivered) * 100 : 0,
          clickRate: stats.totalDelivered > 0 ? (stats.totalClicked / stats.totalDelivered) * 100 : 0,
          bounceRate: stats.totalSent > 0 ? (stats.totalBounced / stats.totalSent) * 100 : 0,
          complaintRate: stats.totalSent > 0 ? (stats.totalComplained / stats.totalSent) * 100 : 0,
          rejectRate: stats.totalSent > 0 ? (stats.totalRejected / stats.totalSent) * 100 : 0,
        };

        // Get unique recipients for each event type
        const uniqueStats = {
          uniqueOpened: new Set(logs.filter(log => log.eventType === "OPEN").map(log => log.audienceContactId)).size,
          uniqueClicked: new Set(logs.filter(log => log.eventType === "CLICK").map(log => log.audienceContactId)).size,
        };

        // Calculate unique rates
        const uniqueRates = {
          uniqueOpenRate: stats.totalDelivered > 0 ? (uniqueStats.uniqueOpened / stats.totalDelivered) * 100 : 0,
          uniqueClickRate: stats.totalDelivered > 0 ? (uniqueStats.uniqueClicked / stats.totalDelivered) * 100 : 0,
        };

        // Get recent activity (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentActivity = {
          recentOpens: logs.filter(log => 
            log.eventType === "OPEN" && 
            log.timestamp && 
            new Date(log.timestamp) > oneDayAgo
          ).length,
          recentClicks: logs.filter(log => 
            log.eventType === "CLICK" && 
            log.timestamp && 
            new Date(log.timestamp) > oneDayAgo
          ).length,
          recentBounces: logs.filter(log => 
            log.eventType === "BOUNCE" && 
            log.timestamp && 
            new Date(log.timestamp) > oneDayAgo
          ).length,
          recentComplaints: logs.filter(log => 
            log.eventType === "COMPLAINT" && 
            log.timestamp && 
            new Date(log.timestamp) > oneDayAgo
          ).length,
        };

        return {
          campaign: {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            totalRecipients: campaign.totalRecipients,
            sentAt: campaign.sentAt,
            createdAt: campaign.createdAt,
          },
          stats,
          rates,
          uniqueStats,
          uniqueRates,
          recentActivity,
        };
      } catch (error) {
        console.error("Error getting campaign stats:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get campaign statistics",
        });
      }
    }),
});
