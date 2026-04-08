import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscEmCampaign, niscEmEmail, niscEmEmailEvent } from "@npanel/db/schema";
import { teamMember } from "@npanel/db/schema/teams";
import { team } from "@npanel/db/schema/teams";
import { user } from "@npanel/db/schema/auth";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import {
  campaignEventSummaryInputSchema,
  campaignEventSummarySchema,
  emailEventListFiltersSchema,
  emailEventListResponseSchema,
  emailGlobalEventsInputSchema,
  emailGlobalEventsResponseSchema,
  topClickedLinksInputSchema,
  topClickedLinksResponseSchema,
} from "../email-marketing/schemas";

async function assertTeamMember(teamId: string, userId: string) {
  const [member] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  return member ?? null;
}

async function assertCampaignAccess(campaignId: string, userId: string) {
  const [campaign] = await db
    .select({ id: niscEmCampaign.id, userId: niscEmCampaign.userId, teamId: niscEmCampaign.teamId })
    .from(niscEmCampaign)
    .where(eq(niscEmCampaign.id, campaignId))
    .limit(1);
  if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
  if (campaign.userId === userId) return campaign;
  if (campaign.teamId) {
    const member = await assertTeamMember(campaign.teamId, userId);
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return campaign;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

function toLegacyEventType(eventType: string): string {
  switch (eventType) {
    case "Delivery":
      return "email_delivered";
    case "DeliveryDelay":
      return "email_delivery_delayed";
    case "Open":
      return "email_opened";
    case "Click":
      return "email_clicked";
    case "Bounce":
      return "email_bounced";
    case "Complaint":
      return "email_complained";
    case "Send":
      return "email_sent";
    case "Reject":
    case "RenderingFailure":
    case "Unknown":
      return "email_failed";
    default:
      // Keep response Zod-safe: if we don't know the event type, treat it as failed
      // so consumers never crash on unexpected SES eventType values.
      return "email_failed";
  }
}

export const niscEmailMarketingEmailEventsRouter = router({
  getGlobalEvents: protectedProcedure
    .input(emailGlobalEventsInputSchema)
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      }

      const userRole = session.user.role;
      if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view global email events",
        });
      }

      const conditions = [];
      if (input.from) conditions.push(sql`${niscEmEmailEvent.occurredAt} >= ${input.from}`);
      if (input.to) conditions.push(sql`${niscEmEmailEvent.occurredAt} <= ${input.to}`);
      const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;

      const rows = await db
        .select({
          type: niscEmEmailEvent.eventType,
          eventCreatedAt: niscEmEmailEvent.occurredAt,
        })
        .from(niscEmEmailEvent)
        .where(whereClause)
        .orderBy(niscEmEmailEvent.occurredAt);

      return emailGlobalEventsResponseSchema.parse(
        rows.map((r) => ({
          type: toLegacyEventType(r.type) as any,
          eventCreatedAt: r.eventCreatedAt,
        })),
      );
    }),

  getCampaignSummary: protectedProcedure
    .input(campaignEventSummaryInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertCampaignAccess(input.campaignId, userId);

      const [agg] = await db
        .select({
          totalRecipients: sql<number>`count(*)`,
          delivered: sql<number>`count(*) filter (where ${niscEmEmail.deliveredAt} is not null)`,
          bounced: sql<number>`count(*) filter (where ${niscEmEmail.bouncedAt} is not null)`,
          complained: sql<number>`count(*) filter (where ${niscEmEmail.complainedAt} is not null)`,
          opened: sql<number>`count(*) filter (where ${niscEmEmail.openedAt} is not null)`,
          clicked: sql<number>`count(*) filter (where ${niscEmEmail.clickedAt} is not null)`,
          openedTotal: sql<number>`coalesce(sum(${niscEmEmail.opens}), 0)`,
          clickedTotal: sql<number>`coalesce(sum(${niscEmEmail.clicks}), 0)`,
        })
        .from(niscEmEmail)
        .where(eq(niscEmEmail.campaignId, input.campaignId));

      return campaignEventSummarySchema.parse({
        campaignId: input.campaignId,
        totalRecipients: Number(agg?.totalRecipients ?? 0),
        delivered: Number(agg?.delivered ?? 0),
        bounced: Number(agg?.bounced ?? 0),
        suppressed: 0,
        opened: Number(agg?.opened ?? 0),
        openedTotal: Number(agg?.openedTotal ?? 0),
        clicked: Number(agg?.clicked ?? 0),
        clickedTotal: Number(agg?.clickedTotal ?? 0),
        unsubscribed: 0,
        complained: Number(agg?.complained ?? 0),
      });
    }),

  getCampaignReport: protectedProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertCampaignAccess(input.campaignId, userId);

      const [campaign] = await db
        .select({
          id: niscEmCampaign.id,
          userId: niscEmCampaign.userId,
          teamId: niscEmCampaign.teamId,
          name: niscEmCampaign.name,
          subject: niscEmCampaign.subject,
          fromEmail: niscEmCampaign.fromEmail,
          fromName: niscEmCampaign.fromName,
          replyTo: niscEmCampaign.replyTo,
          status: niscEmCampaign.status,
          totalRecipients: niscEmCampaign.totalRecipients,
          scheduledAt: niscEmCampaign.scheduledAt,
          sentAt: niscEmCampaign.sentAt,
          completedAt: niscEmCampaign.completedAt,
          createdAt: niscEmCampaign.createdAt,
          updatedAt: niscEmCampaign.updatedAt,
        })
        .from(niscEmCampaign)
        .where(eq(niscEmCampaign.id, input.campaignId))
        .limit(1);

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

      const [creatorRow, teamRow] = await Promise.all([
        db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, campaign.userId)).limit(1),
        campaign.teamId
          ? db.select({ name: team.name }).from(team).where(eq(team.id, campaign.teamId)).limit(1)
          : Promise.resolve([] as Array<{ name: string }>),
      ]);

      // Average time-to-event (ms) from per-email sentAt to each event timestamp.
      const avgRes = await db.execute<{
        avgDeliveryMs: number | null;
        avgOpenMs: number | null;
        avgClickMs: number | null;
      }>(sql`
        select
          avg(extract(epoch from (m.delivered_at - m.sent_at)) * 1000) filter (where m.delivered_at is not null and m.sent_at is not null) as "avgDeliveryMs",
          avg(extract(epoch from (m.opened_at - m.sent_at)) * 1000) filter (where m.opened_at is not null and m.sent_at is not null) as "avgOpenMs",
          avg(extract(epoch from (m.clicked_at - m.sent_at)) * 1000) filter (where m.clicked_at is not null and m.sent_at is not null) as "avgClickMs"
        from ${niscEmEmail} m
        where m.campaign_id = ${input.campaignId}
      `);
      const avgRow = (avgRes as unknown as { rows?: any[] }).rows?.[0] ?? {};

      const sendDurationMs =
        campaign.sentAt && campaign.completedAt
          ? new Date(campaign.completedAt).getTime() - new Date(campaign.sentAt).getTime()
          : null;

      return {
        campaign: {
          ...campaign,
          creator: {
            name: creatorRow?.[0]?.name ?? null,
            email: creatorRow?.[0]?.email ?? null,
          },
          companyName: teamRow?.[0]?.name ?? null,
        },
        timing: {
          avgDeliveryMs: avgRow.avgDeliveryMs != null ? Number(avgRow.avgDeliveryMs) : null,
          avgOpenMs: avgRow.avgOpenMs != null ? Number(avgRow.avgOpenMs) : null,
          avgClickMs: avgRow.avgClickMs != null ? Number(avgRow.avgClickMs) : null,
          sendDurationMs,
        },
      };
    }),

  getBounceBreakdown: protectedProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertCampaignAccess(input.campaignId, userId);

      // Bounce reason lives on the denormalized email row (fast aggregation).
      const byTypeRes = await db.execute<{ bounce_type: string | null; count: number }>(sql`
        select
          m.bounce_type as bounce_type,
          count(*)::int as count
        from ${niscEmEmail} m
        where m.campaign_id = ${input.campaignId}
          and m.bounced_at is not null
        group by m.bounce_type
      `);

      const bySubTypeRes = await db.execute<{ bounce_sub_type: string | null; count: number }>(sql`
        select
          m.bounce_sub_type as bounce_sub_type,
          count(*)::int as count
        from ${niscEmEmail} m
        where m.campaign_id = ${input.campaignId}
          and m.bounced_at is not null
        group by m.bounce_sub_type
        order by count desc
        limit 6
      `);

      const byTypeRows = (byTypeRes as unknown as { rows?: Array<{ bounce_type: string | null; count: number }> }).rows ?? [];
      const bySubTypeRows =
        (bySubTypeRes as unknown as { rows?: Array<{ bounce_sub_type: string | null; count: number }> }).rows ?? [];

      const byType = byTypeRows.reduce(
        (acc, r) => {
          const key = r.bounce_type ?? "Unknown";
          acc[key] = (acc[key] ?? 0) + Number(r.count ?? 0);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        campaignId: input.campaignId,
        byType,
        topSubTypes: bySubTypeRows.map((r) => ({
          bounceSubType: r.bounce_sub_type ?? "Unknown",
          count: Number(r.count ?? 0),
        })),
      };
    }),

  list: protectedProcedure.input(emailEventListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    if (!input.campaignId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Provide campaignId" });
    }

    await assertCampaignAccess(input.campaignId, userId);

    const conditions = [eq(niscEmEmail.campaignId, input.campaignId)];
    if (input.type) {
      // input.type is legacy (email_opened, etc). Map to SES SNS eventType values.
      const map: Record<string, string> = {
        email_sent: "Send",
        email_delivered: "Delivery",
        email_opened: "Open",
        email_clicked: "Click",
        email_bounced: "Bounce",
        email_complained: "Complaint",
        email_delivery_delayed: "DeliveryDelay",
        // Closest SES failure-type event that appears in eventType.
        email_failed: "RenderingFailure",
      };
      const wantedEventType = map[input.type] ?? "";
      if (wantedEventType) {
        conditions.push(eq(niscEmEmailEvent.eventType, wantedEventType));
      }
    }
    if (input.recipientEmail) {
      conditions.push(ilike(niscEmEmailEvent.recipientEmail, `%${input.recipientEmail}%`));
    }

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: niscEmEmailEvent.id,
          campaignRecipientId: sql<string>`coalesce(${niscEmEmail.id}, coalesce(${niscEmEmailEvent.emailId}, 'missing'))`,
          type: niscEmEmailEvent.eventType,
          eventCreatedAt: niscEmEmailEvent.occurredAt,
          resendEmailId: sql<string | null>`null`,
          data: niscEmEmailEvent.rawPayload,
          createdAt: niscEmEmailEvent.createdAt,
          recipientEmail: niscEmEmailEvent.recipientEmail,
          link: niscEmEmailEvent.link,
        })
        .from(niscEmEmailEvent)
        // Join by SES message id to remain robust even when emailId is missing in the event row.
        .leftJoin(niscEmEmail, eq(niscEmEmailEvent.sesMessageId, niscEmEmail.sesMessageId))
        .where(whereClause)
        .orderBy(desc(niscEmEmailEvent.occurredAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ value: count() })
        .from(niscEmEmailEvent)
        .leftJoin(niscEmEmail, eq(niscEmEmailEvent.sesMessageId, niscEmEmail.sesMessageId))
        .where(whereClause),
    ]);

    return emailEventListResponseSchema.parse({
      events: rows.map((r) => ({
        ...r,
        type: toLegacyEventType(r.type) as any,
        resendEmailId: null,
        recipientEmail: r.recipientEmail ?? null,
        link: r.link ?? null,
        data: r.data,
      })),
      total: Number(totalRow?.[0]?.value ?? 0),
    });
  }),

  getTopClickedLinks: protectedProcedure
    .input(topClickedLinksInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertCampaignAccess(input.campaignId, userId);

      const res = await db.execute<{ url: string; clicks: number }>(sql`
        select
          e.link as url,
          count(*)::int as clicks
        from ${niscEmEmailEvent} e
        left join ${niscEmEmail} m on m.id = e.email_id
        where m.campaign_id = ${input.campaignId}
          and e.event_type = 'Click'
          and e.link is not null
        group by e.link
        order by clicks desc
        limit ${input.limit}
      `);

      const rows = (res as unknown as { rows?: Array<{ url: string; clicks: number }> }).rows ?? [];
      return topClickedLinksResponseSchema.parse(
        rows.map((r) => ({ url: r.url, clicks: Number(r.clicks ?? 0) })),
      );
    }),
});

