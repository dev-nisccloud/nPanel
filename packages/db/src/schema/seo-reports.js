import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// --- SeoReport ---------------------------------------------------------------
// Parity: previous_codebase/
export const seoReport = pgTable("seo_report", {
    id: text("_id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    reportName: text("report_name").default("").notNull(),
    reportMonth: text("report_month").notNull(),
    reportYear: text("report_year").notNull(),
    websiteUrl: text("website_url"),
    status: text("status").default("DRAFT").notNull(),
    recommendations: text("recommendations"),
    sessions: text("sessions"),
    totalWebTraffic: text("total_web_traffic"),
    totalViews: text("total_views"),
    bounceRate: text("bounce_rate"),
    users: text("users"),
    returningUsers: text("returning_users"),
    eventCount: text("event_count"),
    conversions: text("conversions"),
    sessionDuration: text("session_duration"),
    engagedSessions: text("engaged_sessions"),
    sessionsDesktop: text("sessions_desktop"),
    sessionsMobile: text("sessions_mobile"),
    sessionsTablet: text("sessions_tablet"),
    formSubmissions: text("form_submissions"),
    impressions: text("impressions"),
    clicks: text("clicks"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("seo_report_userId_idx").on(table.userId),
    index("seo_report_teamId_idx").on(table.teamId),
    index("seo_report_reportYear_reportMonth_idx").on(table.reportYear, table.reportMonth),
    index("seo_report_reportName_idx").on(table.reportName),
    index("seo_report_status_idx").on(table.status),
    index("seo_report_createdAt_idx").on(table.createdAt),
    index("seo_report_teamId_reportYear_reportMonth_idx").on(table.teamId, table.reportYear, table.reportMonth),
]);
// --- SeoReportActivityLog ----------------------------------------------------
export const seoReportActivityLog = pgTable("seo_report_activity_log", {
    id: text("_id").primaryKey(),
    seoReportId: text("seo_report_id")
        .notNull()
        .references(() => seoReport.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("seo_report_activity_log_seoReportId_idx").on(table.seoReportId),
    index("seo_report_activity_log_userId_idx").on(table.userId),
    index("seo_report_activity_log_action_idx").on(table.action),
    index("seo_report_activity_log_createdAt_idx").on(table.createdAt),
]);
export const seoReportRelations = relations(seoReport, ({ one, many }) => ({
    user: one(user, {
        fields: [seoReport.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [seoReport.teamId],
        references: [team.id],
    }),
    activityLogs: many(seoReportActivityLog),
}));
export const seoReportActivityLogRelations = relations(seoReportActivityLog, ({ one }) => ({
    seoReport: one(seoReport, {
        fields: [seoReportActivityLog.seoReportId],
        references: [seoReport.id],
    }),
}));
