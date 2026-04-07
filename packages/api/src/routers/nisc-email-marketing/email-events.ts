import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscEmCampaign, niscEmEmail, niscEmEmailEvent } from "@npanel/db/schema";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import {
  campaignEventSummaryInputSchema,
  campaignEventSummarySchema,
  emailEventListFiltersSchema,
  emailEventListResponseSchema,
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
    default:
      return `email_${eventType.toLowerCase()}`;
  }
}

export const niscEmailMarketingEmailEventsRouter = router({
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

  list: protectedProcedure.input(emailEventListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    if (!input.campaignId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Provide campaignId" });
    }

    await assertCampaignAccess(input.campaignId, userId);

    const conditions = [eq(niscEmEmail.campaignId, input.campaignId)];
    if (input.type) {
      // input.type is legacy (email_opened, etc). Best-effort map.
      const wanted = input.type.toLowerCase().replace(/^email_/, "");
      conditions.push(sql`lower(${niscEmEmailEvent.eventType}) = ${wanted}`);
    }

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: niscEmEmailEvent.id,
          campaignRecipientId: sql<string>`coalesce(${niscEmEmailEvent.emailId}, 'missing')`,
          type: niscEmEmailEvent.eventType,
          eventCreatedAt: niscEmEmailEvent.occurredAt,
          resendEmailId: sql<string | null>`null`,
          data: niscEmEmailEvent.rawPayload,
          createdAt: niscEmEmailEvent.createdAt,
          recipientEmail: niscEmEmailEvent.recipientEmail,
        })
        .from(niscEmEmailEvent)
        .leftJoin(niscEmEmail, eq(niscEmEmailEvent.emailId, niscEmEmail.id))
        .where(whereClause)
        .orderBy(desc(niscEmEmailEvent.occurredAt))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ value: count() }).from(niscEmEmailEvent).leftJoin(niscEmEmail, eq(niscEmEmailEvent.emailId, niscEmEmail.id)).where(whereClause),
    ]);

    return emailEventListResponseSchema.parse({
      events: rows.map((r) => ({
        ...r,
        type: toLegacyEventType(r.type) as any,
        resendEmailId: null,
        recipientEmail: r.recipientEmail ?? null,
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

