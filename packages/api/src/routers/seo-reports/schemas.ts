import { z } from "zod";

/**
 * SEO Reports API Schemas
 * Slimmed-down: report name, period, recommendations, and core metrics only.
 * No top landing pages.
 */

// ---- Enums ----
export const seoReportStatusSchema = z.enum(["DRAFT", "FINAL"]);
export type SeoReportStatus = z.infer<typeof seoReportStatusSchema>;

// ---- Helpers ----
const optStr = () => z.string().optional();

// ---- Create input ----
export const seoReportCreateInputSchema = z.object({
  teamId: z.string().optional().nullable(),
  reportName: z.string().min(1, "Report name is required"),
  reportMonth: z.string().min(1, "Month is required"),
  reportYear: z.string().min(1, "Year is required"),
  websiteUrl: optStr().nullable(),
  status: seoReportStatusSchema.optional(),
  recommendations: optStr(),

  sessions: optStr(),
  totalWebTraffic: optStr(),
  totalViews: optStr(),
  bounceRate: optStr(),
  users: optStr(),
  returningUsers: optStr(),
  eventCount: optStr(),
  conversions: optStr(),
  sessionDuration: optStr(),
  engagedSessions: optStr(),
  sessionsDesktop: optStr(),
  sessionsMobile: optStr(),
  sessionsTablet: optStr(),
  formSubmissions: optStr(),
  impressions: optStr(),
  clicks: optStr(),
});
export type SeoReportCreateInput = z.infer<typeof seoReportCreateInputSchema>;

// ---- Update input ----
export const seoReportUpdateInputSchema = seoReportCreateInputSchema.extend({
  id: z.string().min(1),
}).partial().required({ id: true });
export type SeoReportUpdateInput = z.infer<typeof seoReportUpdateInputSchema>;

// ---- List filters ----
export const seoReportListFiltersSchema = z.object({
  teamId: z.string().optional(),
  status: seoReportStatusSchema.optional(),
  reportName: z.string().optional(),
  reportYear: z.string().optional(),
  reportMonth: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});
export type SeoReportListFilters = z.infer<typeof seoReportListFiltersSchema>;

// ---- Summary (for list rows; includes key metrics for card preview) ----
export const seoReportSummarySchema = z.object({
  id: z.string(),
  reportName: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string().nullable(),
  status: seoReportStatusSchema,
  teamId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Key metrics for card summary
  sessions: z.string().nullable(),
  totalWebTraffic: z.string().nullable(),
  bounceRate: z.string().nullable(),
  impressions: z.string().nullable(),
  clicks: z.string().nullable(),
  conversions: z.string().nullable(),
});
export type SeoReportSummary = z.infer<typeof seoReportSummarySchema>;

// ---- Detail (for getById, create, update) ----
export const seoReportDetailSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  reportName: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string().nullable(),
  status: seoReportStatusSchema,
  recommendations: z.string().nullable(),

  sessions: z.string().nullable(),
  totalWebTraffic: z.string().nullable(),
  totalViews: z.string().nullable(),
  bounceRate: z.string().nullable(),
  users: z.string().nullable(),
  returningUsers: z.string().nullable(),
  eventCount: z.string().nullable(),
  conversions: z.string().nullable(),
  sessionDuration: z.string().nullable(),
  engagedSessions: z.string().nullable(),
  sessionsDesktop: z.string().nullable(),
  sessionsMobile: z.string().nullable(),
  sessionsTablet: z.string().nullable(),
  formSubmissions: z.string().nullable(),
  impressions: z.string().nullable(),
  clicks: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SeoReportDetail = z.infer<typeof seoReportDetailSchema>;

// ---- List response ----
export const seoReportListResponseSchema = z.object({
  reports: z.array(seoReportSummarySchema),
  total: z.number().int().nonnegative(),
});
export type SeoReportListResponse = z.infer<typeof seoReportListResponseSchema>;
