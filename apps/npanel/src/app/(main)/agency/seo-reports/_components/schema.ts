import { z } from "zod";

/**
 * SEO Reports UI Schemas
 * For data transformation and typing on the agency SEO reports page.
 */

const dateCoerce = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === "string") return new Date(val);
  return val;
}, z.date());

export const seoReportListRowSchema = z.object({
  id: z.string(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string(),
  status: z.enum(["DRAFT", "FINAL"]),
  teamId: z.string().nullable(),
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
});
export type SeoReportListRow = z.infer<typeof seoReportListRowSchema>;

export const seoReportViewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  reportMonth: z.string(),
  reportYear: z.string(),
  websiteUrl: z.string(),
  comparisonType: z.enum(["PREVIOUS_MONTH", "SAME_MONTH_LAST_YEAR", "NONE"]).nullable(),
  dataSource: z.string().nullable(),
  status: z.enum(["DRAFT", "FINAL"]),
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
  createdAt: dateCoerce,
  updatedAt: dateCoerce,
  topPages: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      pageTitle: z.string().nullable(),
      clicks: z.string().nullable(),
      impressions: z.string().nullable(),
      sessions: z.string().nullable(),
      conversions: z.string().nullable(),
      order: z.number(),
    })
  ),
});
export type SeoReportView = z.infer<typeof seoReportViewSchema>;

export const MONTH_LABELS: Record<string, string> = {
  "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
  "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};
