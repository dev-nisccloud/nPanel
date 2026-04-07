import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { emailCampaign, campaignRecipient, emailEvent } from "@npanel/db/schema/email-marketing";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { emailEventListFiltersSchema, emailEventDetailSchema, emailEventListResponseSchema, campaignEventSummaryInputSchema, campaignEventSummarySchema, topClickedLinksInputSchema, topClickedLinksResponseSchema, emailGlobalEventsInputSchema, emailGlobalEventsResponseSchema, } from "./schemas";
async function assertTeamMember(teamId, userId) {
    const [member] = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
        .limit(1);
    return member ?? null;
}
async function assertCampaignAccess(campaignId, userId) {
    const [campaign] = await db
        .select({ id: emailCampaign.id, userId: emailCampaign.userId, teamId: emailCampaign.teamId })
        .from(emailCampaign)
        .where(eq(emailCampaign.id, campaignId))
        .limit(1);
    if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    }
    if (campaign.userId === userId)
        return campaign;
    if (campaign.teamId) {
        const member = await assertTeamMember(campaign.teamId, userId);
        if (!member)
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        return campaign;
    }
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}
async function assertRecipientAccess(recipientId, userId) {
    const [row] = await db
        .select({
        id: campaignRecipient.id,
        campaignId: campaignRecipient.campaignId,
        campaignUserId: emailCampaign.userId,
        campaignTeamId: emailCampaign.teamId,
    })
        .from(campaignRecipient)
        .innerJoin(emailCampaign, eq(campaignRecipient.campaignId, emailCampaign.id))
        .where(eq(campaignRecipient.id, recipientId))
        .limit(1);
    if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
    }
    if (row.campaignUserId === userId)
        return row;
    if (row.campaignTeamId) {
        const member = await assertTeamMember(row.campaignTeamId, userId);
        if (!member)
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        return row;
    }
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}
export const emailMarketingEmailEventsRouter = router({
    getGlobalEvents: protectedProcedure
        .input(emailGlobalEventsInputSchema)
        .query(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User session not found",
            });
        }
        // Only allow AGENCY_ADMIN and AGENCY_SUPER_ADMIN
        const userRole = session.user.role;
        if (userRole !== "AGENCY_ADMIN" && userRole !== "AGENCY_SUPER_ADMIN") {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have permission to view global email events",
            });
        }
        const conditions = [];
        if (input.from)
            conditions.push(sql `${emailEvent.eventCreatedAt} >= ${input.from}`);
        if (input.to)
            conditions.push(sql `${emailEvent.eventCreatedAt} <= ${input.to}`);
        const whereClause = conditions.length > 0 ? and(...conditions) : sql `true`;
        const events = await db
            .select({ type: emailEvent.type, eventCreatedAt: emailEvent.eventCreatedAt })
            .from(emailEvent)
            .where(whereClause)
            .orderBy(emailEvent.eventCreatedAt);
        return emailGlobalEventsResponseSchema.parse(events);
    }),
    getById: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User session not found",
            });
        }
        const [event] = await db
            .select({
            id: emailEvent.id,
            campaignRecipientId: emailEvent.campaignRecipientId,
            type: emailEvent.type,
            eventCreatedAt: emailEvent.eventCreatedAt,
            resendEmailId: emailEvent.resendEmailId,
            data: emailEvent.data,
            createdAt: emailEvent.createdAt,
            campaignUserId: emailCampaign.userId,
            campaignTeamId: emailCampaign.teamId,
        })
            .from(emailEvent)
            .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
            .innerJoin(emailCampaign, eq(campaignRecipient.campaignId, emailCampaign.id))
            .where(eq(emailEvent.id, input.id))
            .limit(1);
        if (!event) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Email event not found",
            });
        }
        if (event.campaignUserId !== userId) {
            if (event.campaignTeamId) {
                const member = await assertTeamMember(event.campaignTeamId, userId);
                if (!member)
                    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }
            else {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }
        }
        return emailEventDetailSchema.parse({
            ...event,
            resendEmailId: event.resendEmailId ?? null,
            data: event.data,
        });
    }),
    list: protectedProcedure
        .input(emailEventListFiltersSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User session not found",
            });
        }
        if (!input.campaignRecipientId && !input.campaignId) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Provide campaignRecipientId or campaignId",
            });
        }
        // Access check: ensure user can see the campaign
        if (input.campaignId) {
            await assertCampaignAccess(input.campaignId, userId);
        }
        if (input.campaignRecipientId) {
            await assertRecipientAccess(input.campaignRecipientId, userId);
        }
        const conditions = [];
        if (input.campaignRecipientId) {
            conditions.push(eq(emailEvent.campaignRecipientId, input.campaignRecipientId));
        }
        if (input.campaignId) {
            conditions.push(eq(campaignRecipient.campaignId, input.campaignId));
        }
        if (input.type) {
            conditions.push(eq(emailEvent.type, input.type));
        }
        const whereClause = and(...conditions);
        const [events, totalRes] = await Promise.all([
            db
                .select({
                id: emailEvent.id,
                campaignRecipientId: emailEvent.campaignRecipientId,
                type: emailEvent.type,
                eventCreatedAt: emailEvent.eventCreatedAt,
                resendEmailId: emailEvent.resendEmailId,
                data: emailEvent.data,
                createdAt: emailEvent.createdAt,
                recipientEmail: campaignRecipient.toEmail,
            })
                .from(emailEvent)
                .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
                .where(whereClause)
                .orderBy(desc(emailEvent.eventCreatedAt))
                .limit(input.limit)
                .offset(input.offset),
            db
                .select({ value: count() })
                .from(emailEvent)
                .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
                .where(whereClause),
        ]);
        const total = Number(totalRes[0]?.value ?? 0);
        return emailEventListResponseSchema.parse({
            events: events.map((e) => {
                return {
                    id: e.id,
                    campaignRecipientId: e.campaignRecipientId,
                    type: e.type,
                    eventCreatedAt: e.eventCreatedAt,
                    resendEmailId: e.resendEmailId ?? null,
                    data: e.data,
                    createdAt: e.createdAt,
                    recipientEmail: e.recipientEmail ?? undefined,
                };
            }),
            total,
        });
    }),
    getCampaignSummary: protectedProcedure
        .input(campaignEventSummaryInputSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User session not found",
            });
        }
        await assertCampaignAccess(input.campaignId, userId);
        const [grouped, totalRecipientsRes, openedUniqueRows, clickedUniqueRows] = await Promise.all([
            db
                .select({ type: emailEvent.type, cnt: count(emailEvent.id).as("cnt") })
                .from(emailEvent)
                .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
                .where(eq(campaignRecipient.campaignId, input.campaignId))
                .groupBy(emailEvent.type),
            db
                .select({ value: count() })
                .from(campaignRecipient)
                .where(eq(campaignRecipient.campaignId, input.campaignId)),
            db
                .select({ campaignRecipientId: emailEvent.campaignRecipientId })
                .from(emailEvent)
                .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
                .where(and(eq(campaignRecipient.campaignId, input.campaignId), eq(emailEvent.type, "email_opened")))
                .groupBy(emailEvent.campaignRecipientId),
            db
                .select({ campaignRecipientId: emailEvent.campaignRecipientId })
                .from(emailEvent)
                .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
                .where(and(eq(campaignRecipient.campaignId, input.campaignId), eq(emailEvent.type, "email_clicked")))
                .groupBy(emailEvent.campaignRecipientId),
        ]);
        const byType = {};
        for (const row of grouped) {
            byType[row.type] = Number(row.cnt ?? 0);
        }
        const totalRecipients = Number(totalRecipientsRes[0]?.value ?? 0);
        return campaignEventSummarySchema.parse({
            delivered: byType["email_delivered"] ?? 0,
            bounced: byType["email_bounced"] ?? 0,
            suppressed: byType["email_suppressed"] ?? 0,
            opened: openedUniqueRows.length,
            openedTotal: byType["email_opened"] ?? 0,
            clicked: clickedUniqueRows.length,
            clickedTotal: byType["email_clicked"] ?? 0,
            complained: byType["email_complained"] ?? 0,
            unsubscribed: 0,
            totalRecipients,
        });
    }),
    getTopClickedLinks: protectedProcedure
        .input(topClickedLinksInputSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User session not found",
            });
        }
        await assertCampaignAccess(input.campaignId, userId);
        const clickEvents = await db
            .select({ data: emailEvent.data })
            .from(emailEvent)
            .innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
            .where(and(eq(emailEvent.type, "email_clicked"), eq(campaignRecipient.campaignId, input.campaignId)));
        /** Extract clicked URL from Resend webhook data (jsonb). Stored shape: { click: { link: "..." }, to, from, ... } */
        function getLinkFromEventData(rawData) {
            let data = null;
            if (rawData === null || rawData === undefined)
                return null;
            if (typeof rawData === "string") {
                try {
                    data = JSON.parse(rawData);
                }
                catch {
                    return null;
                }
            }
            else if (typeof rawData === "object" && rawData !== null && !Array.isArray(rawData)) {
                data = rawData;
            }
            if (!data)
                return null;
            // Resend stores: data.click.link (nested object)
            const click = data["click"];
            if (click && typeof click === "object" && !Array.isArray(click) && click !== null) {
                const link = click["link"];
                if (typeof link === "string" && link.trim())
                    return link.trim();
            }
            // Fallbacks
            const link = data["link"] ?? data["url"] ?? data["href"] ?? data["clicked_link"];
            return typeof link === "string" && link.trim() ? link.trim() : null;
        }
        const urlToCount = new Map();
        for (const event of clickEvents) {
            const url = getLinkFromEventData(event.data);
            if (!url)
                continue;
            urlToCount.set(url, (urlToCount.get(url) ?? 0) + 1);
        }
        const sorted = [...urlToCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, input.limit)
            .map(([url, clicks]) => ({ url, clicks }));
        return topClickedLinksResponseSchema.parse(sorted);
    }),
});
