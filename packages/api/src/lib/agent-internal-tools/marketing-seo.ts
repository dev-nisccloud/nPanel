/**
 * SEO tools for Zeepo AI — SEO Suite snapshots + SEO Reports.
 * Reads stored project/rank/audit/backlink data; does not trigger paid vendor recrawls.
 */
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { seoReport } from "@npanel/db/schema/seo-reports";
import {
	seoSuiteAuditIssue,
	seoSuiteAuditRun,
	seoSuiteBacklinkSnapshot,
	seoSuiteDomainSnapshot,
	seoSuiteProject,
	seoSuiteRankKeyword,
	seoSuiteRankResult,
	seoSuiteSavedKeyword,
} from "@npanel/db/schema/seo-suite";
import { getAccessibleTeamIds, isAgencyMarketingRole } from "./marketing-access";

export type MarketingSeoAction =
	| "list_projects"
	| "get_overview"
	| "get_rankings"
	| "get_reports";

export type MarketingSeoArgs = {
	action: MarketingSeoAction;
	projectId?: string | null;
	domain?: string | null;
	reportId?: string | null;
	limit?: number | null;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
};

function projectScope(isAgency: boolean, teamId: string | null, teamIds: string[]) {
	if (isAgency) return undefined;
	if (teamId) return eq(seoSuiteProject.teamId, teamId);
	if (teamIds.length > 0) return inArray(seoSuiteProject.teamId, teamIds);
	return sql`false`;
}

async function listProjects(params: MarketingSeoArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);
	const search = params.domain?.trim();
	const rows = await db.query.seoSuiteProject.findMany({
		where: and(
			isNull(seoSuiteProject.archivedAt),
			projectScope(isAgency, params.teamId, teamIds),
			search
				? or(
						ilike(seoSuiteProject.name, `%${search}%`),
						ilike(seoSuiteProject.primaryDomain, `%${search}%`),
					)
				: undefined,
		),
		orderBy: [desc(seoSuiteProject.updatedAt)],
		limit: Math.min(params.limit ?? 40, 80),
	});
	return rows.map((p) => ({
		id: p.id,
		name: p.name,
		domain: p.primaryDomain,
		location: p.locationName,
		language: p.languageCode,
		competitors: p.competitorDomains,
		brandEntities: p.brandEntities,
		updatedAt: p.updatedAt,
	}));
}

async function getProjectOrThrow(params: MarketingSeoArgs) {
	if (!params.projectId && !params.domain) {
		throw new Error("projectId or domain is required.");
	}
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);
	const project = params.projectId
		? await db.query.seoSuiteProject.findFirst({
				where: and(eq(seoSuiteProject.id, params.projectId), isNull(seoSuiteProject.archivedAt)),
			})
		: await db.query.seoSuiteProject.findFirst({
				where: and(
					ilike(seoSuiteProject.primaryDomain, `%${params.domain!.trim()}%`),
					isNull(seoSuiteProject.archivedAt),
				),
			});
	if (!project) throw new Error("SEO project not found.");
	if (!isAgency && project.teamId && params.teamId && project.teamId !== params.teamId) {
		throw new Error("You do not have access to this SEO project.");
	}
	if (!isAgency && project.teamId && teamIds.length > 0 && !teamIds.includes(project.teamId)) {
		throw new Error("You do not have access to this SEO project.");
	}
	return project;
}

async function getOverview(params: MarketingSeoArgs) {
	const project = await getProjectOrThrow(params);
	const [snapshot, audit, backlink, keywordCount] = await Promise.all([
		db.query.seoSuiteDomainSnapshot.findFirst({
			where: eq(seoSuiteDomainSnapshot.projectId, project.id),
			orderBy: [desc(seoSuiteDomainSnapshot.capturedAt)],
		}),
		db.query.seoSuiteAuditRun.findFirst({
			where: eq(seoSuiteAuditRun.projectId, project.id),
			orderBy: [desc(seoSuiteAuditRun.createdAt)],
		}),
		db.query.seoSuiteBacklinkSnapshot.findFirst({
			where: eq(seoSuiteBacklinkSnapshot.projectId, project.id),
			orderBy: [desc(seoSuiteBacklinkSnapshot.capturedAt)],
		}),
		db
			.select({ value: sql<number>`count(*)` })
			.from(seoSuiteSavedKeyword)
			.where(eq(seoSuiteSavedKeyword.projectId, project.id)),
	]);

	let auditIssues: Array<{ severity: string; count: number }> = [];
	if (audit?.id) {
		const issueRows = await db
			.select({
				severity: seoSuiteAuditIssue.severity,
				count: sql<number>`count(*)`,
			})
			.from(seoSuiteAuditIssue)
			.where(eq(seoSuiteAuditIssue.auditRunId, audit.id))
			.groupBy(seoSuiteAuditIssue.severity);
		auditIssues = issueRows.map((r) => ({ severity: r.severity, count: Number(r.count) }));
	}

	const rankedKeywords = (snapshot?.rankedKeywords ?? []).slice(0, 25);

	return {
		_tool: "marketing_seo",
		action: "get_overview",
		project: {
			id: project.id,
			name: project.name,
			domain: project.primaryDomain,
			location: project.locationName,
			language: project.languageCode,
			competitors: project.competitorDomains,
			brandEntities: project.brandEntities,
			gscSiteId: project.gscSiteId,
			ga4PropertyId: project.ga4PropertyId,
		},
		organic: snapshot
			? {
					capturedAt: snapshot.capturedAt,
					organicTraffic: snapshot.organicTraffic,
					organicKeywords: snapshot.organicKeywords,
					positions: {
						pos1: snapshot.pos1Count,
						pos2_3: snapshot.pos2_3Count,
						pos4_10: snapshot.pos4_10Count,
						pos11_20: snapshot.pos11_20Count,
					},
					topKeywords: rankedKeywords,
					topPages: (snapshot.pages ?? []).slice(0, 15),
				}
			: null,
		audit: audit
			? {
					id: audit.id,
					status: audit.status,
					score: audit.score,
					summary: audit.summary,
					completedAt: audit.completedAt,
					issuesBySeverity: auditIssues,
				}
			: null,
		backlinks: backlink
			? {
					capturedAt: backlink.capturedAt,
					target: backlink.target,
					summary: backlink.summary,
				}
			: null,
		savedKeywordCount: Number(keywordCount[0]?.value ?? 0),
	};
}

