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
  niscEmailDomainSendTestEmailInputSchema,
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
import { sendSesRawEmail } from "../../lib/ses-client";
import { assertTeamModulePermission, assertTeamPermission } from "../../lib/team-permissions/assert";
import {
  assertCanLinkNiscEmResource,
  assertTeamHasNiscEmailMarketingSubscription,
} from "../../lib/nisc-email-marketing-billing";

async function assertTeamMember(teamId: string, userId: string, role?: string | null) {
  if (isAgencyUserRole(role)) return { id: "agency" };
  const [member] = await db
    .select({ id: teamMember.id, role: teamMember.role })
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

async function assertDomainReadAccess(domainId: string, userId: string, role: string | null | undefined) {
  if (isAgencyUserRole(role)) {
    const [domain] = await db
      .select()
      .from(niscEmDomain)
      .where(eq(niscEmDomain.id, domainId))
      .limit(1);
    if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
    return domain;
  }
  return assertDomainAccess(domainId, userId);
}

async function assertDomainOwnerAccess(
  domainId: string,
  userId: string,
  role: string | null | undefined,
) {
  const [domain] = await db
    .select()
    .from(niscEmDomain)
    .where(eq(niscEmDomain.id, domainId))
    .limit(1);
  if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
  if (!isAgencySuperAdminRole(role) && domain.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the domain creator can modify it" });
  }
  return domain;
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
    .input(z.object({ teamId: z.string().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const role = (ctx.session?.user as any)?.role as string | undefined;
      if (isAgencyUserRole(role)) {
        const rows = await db
          .select({ id: niscEmDomain.id, domainName: niscEmDomain.domainName })
          .from(niscEmDomain)
          .where(
            input.teamId
              ? and(eq(niscEmDomain.status, "VERIFIED"), eq(niscEmDomain.teamId, input.teamId))
              : eq(niscEmDomain.status, "VERIFIED"),
          )
          .orderBy(desc(niscEmDomain.createdAt))
          .limit(500);

        return { domains: rows };
      }

      if (!input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId is required for customer domain listing",
        });
      }

      const member = await assertTeamMember(input.teamId, userId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      const rows = await db
        .select({ id: niscEmDomain.id, domainName: niscEmDomain.domainName })
        .from(niscEmDomain)
        .where(
          and(eq(niscEmDomain.teamId, input.teamId), eq(niscEmDomain.status, "VERIFIED")),
        )
        .orderBy(desc(niscEmDomain.createdAt))
        .limit(500);

      return { domains: rows };
    }),

  // Legacy-compatible aliases for UI that was copied from email-marketing.
  // These return the legacy schemas but are backed by SES + nisc_em_domain.
  create: protectedProcedure.input(emailDomainCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    if (!isAgencyUserRole(userRole) && !input.teamId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "teamId is required for customer domain creation",
      });
    }
    if (input.teamId) {
      const member = await assertTeamMember(input.teamId, userId, userRole);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await assertTeamPermission({
        teamId: input.teamId,
        userId,
        userRole,
        key: "email_marketing.sending_domains",
        access: "write",
      });
      await assertTeamHasNiscEmailMarketingSubscription(input.teamId);
    }
    const teamId = input.teamId ?? null;
    const domainName = input.domainName.trim().toLowerCase();
    const detail = await addDomainCore({ userId, teamId, domainName });
    // Reload row so we can map exact DB values
    const [row] = await db.select().from(niscEmDomain).where(eq(niscEmDomain.id, detail.id)).limit(1);
    return mapToLegacyDomainDetail(row!);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    const domain = await assertDomainReadAccess(input.id, userId, userRole);
    return mapToLegacyDomainDetail(domain);
  }),

  verify: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    await assertDomainOwnerAccess(input.id, userId, userRole);
    const row = await verifyDomainCore({ userId, id: input.id });
    return mapToLegacyDomainDetail(row);
  }),

  sendTestEmail: protectedProcedure
    .input(niscEmailDomainSendTestEmailInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const domain = await assertDomainOwnerAccess(input.domainId, userId, userRole);
      if (domain.status !== "VERIFIED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain must be verified before sending test email",
        });
      }

      const ses = getSesClient();
      const timestamp = new Date().toLocaleString();
      const body = `This is a test email from nPanel - ${timestamp} to test the domain name - ${domain.domainName} verification on npanel.`;
      const fromEmail = `send@${domain.domainName}`;

      try {
        const res = await sendSesRawEmail(ses, {
          Source: fromEmail,
          Destinations: [input.to, ...(input.cc ?? []), ...(input.bcc ?? [])],
          RawMessage: {
            Data: Buffer.from(
              [
                `From: nPanel <${fromEmail}>`,
                `To: ${input.to}`,
                ...(input.cc.length ? [`Cc: ${input.cc.join(", ")}`] : []),
                "Subject: nPanel domain verification test email",
                "MIME-Version: 1.0",
                'Content-Type: text/plain; charset="UTF-8"',
                "",
                body,
                "",
              ].join("\r\n"),
              "utf8",
            ),
          },
        });

        return {
          ok: true,
          messageId: res.MessageId ?? null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send test email";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
    // Reuse remove's logic directly by calling the same code path (duplicated here for clarity).
    // (We keep the existing `remove` procedure for the new Nisc UI as well.)
    const domain = await assertDomainOwnerAccess(input.id, userId, userRole);

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
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const conditions = [];
    if (!isAgencyUserRole(userRole)) {
      if (!input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId is required for customer domain listing",
        });
      }
      const member = await assertTeamMember(input.teamId, userId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      conditions.push(eq(niscEmDomain.teamId, input.teamId));
    }
    if (input.status) conditions.push(eq(niscEmDomain.status, input.status));
    if (input.search) conditions.push(ilike(niscEmDomain.domainName, `%${input.search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;
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
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      if (!isAgencyUserRole(userRole) && !input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId is required for customer domain creation",
        });
      }
      if (input.teamId) {
        const member = await assertTeamMember(input.teamId, userId);
        if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        await assertTeamHasNiscEmailMarketingSubscription(input.teamId);
      }

      const teamId = input.teamId ?? null;
      const domainName = input.domainName.trim().toLowerCase();
      return addDomainCore({ userId, teamId, domainName });
    }),

  linkOrganization: protectedProcedure
    .input(z.object({ id: z.string().min(1), teamId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const [domain] = await db
        .select({
          id: niscEmDomain.id,
          teamId: niscEmDomain.teamId,
          domainName: niscEmDomain.domainName,
        })
        .from(niscEmDomain)
        .where(eq(niscEmDomain.id, input.id))
        .limit(1);
      if (!domain) throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });

      await assertCanLinkNiscEmResource({
        role: userRole,
        currentTeamId: domain.teamId,
        nextTeamId: input.teamId,
      });

      const [conflict] = await db
        .select({ id: niscEmDomain.id })
        .from(niscEmDomain)
        .where(
          and(eq(niscEmDomain.teamId, input.teamId), eq(niscEmDomain.domainName, domain.domainName)),
        )
        .limit(1);
      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This domain is already linked for that organization",
        });
      }

      await db
        .update(niscEmDomain)
        .set({ teamId: input.teamId, updatedAt: new Date() })
        .where(eq(niscEmDomain.id, domain.id));

      return { ok: true as const };
    }),

  verifyCheck: protectedProcedure
    .input(niscEmailDomainVerifyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const domain = await assertDomainOwnerAccess(input.id, userId, userRole);
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
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const conditions = [];
      if (!isAgencyUserRole(userRole)) {
        if (!input.teamId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "teamId is required for customer domain listing",
          });
        }
        const member = await assertTeamMember(input.teamId, userId);
        if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        conditions.push(eq(niscEmDomain.teamId, input.teamId));
      }
      if (input.status) conditions.push(eq(niscEmDomain.status, input.status));
      if (input.search) conditions.push(ilike(niscEmDomain.domainName, `%${input.search}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;

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
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const domain = await assertDomainOwnerAccess(input.id, userId, userRole);

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

