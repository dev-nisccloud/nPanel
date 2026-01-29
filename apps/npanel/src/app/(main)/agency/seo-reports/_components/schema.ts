import { z } from "zod";

/**
 * SEO Reports UI Schemas
 * Slimmed-down: report name, period, recommendations, and core metrics only.
 */

const dateCoerce = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === "string") return new Date(val);
  return val;
}, z.date());

export const seoReportListRowSchema = z.object({
  id: z.string(),
  reportName: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string().nullable(),
  status: z.enum(["DRAFT", "FINAL"]),
  teamId: z.string().nullable(),
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
  sessions: z.string().nullable().optional(),
  totalWebTraffic: z.string().nullable().optional(),
  bounceRate: z.string().nullable().optional(),
  impressions: z.string().nullable().optional(),
  clicks: z.string().nullable().optional(),
  conversions: z.string().nullable().optional(),
});
export type SeoReportListRow = z.infer<typeof seoReportListRowSchema>;

export const seoReportViewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  reportName: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string().nullable(),
  status: z.enum(["DRAFT", "FINAL"]),
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
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
});
export type SeoReportView = z.infer<typeof seoReportViewSchema>;

export const MONTH_LABELS: Record<string, string> = {
  "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
  "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};
