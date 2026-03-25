-- CreateEnum
CREATE TYPE "SeoReportComparisonType" AS ENUM ('PREVIOUS_MONTH', 'SAME_MONTH_LAST_YEAR', 'NONE');

-- CreateEnum
CREATE TYPE "SeoReportStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateTable
CREATE TABLE "seo_report" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "reportMonth" TEXT NOT NULL,
    "reportYear" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "comparisonType" "SeoReportComparisonType" DEFAULT 'NONE',
    "dataSource" TEXT,
    "status" "SeoReportStatus" NOT NULL DEFAULT 'DRAFT',
    "executiveSummary" TEXT,
    "recommendations" TEXT,
    "organicSessions" TEXT,
    "organicSessionsPrevious" TEXT,
    "organicUsers" TEXT,
    "organicUsersPrevious" TEXT,
    "organicNewUsers" TEXT,
    "bounceRate" TEXT,
    "bounceRatePrevious" TEXT,
    "avgSessionDurationSeconds" TEXT,
    "pagesPerSession" TEXT,
    "engagedSessions" TEXT,
    "organicSessionsDesktop" TEXT,
    "organicSessionsMobile" TEXT,
    "organicSessionsTablet" TEXT,
    "organicSessionsUnbranded" TEXT,
    "keywordsTracked" TEXT,
    "keywordsTop3" TEXT,
    "keywordsTop10" TEXT,
    "keywordsTop20" TEXT,
    "avgPosition" TEXT,
    "avgPositionPrevious" TEXT,
    "searchVisibility" TEXT,
    "impressions" TEXT,
    "impressionsPrevious" TEXT,
    "clicks" TEXT,
    "clicksPrevious" TEXT,
    "avgCtr" TEXT,
    "keywordsGained" TEXT,
    "keywordsLost" TEXT,
    "conversions" TEXT,
    "conversionsPrevious" TEXT,
    "conversionRate" TEXT,
    "conversionRatePrevious" TEXT,
    "conversionsFromOrganic" TEXT,
    "leadsOrFormSubmissions" TEXT,
    "costPerConversion" TEXT,
    "bestConvertingPageUrl" TEXT,
    "totalBacklinks" TEXT,
    "referringDomains" TEXT,
    "referringDomainsPrevious" TEXT,
    "newReferringDomains" TEXT,
    "lostReferringDomains" TEXT,
    "newBacklinks" TEXT,
    "lostBacklinks" TEXT,
    "dofollowBacklinks" TEXT,
    "domainRating" TEXT,
    "domainRatingPrevious" TEXT,
    "domainAuthority" TEXT,
    "domainAuthorityPrevious" TEXT,
    "urlRating" TEXT,
    "spamScore" TEXT,
    "siteAuditScore" TEXT,
    "siteAuditScorePrevious" TEXT,
    "pagesCrawled" TEXT,
    "pagesWithErrors" TEXT,
    "pagesWithErrorsPrevious" TEXT,
    "pagesWithWarnings" TEXT,
    "indexedPages" TEXT,
    "lcpMs" TEXT,
    "inpMs" TEXT,
    "cls" TEXT,
    "coreWebVitalsPassed" BOOLEAN,
    "mobileUsabilityIssues" TEXT,
    "avgPageLoadTimeMs" TEXT,
    "gmbViews" TEXT,
    "gmbSearches" TEXT,
    "gmbActions" TEXT,
    "gmbCalls" TEXT,
    "gmbDirectionRequests" TEXT,
    "gmbWebsiteClicks" TEXT,
    "gmbReviewsCount" TEXT,
    "gmbAverageRating" TEXT,
    "localRanking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_report_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "seo_report_top_page" (
    "_id" TEXT NOT NULL,
    "seoReportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageTitle" TEXT,
    "clicks" TEXT,
    "impressions" TEXT,
    "sessions" TEXT,
    "conversions" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_report_top_page_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "seo_report_activity_log" (
    "_id" TEXT NOT NULL,
    "seoReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_report_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "seo_report_userId_idx" ON "seo_report"("userId");

-- CreateIndex
CREATE INDEX "seo_report_teamId_idx" ON "seo_report"("teamId");

-- CreateIndex
CREATE INDEX "seo_report_reportYear_reportMonth_idx" ON "seo_report"("reportYear", "reportMonth");

-- CreateIndex
CREATE INDEX "seo_report_websiteUrl_idx" ON "seo_report"("websiteUrl");

-- CreateIndex
CREATE INDEX "seo_report_status_idx" ON "seo_report"("status");

-- CreateIndex
CREATE INDEX "seo_report_createdAt_idx" ON "seo_report"("createdAt");

-- CreateIndex
CREATE INDEX "seo_report_teamId_reportYear_reportMonth_idx" ON "seo_report"("teamId", "reportYear", "reportMonth");

-- CreateIndex
CREATE INDEX "seo_report_top_page_seoReportId_idx" ON "seo_report_top_page"("seoReportId");

-- CreateIndex
CREATE INDEX "seo_report_top_page_order_idx" ON "seo_report_top_page"("order");

-- CreateIndex
CREATE INDEX "seo_report_activity_log_seoReportId_idx" ON "seo_report_activity_log"("seoReportId");

-- CreateIndex
CREATE INDEX "seo_report_activity_log_userId_idx" ON "seo_report_activity_log"("userId");

-- CreateIndex
CREATE INDEX "seo_report_activity_log_action_idx" ON "seo_report_activity_log"("action");

-- CreateIndex
CREATE INDEX "seo_report_activity_log_createdAt_idx" ON "seo_report_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "seo_report" ADD CONSTRAINT "seo_report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_report" ADD CONSTRAINT "seo_report_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_report_top_page" ADD CONSTRAINT "seo_report_top_page_seoReportId_fkey" FOREIGN KEY ("seoReportId") REFERENCES "seo_report"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_report_activity_log" ADD CONSTRAINT "seo_report_activity_log_seoReportId_fkey" FOREIGN KEY ("seoReportId") REFERENCES "seo_report"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
