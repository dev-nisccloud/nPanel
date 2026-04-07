import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { niscEmDomain, niscEmCampaign } from "@npanel/db/schema";
import { randomUUID } from "node:crypto";
import { getSesClient, buildEasyDkimDnsRecords, type DnsRecord } from "../../lib/ses-client";
import {
  niscEmailDomainCreateInputSchema,
  niscEmailDomainDetailSchema,
  niscEmailDomainListFiltersSchema,
  niscEmailDomainListResponseSchema,
  niscEmailDomainSummarySchema,
  niscEmailDomainVerifyInputSchema,
} from "./schemas";
import {
  emailDomainCreateInputSchema,
  emailDomainDetailSchema,
  emailDomainListFiltersSchema,
  emailDomainListResponseSchema,
  emailDomainSummarySchema,
} from "../email-marketing/schemas";

async function assertTeamMember(teamId: string, userId: string) {
  const [member] = await db
    .select({ id: teamMember.id, role: teamMember.role })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  return member ?? null;
}

async function assertDomainAccess(domainId: string, userId: string) {
  const [domain] = await db
    .select()
    .from(niscEmDomain)
    .where(eq(niscEmDomain.id, domainId))
    .limit(1);

  if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });

  // User-owned domain
  if (domain.userId === userId) return domain;

  // Team-owned domain
  if (domain.teamId) {
    const member = await assertTeamMember(domain.teamId, userId);
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return domain;
  }

  throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

function mapDkimStatusToDb(status: string | undefined): {
  dkimStatus: "Pending" | "Success" | "Failed" | "TemporaryFailure" | "NotStarted";
  domainStatus: "PENDING" | "VERIFIED" | "FAILED";
} {
  const s = status ?? "NotStarted";
  if (s === "Success") return { dkimStatus: "Success", domainStatus: "VERIFIED" };
  if (s === "Failed") return { dkimStatus: "Failed", domainStatus: "FAILED" };
  if (s === "TemporaryFailure") return { dkimStatus: "TemporaryFailure", domainStatus: "PENDING" };
  if (s === "Pending") return { dkimStatus: "Pending", domainStatus: "PENDING" };
  return { dkimStatus: "NotStarted", domainStatus: "PENDING" };
}

function buildDetailFromDomainRow(domain: typeof niscEmDomain.$inferSelect) {
  return niscEmailDomainDetailSchema.parse({
    ...domain,
    dkimTokens: domain.dkimTokens ?? [],
    dnsRecords: domain.dnsRecords ?? [],
    mailFromDomain: domain.mailFromDomain ?? null,
    feedbackForwardingDisabled: domain.feedbackForwardingDisabled,
  });
}

function mapToLegacyDomainSummary(domain: typeof niscEmDomain.$inferSelect) {
  return emailDomainSummarySchema.parse({
    id: domain.id,
    domainName: domain.domainName,
    status: domain.status as any,
    resendDomainId: null,
    userId: domain.userId,
    teamId: domain.teamId ?? null,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    verifiedAt: domain.verifiedAt ?? null,
  });
}

function mapToLegacyDomainDetail(domain: typeof niscEmDomain.$inferSelect) {
  return emailDomainDetailSchema.parse({
    ...mapToLegacyDomainSummary(domain),
    verificationStatus: domain.dkimStatus ?? null,
    verificationData: null,
    dnsRecords: (domain.dnsRecords as unknown) ?? null,
  });
}

