import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@nPanel/db";
import { protectedProcedure, router, type Context } from "../../trpc";
import {
  seoReportCreateInputSchema,
  seoReportDetailSchema,
  seoReportListFiltersSchema,
  seoReportListResponseSchema,
  seoReportSummarySchema,
  seoReportUpdateInputSchema,
} from "./schemas";
import type { SeoReportDetail } from "./schemas";

async function getAuthenticatedUser(ctx: Context) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
  }
  const sessionRole = (user as { role?: string })?.role;
  if (sessionRole) return { id: user.id, role: sessionRole };
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
  }
  return { id: dbUser.id, role: dbUser.role as string };
}

const isAgencyUser = (role: string) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

function str(val: unknown): string | null {
  if (val == null || val === "") return null;
  return typeof val === "string" ? val : String(val);
}

async function ensureAccess(userId: string, role: string, report: { userId: string; teamId: string | null }) {
  if (isAgencyUser(role)) return;
  if (report.userId === userId) return;
  if (report.teamId) {
    const m = await prisma.teamMember.findFirst({
      where: { teamId: report.teamId, userId },
      select: { id: true },
    });
    if (m) return;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this report." });
}

function buildReportData(
  input: z.infer<typeof seoReportCreateInputSchema>,
  overwrite: { userId: string; teamId?: string | null }
) {
  const o: Record<string, unknown> = {
    ...overwrite,
    reportName: input.reportName,
    reportMonth: input.reportMonth,
    reportYear: input.reportYear,
    websiteUrl: str(input.websiteUrl),
    status: input.status ?? "DRAFT",
    recommendations: str(input.recommendations),

    sessions: str(input.sessions),
    totalWebTraffic: str(input.totalWebTraffic),
    totalViews: str(input.totalViews),
    bounceRate: str(input.bounceRate),
    users: str(input.users),
    returningUsers: str(input.returningUsers),
    eventCount: str(input.eventCount),
    conversions: str(input.conversions),
    sessionDuration: str(input.sessionDuration),
    engagedSessions: str(input.engagedSessions),
    sessionsDesktop: str(input.sessionsDesktop),
    sessionsMobile: str(input.sessionsMobile),
    sessionsTablet: str(input.sessionsTablet),
    formSubmissions: str(input.formSubmissions),
    impressions: str(input.impressions),
    clicks: str(input.clicks),
  };
  return o as Record<string, string | null>;
}

function mapToDetail(r: {
  id: string;
  userId: string;
  teamId: string | null;
  reportName: string;
  reportMonth: string;
  reportYear: string;
  websiteUrl: string | null;
  status: string;
  recommendations: string | null;
  sessions: string | null;
  totalWebTraffic: string | null;
  totalViews: string | null;
  bounceRate: string | null;
  users: string | null;
  returningUsers: string | null;
  eventCount: string | null;
  conversions: string | null;
  sessionDuration: string | null;
  engagedSessions: string | null;
  sessionsDesktop: string | null;
  sessionsMobile: string | null;
  sessionsTablet: string | null;
  formSubmissions: string | null;
  impressions: string | null;
  clicks: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SeoReportDetail {
  return seoReportDetailSchema.parse(r);
}

export const seoReportsRouter = router({
  list: protectedProcedure
    .input(seoReportListFiltersSchema)
    .output(seoReportListResponseSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const filters: Record<string, unknown>[] = [];

      if (!isAgencyUser(user.role)) {
        const memberships = await prisma.teamMember.findMany({
          where: { userId: user.id },
          select: { teamId: true },
        });
        const teamIds = memberships.map((m) => m.teamId);
        filters.push({
          OR: [
            { userId: user.id },
            ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
          ],
        });
      }

      if (input.teamId) filters.push({ teamId: input.teamId });
      if (input.status) filters.push({ status: input.status });
      if (input.reportName) filters.push({ reportName: { contains: input.reportName, mode: "insensitive" } });
      if (input.reportYear) filters.push({ reportYear: input.reportYear });
      if (input.reportMonth) filters.push({ reportMonth: input.reportMonth });
      if (input.search?.trim()) {
        const q = input.search.trim();
        filters.push({
          OR: [
            { reportName: { contains: q, mode: "insensitive" } },
            { reportYear: { contains: q, mode: "insensitive" } },
            { reportMonth: { contains: q, mode: "insensitive" } },
            { websiteUrl: { contains: q, mode: "insensitive" } },
          ],
        });
      }

      const where = filters.length ? { AND: filters } : undefined;

      const [reports, total] = await Promise.all([
        prisma.seoReport.findMany({
          where,
          orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { createdAt: "desc" }],
          skip: input.offset,
          take: input.limit,
          select: {
            id: true,
            reportName: true,
            reportMonth: true,
            reportYear: true,
            websiteUrl: true,
            status: true,
            teamId: true,
            createdAt: true,
            updatedAt: true,
            sessions: true,
            totalWebTraffic: true,
            bounceRate: true,
            impressions: true,
            clicks: true,
            conversions: true,
          },
        }),
        prisma.seoReport.count({ where }),
      ]);

      return {
        reports: reports.map((r) => seoReportSummarySchema.parse(r)),
        total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(seoReportDetailSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const r = await prisma.seoReport.findUnique({
        where: { id: input.id },
      });
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, r);
      return mapToDetail(r);
    }),

  create: protectedProcedure
    .input(seoReportCreateInputSchema)
    .output(seoReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const id = crypto.randomUUID();
      const data = buildReportData(input, { userId: user.id, teamId: input.teamId ?? null });

      await prisma.$transaction(async (tx) => {
        await tx.seoReport.create({
          data: {
            id,
            ...data,
          } as Parameters<typeof tx.seoReport.create>[0]["data"],
        });
        await tx.seoReportActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            seoReportId: id,
            userId: user.id,
            action: "CREATE",
            description: "Created SEO report",
            createdAt: new Date(),
          },
        });
      });

      const created = await prisma.seoReport.findUnique({
        where: { id },
      });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report not found after create." });
      return mapToDetail(created);
    }),

  update: protectedProcedure
    .input(seoReportUpdateInputSchema)
    .output(seoReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const existing = await prisma.seoReport.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, teamId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, existing);

      const { id, ...rest } = input;
      const full = { reportName: "", reportMonth: "", reportYear: "", ...rest } as z.infer<typeof seoReportCreateInputSchema>;
      const data = buildReportData(full, { userId: existing.userId });
      const updatePayload: Record<string, unknown> = {};
      if (Object.prototype.hasOwnProperty.call(rest, "teamId")) {
        updatePayload.teamId = rest.teamId ?? null;
      }
      for (const k of Object.keys(rest) as (keyof typeof rest)[]) {
        if (k === "teamId") continue;
        if (Object.prototype.hasOwnProperty.call(rest, k) && (rest as Record<string, unknown>)[k] !== undefined) {
          updatePayload[k] = (data as Record<string, unknown>)[k];
        }
      }

      await prisma.$transaction(async (tx) => {
        if (Object.keys(updatePayload).length > 0) {
          await tx.seoReport.update({
            where: { id },
            data: updatePayload as Parameters<typeof tx.seoReport.update>[0]["data"],
          });
        }
        await tx.seoReportActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            seoReportId: id,
            userId: user.id,
            action: "UPDATE",
            description: "Updated SEO report",
            createdAt: new Date(),
          },
        });
      });

      const updated = await prisma.seoReport.findUnique({
        where: { id },
      });
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report not found after update." });
      return mapToDetail(updated);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const existing = await prisma.seoReport.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, teamId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, existing);
      await prisma.seoReport.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
