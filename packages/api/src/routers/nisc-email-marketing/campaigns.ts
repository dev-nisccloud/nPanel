import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, inArray, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { teamMember } from "@npanel/db/schema/teams";
import { niscEmCampaign, niscEmDomain, niscEmEmail } from "@npanel/db/schema";
import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import {
  campaignCancelInputSchema,
  campaignCreateInputSchema,
  campaignDetailSchema,
  campaignListFiltersSchema,
  campaignListResponseSchema,
  campaignRecipientSummarySchema,
  campaignSendInputSchema,
  campaignSummarySchema,
} from "../email-marketing/schemas";
import { enqueueNiscEmDispatch } from "../../lib/qstash/nisc-em-dispatch";
import { assertTeamModulePermission, assertTeamPermission } from "../../lib/team-permissions/assert";
import {
  assertCanLinkNiscEmResource,
  assertTeamHasNiscEmailMarketingSubscription,
} from "../../lib/nisc-email-marketing-billing";

async function assertTeamMember(
  teamId: string,
  userId: string,
  role?: string | null,
) {
  if (isAgencyUserRole(role)) return { id: "agency" };
  const [member] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  if (!member) return null;
  await assertTeamModulePermission({
    teamId,
    userId,
    userRole: role,
    module: "email_marketing",
    access: "read",
  });
  return member;
}

function isAgencyUserRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
}

function isAgencySuperAdminRole(role: string | null | undefined): boolean {
  return role === "AGENCY_SUPER_ADMIN";
}