async function verifyDomainCore(params: { userId: string; id: string }) {
  const domain = await assertDomainAccess(params.id, params.userId);
  const ses = getSesClient();

  const attrs = await ses.getIdentityDkimAttributes({ Identities: [domain.domainName] });
  const entries = Object.entries(attrs.DkimAttributes ?? {});
  const first = entries[0];

  const awsDkimStatusRaw = first?.[1]?.DkimVerificationStatus;
  const mapped = mapDkimStatusToDb(awsDkimStatusRaw);

  const dkimTokens = first?.[1]?.DkimTokens ?? (domain.dkimTokens ?? []);
  const dnsRecords: DnsRecord[] = buildEasyDkimDnsRecords(domain.domainName, dkimTokens);

  const now = new Date();
  const newVerifiedAt = mapped.domainStatus === "VERIFIED" ? domain.verifiedAt ?? now : null;

  if (mapped.domainStatus === "VERIFIED" && !domain.feedbackForwardingDisabled) {
    try {
      await ses.setIdentityFeedbackForwardingEnabled({
        Identity: domain.domainName,
        ForwardingEnabled: false,
      });
    } catch {
      // ignore
    }
  }

  const updated = await db.transaction(async (tx) => {
    await tx
      .update(niscEmDomain)
      .set({
        status: mapped.domainStatus,
        dkimStatus: mapped.dkimStatus,
        dkimTokens,
        dnsRecords,
        verifiedAt: newVerifiedAt,
        feedbackForwardingDisabled:
          mapped.domainStatus === "VERIFIED" ? true : domain.feedbackForwardingDisabled,
        updatedAt: now,
      })
      .where(eq(niscEmDomain.id, domain.id));

    const [row] = await tx.select().from(niscEmDomain).where(eq(niscEmDomain.id, domain.id)).limit(1);
    return row!;
  });

  return updated;
}