async function getRankings(params: MarketingSeoArgs) {
	const project = await getProjectOrThrow(params);
	const limit = Math.min(params.limit ?? 50, 100);
	const rows = await db
		.select({
			keyword: seoSuiteRankKeyword.keyword,
			rankAbsolute: seoSuiteRankResult.rankAbsolute,
			rankGroup: seoSuiteRankResult.rankGroup,
			url: seoSuiteRankResult.url,
			checkedAt: seoSuiteRankResult.checkedAt,
			aiOverview: seoSuiteRankResult.aiOverview,
		})
		.from(seoSuiteRankResult)
		.innerJoin(seoSuiteRankKeyword, eq(seoSuiteRankResult.rankKeywordId, seoSuiteRankKeyword.id))
		.where(eq(seoSuiteRankResult.projectId, project.id))
		.orderBy(desc(seoSuiteRankResult.checkedAt))
		.limit(400);

	const latest = new Map<string, (typeof rows)[number]>();
	for (const row of rows) {
		if (!latest.has(row.keyword)) latest.set(row.keyword, row);
	}
	const keywords = [...latest.values()]
		.sort((a, b) => (a.rankAbsolute ?? 999) - (b.rankAbsolute ?? 999))
		.slice(0, limit);

	const withRank = keywords.filter((k) => k.rankAbsolute != null);
	const avg =
		withRank.length > 0
			? withRank.reduce((s, k) => s + (k.rankAbsolute ?? 0), 0) / withRank.length
			: null;

	return {
		_tool: "marketing_seo",
		action: "get_rankings",
		project: { id: project.id, name: project.name, domain: project.primaryDomain },
		aggregates: {
			keywordsTracked: latest.size,
			inTop3: withRank.filter((k) => (k.rankAbsolute ?? 99) <= 3).length,
			inTop10: withRank.filter((k) => (k.rankAbsolute ?? 99) <= 10).length,
			notRanking: keywords.filter((k) => k.rankAbsolute == null).length,
			averageRank: avg != null ? Math.round(avg * 10) / 10 : null,
		},
		keywords,
	};
}

async function getReports(params: MarketingSeoArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);

	if (params.reportId) {
		const report = await db.query.seoReport.findFirst({
			where: eq(seoReport.id, params.reportId),
		});
		if (!report) throw new Error("SEO report not found.");
		return { _tool: "marketing_seo", action: "get_reports", report };
	}

	const rows = await db.query.seoReport.findMany({
		where: and(
			isAgency
				? undefined
				: params.teamId
					? eq(seoReport.teamId, params.teamId)
					: teamIds.length
						? inArray(seoReport.teamId, teamIds)
						: eq(seoReport.userId, params.userId),
			params.domain ? ilike(seoReport.websiteUrl, `%${params.domain}%`) : undefined,
		),
		orderBy: [desc(seoReport.createdAt)],
		limit: Math.min(params.limit ?? 20, 40),
	});

	return {
		_tool: "marketing_seo",
		action: "get_reports",
		reports: rows.map((r) => ({
			id: r.id,
			name: r.reportName,
			month: r.reportMonth,
			year: r.reportYear,
			websiteUrl: r.websiteUrl,
			status: r.status,
			sessions: r.sessions,
			users: r.users,
			impressions: r.impressions,
			clicks: r.clicks,
			bounceRate: r.bounceRate,
			conversions: r.conversions,
			recommendations: r.recommendations,
		})),
	};
}

export async function agentMarketingSeo(params: MarketingSeoArgs): Promise<unknown> {
	if (params.action === "list_projects") {
		const projects = await listProjects(params);
		return {
			_tool: "marketing_seo",
			action: "list_projects",
			projects,
		};
	}
	if (params.action === "get_overview") return getOverview(params);
	if (params.action === "get_rankings") return getRankings(params);
	return getReports(params);
}