async function assertCampaignAccess(campaignId: string, userId: string, role?: string | null) {
  const [campaign] = await db
    .select({
      id: niscEmCampaign.id,
      userId: niscEmCampaign.userId,
      teamId: niscEmCampaign.teamId,
      name: niscEmCampaign.name,
      status: niscEmCampaign.status,
      subject: niscEmCampaign.subject,
      fromEmail: niscEmCampaign.fromEmail,
      fromName: niscEmCampaign.fromName,
      domainId: niscEmCampaign.domainId,
      htmlContent: niscEmCampaign.htmlContent,
      textContent: niscEmCampaign.textContent,
      scheduledAt: niscEmCampaign.scheduledAt,
      sentAt: niscEmCampaign.sentAt,
      createdAt: niscEmCampaign.createdAt,
      updatedAt: niscEmCampaign.updatedAt,
      totalRecipients: niscEmCampaign.totalRecipients,
    })
    .from(niscEmCampaign)
    .where(eq(niscEmCampaign.id, campaignId))
    .limit(1);

  if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
  if (campaign.userId === userId) return campaign;
  if (campaign.teamId) {
    const member = await assertTeamMember(campaign.teamId, userId, role);
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return campaign;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

async function assertCampaignOwnerAccess(
  campaignId: string,
  userId: string,
  role: string | null | undefined,
) {
  const [campaign] = await db
    .select({
      id: niscEmCampaign.id,
      userId: niscEmCampaign.userId,
      teamId: niscEmCampaign.teamId,
      name: niscEmCampaign.name,
      status: niscEmCampaign.status,
      subject: niscEmCampaign.subject,
      fromEmail: niscEmCampaign.fromEmail,
      fromName: niscEmCampaign.fromName,
      domainId: niscEmCampaign.domainId,
      htmlContent: niscEmCampaign.htmlContent,
      textContent: niscEmCampaign.textContent,
      scheduledAt: niscEmCampaign.scheduledAt,
      sentAt: niscEmCampaign.sentAt,
      createdAt: niscEmCampaign.createdAt,
      updatedAt: niscEmCampaign.updatedAt,
      totalRecipients: niscEmCampaign.totalRecipients,
    })
    .from(niscEmCampaign)
    .where(eq(niscEmCampaign.id, campaignId))
    .limit(1);

  if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
  if (!isAgencySuperAdminRole(role) && campaign.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the campaign creator can modify it" });
  }
  return campaign;
}

async function assertCampaignReadAccess(campaignId: string, userId: string, role: string | null | undefined) {
  if (isAgencyUserRole(role)) {
    const [campaign] = await db
      .select({
        id: niscEmCampaign.id,
        userId: niscEmCampaign.userId,
        teamId: niscEmCampaign.teamId,
        name: niscEmCampaign.name,
        status: niscEmCampaign.status,
        subject: niscEmCampaign.subject,
        fromEmail: niscEmCampaign.fromEmail,
        fromName: niscEmCampaign.fromName,
        domainId: niscEmCampaign.domainId,
        htmlContent: niscEmCampaign.htmlContent,
        textContent: niscEmCampaign.textContent,
        scheduledAt: niscEmCampaign.scheduledAt,
        sentAt: niscEmCampaign.sentAt,
        createdAt: niscEmCampaign.createdAt,
        updatedAt: niscEmCampaign.updatedAt,
        totalRecipients: niscEmCampaign.totalRecipients,
      })
      .from(niscEmCampaign)
      .where(eq(niscEmCampaign.id, campaignId))
      .limit(1);
    if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    return campaign;
  }

  return assertCampaignAccess(campaignId, userId);
}

async function fetchRecipients(campaignId: string) {
  const rows = await db
    .select({
      id: niscEmEmail.id,
      campaignId: niscEmEmail.campaignId,
      toEmail: niscEmEmail.toEmail,
      createdAt: niscEmEmail.createdAt,
      updatedAt: niscEmEmail.updatedAt,
    })
    .from(niscEmEmail)
    .where(eq(niscEmEmail.campaignId, campaignId))
    .orderBy(desc(niscEmEmail.createdAt));

  return rows.map((r) =>
    campaignRecipientSummarySchema.parse({
      id: r.id,
      campaignId: r.campaignId,
      toEmail: r.toEmail,
      resendId: null,
      resendMessageId: null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  );
}

function mapCampaignSummary(row: {
  id: string;
  name: string;
  subject: string;
  fromEmail: string;
  status: string;
  totalRecipients: number;
  userId: string;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date | null;
  sentAt: Date | null;
}) {
  const statusUi =
    row.status === "SENT"
      ? "COMPLETED"
      : row.status === "SENDING"
        ? "SCHEDULED"
        : row.status === "PAUSED"
          ? "SCHEDULED"
          : row.status;

  return campaignSummarySchema.parse({
    id: row.id,
    name: row.name,
    subject: row.subject,
    fromEmail: row.fromEmail,
    status: statusUi as any,
    recipientCount: Number(row.totalRecipients ?? 0),
    userId: row.userId,
    teamId: row.teamId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scheduledAt: row.scheduledAt ?? null,
    sentAt: row.sentAt ?? null,
  });
}

export const niscEmailMarketingCampaignsRouter = router({
  list: protectedProcedure.input(campaignListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const conditions = [];
    if (isAgencyUserRole(userRole)) {
      // Agency-side view: list all campaigns globally.
    } else if (input.teamId) {
      const member = await assertTeamMember(input.teamId, userId, userRole);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      conditions.push(eq(niscEmCampaign.teamId, input.teamId));
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "teamId is required for customer campaign listing",
      });
    }

    if (input.status) {
      const s = input.status;
      // UI status filters are legacy: COMPLETED/FAILED/CANCELLED/DRAFT/SCHEDULED
      const dbStatuses =
        s === "COMPLETED"
          ? (["SENT"] as const)
          : s === "SCHEDULED"
            ? (["SCHEDULED", "SENDING", "PAUSED"] as const)
            : ([s] as const);
      conditions.push(inArray(niscEmCampaign.status as any, dbStatuses as any));
    }
    if (input.search) {
      conditions.push(
        or(
          ilike(niscEmCampaign.name, `%${input.search}%`),
          ilike(niscEmCampaign.subject, `%${input.search}%`),
          ilike(niscEmCampaign.status, `%${input.search}%`),
        ),
      );
    }
    // Hide only campaigns whose name is exactly "Transactional" (case-insensitive).
    // Names that contain additional words, e.g. "Transactional Welcome", are returned.
    conditions.push(sql`lower(trim(${niscEmCampaign.name})) <> 'transactional'`);

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: niscEmCampaign.id,
          name: niscEmCampaign.name,
          subject: niscEmCampaign.subject,
          fromEmail: niscEmCampaign.fromEmail,
          status: niscEmCampaign.status,
          totalRecipients: niscEmCampaign.totalRecipients,
          userId: niscEmCampaign.userId,
          teamId: niscEmCampaign.teamId,
          createdAt: niscEmCampaign.createdAt,
          updatedAt: niscEmCampaign.updatedAt,
          scheduledAt: niscEmCampaign.scheduledAt,
          sentAt: niscEmCampaign.sentAt,
        })
        .from(niscEmCampaign)
        .where(whereClause)
        .orderBy(desc(niscEmCampaign.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ value: count() }).from(niscEmCampaign).where(whereClause),
    ]);

    return campaignListResponseSchema.parse({
      campaigns: rows.map(mapCampaignSummary),
      total: Number(totalRow?.[0]?.value ?? 0),
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const row = await assertCampaignReadAccess(input.id, userId, userRole);
    const recipients = await fetchRecipients(row.id);

    return campaignDetailSchema.parse({
      ...mapCampaignSummary({
        id: row.id,
        name: row.name,
        subject: row.subject,
        fromEmail: row.fromEmail,
        status: row.status,
        totalRecipients: row.totalRecipients,
        userId: row.userId,
        teamId: row.teamId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        scheduledAt: row.scheduledAt ?? null,
        sentAt: row.sentAt ?? null,
      }),
      description: null,
      fromName: row.fromName ?? null,
      emailDomainId: row.domainId ?? null,
      htmlContent: row.htmlContent ?? null,
      textContent: row.textContent ?? null,
      recipients,
    });
  }),

  create: protectedProcedure.input(campaignCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    if (!isAgencyUserRole(userRole)) {
      if (!input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId is required for customer campaign creation",
        });
      }
      const member = await assertTeamMember(input.teamId, userId, userRole);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await assertTeamPermission({
        teamId: input.teamId,
        userId,
        userRole,
        key: "email_marketing.campaigns",
        access: "write",
      });
    }

    if (input.teamId) {
      await assertTeamHasNiscEmailMarketingSubscription(input.teamId);
    }

    if (input.emailDomainId) {
      const [domain] = await db
        .select({ id: niscEmDomain.id, status: niscEmDomain.status })
        .from(niscEmDomain)
        .where(eq(niscEmDomain.id, input.emailDomainId))
        .limit(1);
      if (!domain || domain.status !== "VERIFIED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email domain must be verified" });
      }
    }

    if (!input.htmlContent && !input.textContent) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "HTML or text content is required" });
    }

    const now = new Date();
    const campaignId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(niscEmCampaign).values({
        id: campaignId,
        teamId: input.teamId ?? null,
        userId,
        domainId: input.emailDomainId ?? null,
        audienceId: null,
        name: input.name,
        subject: input.subject,
        fromEmail: input.fromEmail,
        fromName: input.fromName ?? null,
        replyTo: null,
        htmlContent: input.htmlContent ?? null,
        textContent: input.textContent ?? null,
        status: input.scheduledAt && input.scheduledAt > now ? "SCHEDULED" : "DRAFT",
        trackingEnabled: true,
        totalRecipients: input.recipientEmails.length,
        totalSent: 0,
        scheduledAt: input.scheduledAt ?? null,
        sentAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(niscEmEmail).values(
        input.recipientEmails.map((toEmail) => ({
          id: randomUUID(),
          campaignId,
          contactId: null,
          toEmail,
          fromEmail: input.fromEmail,
          fromName: input.fromName ?? null,
          replyTo: null,
          subject: input.subject,
          htmlContent: input.htmlContent ?? null,
          textContent: input.textContent ?? null,
          sesMessageId: null,
          status: "QUEUED",
          opens: 0,
          clicks: 0,
          sentAt: null,
          deliveredAt: null,
          openedAt: null,
          clickedAt: null,
          bouncedAt: null,
          bounceType: null,
          bounceSubType: null,
          complainedAt: null,
          complaintFeedbackType: null,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        })),
      );
    });

    return { id: campaignId };
  }),

  linkOrganization: protectedProcedure
    .input(z.object({ id: z.string().min(1), teamId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const [campaign] = await db
        .select({ id: niscEmCampaign.id, teamId: niscEmCampaign.teamId })
        .from(niscEmCampaign)
        .where(eq(niscEmCampaign.id, input.id))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });

      await assertCanLinkNiscEmResource({
        role: userRole,
        currentTeamId: campaign.teamId,
        nextTeamId: input.teamId,
      });

      await db
        .update(niscEmCampaign)
        .set({ teamId: input.teamId, updatedAt: new Date() })
        .where(eq(niscEmCampaign.id, campaign.id));

      return { ok: true as const };
    }),

  send: protectedProcedure.input(campaignSendInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const campaign = await assertCampaignOwnerAccess(input.id, userId, userRole);
    const now = new Date();

    if (["SENDING", "SENT", "CANCELLED"].includes(campaign.status)) {
      return { ok: true, status: campaign.status };
    }

    const scheduledAt = campaign.scheduledAt;
    const shouldSchedule = Boolean(
      !input.immediate && scheduledAt && scheduledAt > now,
    );
    const previousStatus = campaign.status;
    const nextStatus = shouldSchedule ? "SCHEDULED" : "SENDING";

    // -------------------------------------------------------------------------
    // Two-phase send:
    //   1. Flip the campaign to SENDING/SCHEDULED so the dispatcher is allowed
    //      to claim its queued rows. We must do this BEFORE publishing to QStash
    //        otherwise QStash can fire the worker before the row-level status is
    //      committed and the dispatcher's claim query will select nothing.
    //   2. Publish the QStash job. If this fails, roll the campaign back to its
    //      previous status so the user can retry without getting stuck in
    //      SENDING/SCHEDULED with no dispatcher ever touching it.
    // -------------------------------------------------------------------------
    await db
      .update(niscEmCampaign)
      .set({
        status: nextStatus,
        updatedAt: now,
        sentAt: shouldSchedule ? null : campaign.sentAt ?? null,
      })
      .where(eq(niscEmCampaign.id, campaign.id));

    let dispatchResult: Awaited<ReturnType<typeof enqueueNiscEmDispatch>>;
    try {
      dispatchResult = await enqueueNiscEmDispatch(
        campaign.id,
        shouldSchedule ? scheduledAt : null,
      );
    } catch (err) {
      // Rollback: only if nobody else has moved the campaign since   we don't
      // want to clobber a concurrent cancel or a dispatcher that already
      // transitioned us to SENT.
      await db
        .update(niscEmCampaign)
        .set({ status: previousStatus, updatedAt: new Date() })
        .where(
          and(
            eq(niscEmCampaign.id, campaign.id),
            eq(niscEmCampaign.status, nextStatus),
          ),
        );

      const message = err instanceof Error ? err.message : "Failed to enqueue dispatch";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message,
        cause: err instanceof Error ? err : undefined,
      });
    }

    return { ok: true, qstashMessageId: dispatchResult.messageId };
  }),

  cancel: protectedProcedure.input(campaignCancelInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const campaign = await assertCampaignOwnerAccess(input.id, userId, userRole);
    if (campaign.status !== "SCHEDULED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign is not scheduled" });
    }

    const now = new Date();
    await db
      .update(niscEmCampaign)
      .set({ status: "CANCELLED", scheduledAt: null, updatedAt: now })
      .where(eq(niscEmCampaign.id, campaign.id));

    return { cancelledAt: now.toISOString() };
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    await assertCampaignOwnerAccess(input.id, userId, userRole);
    await db.delete(niscEmCampaign).where(eq(niscEmCampaign.id, input.id));
    return { ok: true };
  }),
});