async function addDomainCore(params: {
  userId: string;
  teamId: string | null;
  domainName: string;
}) {
  const { userId, teamId, domainName } = params;
  if (!domainName) throw new TRPCError({ code: "BAD_REQUEST", message: "Domain name is required" });

  if (teamId) {
    const [existing] = await db
      .select({ id: niscEmDomain.id })
      .from(niscEmDomain)
      .where(and(eq(niscEmDomain.teamId, teamId), eq(niscEmDomain.domainName, domainName)))
      .limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Domain already exists for this team" });
  } else {
    const [existing] = await db
      .select({ id: niscEmDomain.id })
      .from(niscEmDomain)
      .where(and(eq(niscEmDomain.userId, userId), eq(niscEmDomain.domainName, domainName)))
      .limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Domain already exists for this user" });
  }

  const ses = getSesClient();
  let dkimTokens: string[] = [];
  try {
    const dkimRes = await ses.verifyDomainDkim({ Domain: domainName });
    dkimTokens = dkimRes.DkimTokens ?? [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown SES error";
    throw new TRPCError({ code: "BAD_REQUEST", message: `SES DKIM verify failed: ${message}` });
  }

  const dnsRecords: DnsRecord[] = buildEasyDkimDnsRecords(domainName, dkimTokens);
  const now = new Date();
  const domainId = randomUUID();

  const created = await db.transaction(async (tx) => {
    await tx.insert(niscEmDomain).values({
      id: domainId,
      userId,
      teamId,
      domainName,
      status: "PENDING",
      dkimStatus: "NotStarted",
      dkimTokens,
      mailFromMode: "DEFAULT",
      mailFromDomain: null,
      mailFromStatus: null,
      dnsRecords,
      feedbackForwardingDisabled: false,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await tx
      .select()
      .from(niscEmDomain)
      .where(eq(niscEmDomain.id, domainId))
      .limit(1);

    return row!;
  });

  return buildDetailFromDomainRow(created);
}

export const niscEmailMarketingDomainsRouter = router({
  /**
   * Agency-only helper: list all VERIFIED domains in DB (no team filter).
   * Used by agency-side campaign creation dropdown.
   */
  listAllVerified: protectedProcedure
    .input(z.object({}).default({}))
    .query(async ({ ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const role = (ctx.session?.user as any)?.role as string | undefined;
      if (role !== "AGENCY_ADMIN" && role !== "AGENCY_SUPER_ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to list all domains" });
      }

      const rows = await db
        .select({ id: niscEmDomain.id, domainName: niscEmDomain.domainName })
        .from(niscEmDomain)
        .where(eq(niscEmDomain.status, "VERIFIED"))
        .orderBy(desc(niscEmDomain.createdAt))
        .limit(500);

      return { domains: rows };
    }),

  // Legacy-compatible aliases for UI that was copied from email-marketing.
  // These return the legacy schemas but are backed by SES + nisc_em_domain.
  create: protectedProcedure.input(emailDomainCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    const teamId = input.teamId ?? null;
    const domainName = input.domainName.trim().toLowerCase();
    const detail = await addDomainCore({ userId, teamId, domainName });
    // Reload row so we can map exact DB values
    const [row] = await db.select().from(niscEmDomain).where(eq(niscEmDomain.id, detail.id)).limit(1);
    return mapToLegacyDomainDetail(row!);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    const domain = await assertDomainAccess(input.id, userId);
    return mapToLegacyDomainDetail(domain);
  }),

  verify: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    const row = await verifyDomainCore({ userId, id: input.id });
    return mapToLegacyDomainDetail(row);
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    // Reuse remove's logic directly by calling the same code path (duplicated here for clarity).
    // (We keep the existing `remove` procedure for the new NISC UI as well.)
    const domain = await assertDomainAccess(input.id, userId);

    if (domain.teamId) {
      const member = await assertTeamMember(domain.teamId, userId);
      if (!member || member.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only team owners can delete this domain" });
      }
    } else {
      if (domain.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }

    const [campaignCountRes] = await db
      .select({ value: count() })
      .from(niscEmCampaign)
      .where(eq(niscEmCampaign.domainId, domain.id));
    const campaignCount = Number(campaignCountRes?.value ?? 0);
    if (campaignCount > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Cannot delete domain that is referenced by campaigns" });
    }

    const [domainCountRes] = await db
      .select({ value: count() })
      .from(niscEmDomain)
      .where(eq(niscEmDomain.domainName, domain.domainName));
    const domainCount = Number(domainCountRes?.value ?? 0);

    const ses = getSesClient();
    if (domainCount <= 1) {
      try {
        await ses.deleteIdentity({ Identity: domain.domainName });
      } catch {
        // ignore
      }
    }

    await db.delete(niscEmDomain).where(eq(niscEmDomain.id, domain.id));
    return { ok: true };
  }),

  listLegacy: protectedProcedure.input(emailDomainListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const accessOr = [eq(niscEmDomain.userId, userId)];
    if (input.teamId) {
      accessOr.push(
        sql`(${niscEmDomain.teamId} = ${input.teamId} AND EXISTS (select 1 from ${teamMember} tm where tm.team_id = ${input.teamId} and tm.user_id = ${userId}))`,
      );
    }

    const conditions = [or(...accessOr)];
    if (input.status) conditions.push(eq(niscEmDomain.status, input.status));
    if (input.search) conditions.push(ilike(niscEmDomain.domainName, `%${input.search}%`));

    const whereClause = and(...conditions);
    const [domains, totalRes] = await Promise.all([
      db
        .select()
        .from(niscEmDomain)
        .where(whereClause)
        .orderBy(desc(niscEmDomain.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ value: count() }).from(niscEmDomain).where(whereClause),
    ]);

    const total = Number(totalRes[0]?.value ?? 0);
    return emailDomainListResponseSchema.parse({
      domains: domains.map(mapToLegacyDomainSummary),
      total,
    });
  }),

  add: protectedProcedure
    .input(niscEmailDomainCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const teamId = input.teamId ?? null;
      const domainName = input.domainName.trim().toLowerCase();
      return addDomainCore({ userId, teamId, domainName });
    }),

  verifyCheck: protectedProcedure
    .input(niscEmailDomainVerifyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const domain = await assertDomainAccess(input.id, userId);
      const ses = getSesClient();

      const attrs = await ses.getIdentityDkimAttributes({ Identities: [domain.domainName] });
      const entries = Object.entries(attrs.DkimAttributes ?? {});
      const first = entries[0];

      const awsDkimStatusRaw = first?.[1]?.DkimVerificationStatus;
      const mapped = mapDkimStatusToDb(awsDkimStatusRaw);

      const dkimTokens = first?.[1]?.DkimTokens ?? (domain.dkimTokens ?? []);
      const dnsRecords: DnsRecord[] = buildEasyDkimDnsRecords(domain.domainName, dkimTokens);

      const now = new Date();
      const newVerifiedAt = mapped.domainStatus === "VERIFIED" ? domain.verifiedAt ?? now : null;

      // Disable feedback forwarding once verified (idempotent-ish)
      if (mapped.domainStatus === "VERIFIED" && !domain.feedbackForwardingDisabled) {
        try {
          await ses.setIdentityFeedbackForwardingEnabled({
            Identity: domain.domainName,
            ForwardingEnabled: false,
          });
        } catch {
          // Not fatal for the verify-check endpoint; just means later bounces/complaints might not flow as expected.
        }
      }

      const updated = await db.transaction(async (tx) => {
        await tx
          .update(niscEmDomain)
          .set({
            status: mapped.domainStatus,
            dkimStatus: mapped.dkimStatus,
            dkimTokens,
            dnsRecords,
            verifiedAt: newVerifiedAt,
            feedbackForwardingDisabled:
              mapped.domainStatus === "VERIFIED" ? true : domain.feedbackForwardingDisabled,
            updatedAt: now,
          })
          .where(eq(niscEmDomain.id, domain.id));

        const [row] = await tx
          .select()
          .from(niscEmDomain)
          .where(eq(niscEmDomain.id, domain.id))
          .limit(1);

        return row!;
      });

      return buildDetailFromDomainRow(updated);
    }),

  list: protectedProcedure
    .input(niscEmailDomainListFiltersSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const accessOr = [eq(niscEmDomain.userId, userId)];
      if (input.teamId) {
        accessOr.push(
          sql`(${niscEmDomain.teamId} = ${input.teamId} AND EXISTS (select 1 from ${teamMember} tm where tm.team_id = ${input.teamId} and tm.user_id = ${userId}))`,
        );
      }

      const conditions = [or(...accessOr)];
      if (input.status) conditions.push(eq(niscEmDomain.status, input.status));
      if (input.search) conditions.push(ilike(niscEmDomain.domainName, `%${input.search}%`));

      const whereClause = and(...conditions);

      const [domains, totalRes] = await Promise.all([
        db
          .select()
          .from(niscEmDomain)
          .where(whereClause)
          .orderBy(desc(niscEmDomain.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ value: count() }).from(niscEmDomain).where(whereClause),
      ]);

      const total = Number(totalRes[0]?.value ?? 0);
      return niscEmailDomainListResponseSchema.parse({
        domains: domains.map((d) =>
          niscEmailDomainSummarySchema.parse({
            ...d,
            // Normalize optional fields
            teamId: d.teamId ?? null,
          }),
        ),
        total,
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const domain = await assertDomainAccess(input.id, userId);

      // Ownership enforcement: user-owned domains can be deleted by their owner;
      // team-owned domains require OWNER role.
      if (domain.teamId) {
        const member = await assertTeamMember(domain.teamId, userId);
        if (!member || member.role !== "OWNER") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only team owners can delete this domain" });
        }
      } else {
        if (domain.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const [campaignCountRes] = await db
        .select({ value: count() })
        .from(niscEmCampaign)
        .where(eq(niscEmCampaign.domainId, domain.id));

      const campaignCount = Number(campaignCountRes?.value ?? 0);
      if (campaignCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete domain that is referenced by campaigns",
        });
      }

      const [domainCountRes] = await db
        .select({ value: count() })
        .from(niscEmDomain)
        .where(eq(niscEmDomain.domainName, domain.domainName));
      const domainCount = Number(domainCountRes?.value ?? 0);

      const ses = getSesClient();
      if (domainCount <= 1) {
        try {
          await ses.deleteIdentity({ Identity: domain.domainName });
        } catch {
          // Cleanup in SES is best-effort.
        }
      }

      await db.delete(niscEmDomain).where(eq(niscEmDomain.id, domain.id));
      return { success: true };
    }),
});

