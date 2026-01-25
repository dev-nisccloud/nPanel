import { z } from "zod";

/**
 * SEO Reports API Schemas
 * Independent from DB/Prisma. Used for input validation and output shaping.
 */

// ---- Enums ----
export const seoReportComparisonTypeSchema = z.enum([
  "PREVIOUS_MONTH",
  "SAME_MONTH_LAST_YEAR",
  "NONE",
]);
export type SeoReportComparisonType = z.infer<typeof seoReportComparisonTypeSchema>;

export const seoReportStatusSchema = z.enum(["DRAFT", "FINAL"]);
export type SeoReportStatus = z.infer<typeof seoReportStatusSchema>;

// ---- Helpers ----
const optStr = () => z.string().optional();
const optStrNullable = () => z.string().optional().nullable();

// ---- Top Page ----
export const seoReportTopPageInputSchema = z.object({
  url: z.string().min(1),
  pageTitle: optStr(),
  clicks: optStr(),
  impressions: optStr(),
  sessions: optStr(),
  conversions: optStr(),
  order: z.number().int().min(0).optional(),
});
export type SeoReportTopPageInput = z.infer<typeof seoReportTopPageInputSchema>;

export const seoReportTopPageOutputSchema = z.object({
  id: z.string(),
  seoReportId: z.string(),
  url: z.string(),
  pageTitle: z.string().nullable(),
  clicks: z.string().nullable(),
  impressions: z.string().nullable(),
  sessions: z.string().nullable(),
  conversions: z.string().nullable(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SeoReportTopPageOutput = z.infer<typeof seoReportTopPageOutputSchema>;

// ---- Create input: only period + website required; rest optional ----
export const seoReportCreateInputSchema = z.object({
  teamId: z.string().optional().nullable(),
  reportMonth: z.string().min(1, "Month is required"),
  reportYear: z.string().min(1, "Year is required"),
  websiteUrl: z.string().min(1, "Website is required"),
  comparisonType: seoReportComparisonTypeSchema.optional(),
  dataSource: optStr(),
  status: seoReportStatusSchema.optional(),
  executiveSummary: optStr(),
  recommendations: optStr(),

  organicSessions: optStr(),
  organicSessionsPrevious: optStr(),
  organicUsers: optStr(),
  organicUsersPrevious: optStr(),
  organicNewUsers: optStr(),
  bounceRate: optStr(),
  bounceRatePrevious: optStr(),
  avgSessionDurationSeconds: optStr(),
  pagesPerSession: optStr(),
  engagedSessions: optStr(),
  organicSessionsDesktop: optStr(),
  organicSessionsMobile: optStr(),
  organicSessionsTablet: optStr(),
  organicSessionsUnbranded: optStr(),

  keywordsTracked: optStr(),
  keywordsTop3: optStr(),
  keywordsTop10: optStr(),
  keywordsTop20: optStr(),
  avgPosition: optStr(),
  avgPositionPrevious: optStr(),
  searchVisibility: optStr(),
  impressions: optStr(),
  impressionsPrevious: optStr(),
  clicks: optStr(),
  clicksPrevious: optStr(),
  avgCtr: optStr(),
  keywordsGained: optStr(),
  keywordsLost: optStr(),

  conversions: optStr(),
  conversionsPrevious: optStr(),
  conversionRate: optStr(),
  conversionRatePrevious: optStr(),
  conversionsFromOrganic: optStr(),
  leadsOrFormSubmissions: optStr(),
  costPerConversion: optStr(),
  bestConvertingPageUrl: optStr(),

  totalBacklinks: optStr(),
  referringDomains: optStr(),
  referringDomainsPrevious: optStr(),
  newReferringDomains: optStr(),
  lostReferringDomains: optStr(),
  newBacklinks: optStr(),
  lostBacklinks: optStr(),
  dofollowBacklinks: optStr(),
  domainRating: optStr(),
  domainRatingPrevious: optStr(),
  domainAuthority: optStr(),
  domainAuthorityPrevious: optStr(),
  urlRating: optStr(),
  spamScore: optStr(),

  siteAuditScore: optStr(),
  siteAuditScorePrevious: optStr(),
  pagesCrawled: optStr(),
  pagesWithErrors: optStr(),
  pagesWithErrorsPrevious: optStr(),
  pagesWithWarnings: optStr(),
  indexedPages: optStr(),
  lcpMs: optStr(),
  inpMs: optStr(),
  cls: optStr(),
  coreWebVitalsPassed: z.boolean().optional().nullable(),
  mobileUsabilityIssues: optStr(),
  avgPageLoadTimeMs: optStr(),

  gmbViews: optStr(),
  gmbSearches: optStr(),
  gmbActions: optStr(),
  gmbCalls: optStr(),
  gmbDirectionRequests: optStr(),
  gmbWebsiteClicks: optStr(),
  gmbReviewsCount: optStr(),
  gmbAverageRating: optStr(),
  localRanking: optStr(),

  topPages: z.array(seoReportTopPageInputSchema).optional().default([]),
});
export type SeoReportCreateInput = z.infer<typeof seoReportCreateInputSchema>;

// ---- Update input: id required, rest partial ----
export const seoReportUpdateInputSchema = seoReportCreateInputSchema.extend({
  id: z.string().min(1),
}).partial().required({ id: true });
export type SeoReportUpdateInput = z.infer<typeof seoReportUpdateInputSchema>;

// ---- List ----
export const seoReportListFiltersSchema = z.object({
  teamId: z.string().optional(),
  status: seoReportStatusSchema.optional(),
  websiteUrl: z.string().optional(),
  reportYear: z.string().optional(),
  reportMonth: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});
export type SeoReportListFilters = z.infer<typeof seoReportListFiltersSchema>;

// ---- Summary (for list rows) ----
export const seoReportSummarySchema = z.object({
  id: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string(),
  status: seoReportStatusSchema,
  teamId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SeoReportSummary = z.infer<typeof seoReportSummarySchema>;

// ---- Detail (for getById, create, update) ----
export const seoReportDetailSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string(),
  comparisonType: seoReportComparisonTypeSchema.nullable(),
  dataSource: z.string().nullable(),
  status: seoReportStatusSchema,
  executiveSummary: z.string().nullable(),
  recommendations: z.string().nullable(),

  organicSessions: z.string().nullable(),
  organicSessionsPrevious: z.string().nullable(),
  organicUsers: z.string().nullable(),
  organicUsersPrevious: z.string().nullable(),
  organicNewUsers: z.string().nullable(),
  bounceRate: z.string().nullable(),
  bounceRatePrevious: z.string().nullable(),
  avgSessionDurationSeconds: z.string().nullable(),
  pagesPerSession: z.string().nullable(),
  engagedSessions: z.string().nullable(),
  organicSessionsDesktop: z.string().nullable(),
  organicSessionsMobile: z.string().nullable(),
  organicSessionsTablet: z.string().nullable(),
  organicSessionsUnbranded: z.string().nullable(),

  keywordsTracked: z.string().nullable(),
  keywordsTop3: z.string().nullable(),
  keywordsTop10: z.string().nullable(),
  keywordsTop20: z.string().nullable(),
  avgPosition: z.string().nullable(),
  avgPositionPrevious: z.string().nullable(),
  searchVisibility: z.string().nullable(),
  impressions: z.string().nullable(),
  impressionsPrevious: z.string().nullable(),
  clicks: z.string().nullable(),
  clicksPrevious: z.string().nullable(),
  avgCtr: z.string().nullable(),
  keywordsGained: z.string().nullable(),
  keywordsLost: z.string().nullable(),

  conversions: z.string().nullable(),
  conversionsPrevious: z.string().nullable(),
  conversionRate: z.string().nullable(),
  conversionRatePrevious: z.string().nullable(),
  conversionsFromOrganic: z.string().nullable(),
  leadsOrFormSubmissions: z.string().nullable(),
  costPerConversion: z.string().nullable(),
  bestConvertingPageUrl: z.string().nullable(),

  totalBacklinks: z.string().nullable(),
  referringDomains: z.string().nullable(),
  referringDomainsPrevious: z.string().nullable(),
  newReferringDomains: z.string().nullable(),
  lostReferringDomains: z.string().nullable(),
  newBacklinks: z.string().nullable(),
  lostBacklinks: z.string().nullable(),
  dofollowBacklinks: z.string().nullable(),
  domainRating: z.string().nullable(),
  domainRatingPrevious: z.string().nullable(),
  domainAuthority: z.string().nullable(),
  domainAuthorityPrevious: z.string().nullable(),
  urlRating: z.string().nullable(),
  spamScore: z.string().nullable(),

  siteAuditScore: z.string().nullable(),
  siteAuditScorePrevious: z.string().nullable(),
  pagesCrawled: z.string().nullable(),
  pagesWithErrors: z.string().nullable(),
  pagesWithErrorsPrevious: z.string().nullable(),
  pagesWithWarnings: z.string().nullable(),
  indexedPages: z.string().nullable(),
  lcpMs: z.string().nullable(),
  inpMs: z.string().nullable(),
  cls: z.string().nullable(),
  coreWebVitalsPassed: z.boolean().nullable(),
  mobileUsabilityIssues: z.string().nullable(),
  avgPageLoadTimeMs: z.string().nullable(),

  gmbViews: z.string().nullable(),
  gmbSearches: z.string().nullable(),
  gmbActions: z.string().nullable(),
  gmbCalls: z.string().nullable(),
  gmbDirectionRequests: z.string().nullable(),
  gmbWebsiteClicks: z.string().nullable(),
  gmbReviewsCount: z.string().nullable(),
  gmbAverageRating: z.string().nullable(),
  localRanking: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
  topPages: z.array(seoReportTopPageOutputSchema),
});
export type SeoReportDetail = z.infer<typeof seoReportDetailSchema>;

// ---- List response ----
export const seoReportListResponseSchema = z.object({
  reports: z.array(seoReportSummarySchema),
  total: z.number().int().nonnegative(),
});
export type SeoReportListResponse = z.infer<typeof seoReportListResponseSchema>;
