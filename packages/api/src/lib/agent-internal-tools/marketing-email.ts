/**
 * Email marketing tools for Zeepo AI.
 * Uses SQL aggregation for totals (never dump per-recipient rows).
 * Campaign HTML is included as creative context (truncated if huge).
 */
import { and, count, desc, eq, inArray, sql } from "@npanel/db";
import { db } from "@npanel/db";
import {
	campaignRecipient,
	emailCampaign,
	emailEvent,
} from "@npanel/db/schema/email-marketing";
import { niscEmCampaign, niscEmEmail } from "@npanel/db/schema/nisc-email-marketing";
import { getAccessibleTeamIds, isAgencyMarketingRole } from "./marketing-access";

const HTML_MAX_CHARS = 24_000;

export type MarketingEmailAction = "list_campaigns" | "get_campaign" | "get_totals";

export type MarketingEmailArgs = {
	action: MarketingEmailAction;
	campaignId?: string | null;
	search?: string | null;
	status?: string | null;
	includeHtml?: boolean | null;
	limit?: number | null;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
};

function rate(num: number, den: number): number | null {
	if (!den) return null;
	return Math.round((num / den) * 10000) / 100;
}

function clipHtml(html: string | null | undefined): {
	html: string | null;
	htmlTruncated: boolean;
	htmlChars: number;
} {
	if (!html) return { html: null, htmlTruncated: false, htmlChars: 0 };
	const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
	if (cleaned.length <= HTML_MAX_CHARS) {
		return { html: cleaned, htmlTruncated: false, htmlChars: cleaned.length };
	}
	return {
		html: `${cleaned.slice(0, HTML_MAX_CHARS)}\n<!-- truncated -->`,
		htmlTruncated: true,
		htmlChars: cleaned.length,
	};
}

function campaignWhere(
	isAgency: boolean,
	userId: string,
	teamId: string | null,
	accessibleTeamIds: string[],
) {
	if (isAgency) return undefined;
	if (teamId) return eq(niscEmCampaign.teamId, teamId);
	if (accessibleTeamIds.length > 0) return inArray(niscEmCampaign.teamId, accessibleTeamIds);
	return eq(niscEmCampaign.userId, userId);
}

function legacyCampaignWhere(
	isAgency: boolean,
	userId: string,
	teamId: string | null,
	accessibleTeamIds: string[],
) {
	if (isAgency) return undefined;
	if (teamId) return eq(emailCampaign.teamId, teamId);
	if (accessibleTeamIds.length > 0) return inArray(emailCampaign.teamId, accessibleTeamIds);
	return eq(emailCampaign.userId, userId);
}

async function listNiscCampaigns(params: MarketingEmailArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);
	const where = campaignWhere(isAgency, params.userId, params.teamId, teamIds);
	const limit = Math.min(Math.max(params.limit ?? 40, 1), 80);

	const rows = await db
		.select({
			id: niscEmCampaign.id,
			name: niscEmCampaign.name,
			subject: niscEmCampaign.subject,
			fromEmail: niscEmCampaign.fromEmail,
			fromName: niscEmCampaign.fromName,
			status: niscEmCampaign.status,
			totalRecipients: niscEmCampaign.totalRecipients,
			totalSent: niscEmCampaign.totalSent,
			scheduledAt: niscEmCampaign.scheduledAt,
			sentAt: niscEmCampaign.sentAt,
			completedAt: niscEmCampaign.completedAt,
			createdAt: niscEmCampaign.createdAt,
			teamId: niscEmCampaign.teamId,
		})
		.from(niscEmCampaign)
		.where(
			and(
				where,
				sql`lower(trim(${niscEmCampaign.name})) <> 'transactional'`,
				params.status ? eq(niscEmCampaign.status, params.status) : undefined,
			),
		)
		.orderBy(desc(niscEmCampaign.createdAt))
		.limit(limit);

	const ids = rows.map((r) => r.id);
	const aggRows =
		ids.length === 0
			? []
			: await db
					.select({
						campaignId: niscEmEmail.campaignId,
						recipients: sql<number>`count(*)`,
						delivered: sql<number>`count(*) filter (where ${niscEmEmail.deliveredAt} is not null)`,
						opened: sql<number>`count(*) filter (where ${niscEmEmail.openedAt} is not null)`,
						clicked: sql<number>`count(*) filter (where ${niscEmEmail.clickedAt} is not null)`,
						bounced: sql<number>`count(*) filter (where ${niscEmEmail.bouncedAt} is not null)`,
						complained: sql<number>`count(*) filter (where ${niscEmEmail.complainedAt} is not null)`,
						opensTotal: sql<number>`coalesce(sum(${niscEmEmail.opens}), 0)`,
						clicksTotal: sql<number>`coalesce(sum(${niscEmEmail.clicks}), 0)`,
					})
					.from(niscEmEmail)
					.where(inArray(niscEmEmail.campaignId, ids))
					.groupBy(niscEmEmail.campaignId);

	const aggById = new Map(aggRows.map((a) => [a.campaignId, a]));
	return rows.map((row) => {
		const a = aggById.get(row.id);
		const recipients = Number(a?.recipients ?? row.totalRecipients ?? 0);
		const delivered = Number(a?.delivered ?? 0);
		const opened = Number(a?.opened ?? 0);
		const clicked = Number(a?.clicked ?? 0);
		const bounced = Number(a?.bounced ?? 0);
		return {
			stack: "nisc",
			id: row.id,
			name: row.name,
			subject: row.subject,
			from: row.fromName ? `${row.fromName} <${row.fromEmail}>` : row.fromEmail,
			status: row.status,
			sentAt: row.sentAt,
			scheduledAt: row.scheduledAt,
			totals: {
				recipients,
				delivered,
				opened,
				clicked,
				bounced,
				complained: Number(a?.complained ?? 0),
				opensTotal: Number(a?.opensTotal ?? 0),
				clicksTotal: Number(a?.clicksTotal ?? 0),
				deliveryRate: rate(delivered, recipients),
				openRate: rate(opened, delivered || recipients),
				clickRate: rate(clicked, opened || delivered || recipients),
				bounceRate: rate(bounced, recipients),
			},
		};
	});
}

async function listLegacyCampaigns(params: MarketingEmailArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);
	const where = legacyCampaignWhere(isAgency, params.userId, params.teamId, teamIds);
	const limit = Math.min(Math.max(params.limit ?? 40, 1), 80);

	const rows = await db
		.select({
			id: emailCampaign.id,
			name: emailCampaign.name,
			subject: emailCampaign.subject,
			fromEmail: emailCampaign.fromEmail,
			fromName: emailCampaign.fromName,
			status: emailCampaign.status,
			scheduledAt: emailCampaign.scheduledAt,
			sentAt: emailCampaign.sentAt,
			createdAt: emailCampaign.createdAt,
		})
		.from(emailCampaign)
		.where(where)
		.orderBy(desc(emailCampaign.createdAt))
		.limit(limit);

	const ids = rows.map((r) => r.id);
	if (ids.length === 0) return [];

	const [recipientCounts, eventCounts] = await Promise.all([
		db
			.select({
				campaignId: campaignRecipient.campaignId,
				recipients: count(),
			})
			.from(campaignRecipient)
			.where(inArray(campaignRecipient.campaignId, ids))
			.groupBy(campaignRecipient.campaignId),
		db
			.select({
				campaignId: campaignRecipient.campaignId,
				type: emailEvent.type,
				cnt: count(),
			})
			.from(emailEvent)
			.innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
			.where(inArray(campaignRecipient.campaignId, ids))
			.groupBy(campaignRecipient.campaignId, emailEvent.type),
	]);

	const recById = new Map(recipientCounts.map((r) => [r.campaignId, Number(r.recipients)]));
	const eventsById = new Map<string, Record<string, number>>();
	for (const row of eventCounts) {
		const cur = eventsById.get(row.campaignId) ?? {};
		cur[row.type] = Number(row.cnt);
		eventsById.set(row.campaignId, cur);
	}

	return rows.map((row) => {
		const recipients = recById.get(row.id) ?? 0;
		const ev = eventsById.get(row.id) ?? {};
		const delivered = ev.delivered ?? ev.delivery ?? 0;
		const opened = ev.opened ?? ev.open ?? 0;
		const clicked = ev.clicked ?? ev.click ?? 0;
		const bounced = ev.bounced ?? ev.bounce ?? 0;
		return {
			stack: "legacy",
			id: row.id,
			name: row.name,
			subject: row.subject,
			from: row.fromName ? `${row.fromName} <${row.fromEmail}>` : row.fromEmail,
			status: row.status,
			sentAt: row.sentAt,
			scheduledAt: row.scheduledAt,
			totals: {
				recipients,
				delivered,
				opened,
				clicked,
				bounced,
				deliveryRate: rate(delivered, recipients),
				openRate: rate(opened, delivered || recipients),
				clickRate: rate(clicked, opened || delivered || recipients),
				bounceRate: rate(bounced, recipients),
			},
		};
	});
}

async function getNiscCampaign(params: MarketingEmailArgs) {
	const id = params.campaignId!;
	const [row] = await db.select().from(niscEmCampaign).where(eq(niscEmCampaign.id, id)).limit(1);
	if (!row) return null;
	if (!isAgencyMarketingRole(params.userRole)) {
		const teamIds = await getAccessibleTeamIds(params.userId);
		const allowed =
			row.userId === params.userId || (row.teamId && teamIds.includes(row.teamId));
		if (!allowed) throw new Error("You do not have access to this email campaign.");
	}

	const [agg] = await db
		.select({
			recipients: sql<number>`count(*)`,
			delivered: sql<number>`count(*) filter (where ${niscEmEmail.deliveredAt} is not null)`,
			opened: sql<number>`count(*) filter (where ${niscEmEmail.openedAt} is not null)`,
			clicked: sql<number>`count(*) filter (where ${niscEmEmail.clickedAt} is not null)`,
			bounced: sql<number>`count(*) filter (where ${niscEmEmail.bouncedAt} is not null)`,
			complained: sql<number>`count(*) filter (where ${niscEmEmail.complainedAt} is not null)`,
			opensTotal: sql<number>`coalesce(sum(${niscEmEmail.opens}), 0)`,
			clicksTotal: sql<number>`coalesce(sum(${niscEmEmail.clicks}), 0)`,
		})
		.from(niscEmEmail)
		.where(eq(niscEmEmail.campaignId, id));

	const recipients = Number(agg?.recipients ?? row.totalRecipients ?? 0);
	const delivered = Number(agg?.delivered ?? 0);
	const opened = Number(agg?.opened ?? 0);
	const clicked = Number(agg?.clicked ?? 0);
	const bounced = Number(agg?.bounced ?? 0);
	const html = params.includeHtml === false ? { html: null, htmlTruncated: false, htmlChars: 0 } : clipHtml(row.htmlContent);

	return {
		stack: "nisc",
		id: row.id,
		name: row.name,
		subject: row.subject,
		preheader: null,
		fromEmail: row.fromEmail,
		fromName: row.fromName,
		replyTo: row.replyTo,
		status: row.status,
		trackingEnabled: row.trackingEnabled,
		scheduledAt: row.scheduledAt,
		sentAt: row.sentAt,
		completedAt: row.completedAt,
		textContent: row.textContent ? row.textContent.slice(0, 4000) : null,
		html: html.html,
		htmlTruncated: html.htmlTruncated,
		htmlChars: html.htmlChars,
		totals: {
			recipients,
			delivered,
			opened,
			clicked,
			bounced,
			complained: Number(agg?.complained ?? 0),
			opensTotal: Number(agg?.opensTotal ?? 0),
			clicksTotal: Number(agg?.clicksTotal ?? 0),
			deliveryRate: rate(delivered, recipients),
			openRate: rate(opened, delivered || recipients),
			clickRate: rate(clicked, opened || delivered || recipients),
			clickToOpenRate: rate(clicked, opened),
			bounceRate: rate(bounced, recipients),
		},
	};
}

async function getLegacyCampaign(params: MarketingEmailArgs) {
	const id = params.campaignId!;
	const [row] = await db.select().from(emailCampaign).where(eq(emailCampaign.id, id)).limit(1);
	if (!row) return null;
	if (!isAgencyMarketingRole(params.userRole)) {
		const teamIds = await getAccessibleTeamIds(params.userId);
		const allowed =
			row.userId === params.userId || (row.teamId && teamIds.includes(row.teamId));
		if (!allowed) throw new Error("You do not have access to this email campaign.");
	}

	const [[recipientCount], eventRows] = await Promise.all([
		db
			.select({ value: count() })
			.from(campaignRecipient)
			.where(eq(campaignRecipient.campaignId, id)),
		db
			.select({ type: emailEvent.type, cnt: count() })
			.from(emailEvent)
			.innerJoin(campaignRecipient, eq(emailEvent.campaignRecipientId, campaignRecipient.id))
			.where(eq(campaignRecipient.campaignId, id))
			.groupBy(emailEvent.type),
	]);

	const ev: Record<string, number> = {};
	for (const r of eventRows) ev[r.type] = Number(r.cnt);
	const recipients = Number(recipientCount?.value ?? 0);
	const delivered = ev.delivered ?? ev.delivery ?? 0;
	const opened = ev.opened ?? ev.open ?? 0;
	const clicked = ev.clicked ?? ev.click ?? 0;
	const bounced = ev.bounced ?? ev.bounce ?? 0;
	const html = params.includeHtml === false ? { html: null, htmlTruncated: false, htmlChars: 0 } : clipHtml(row.htmlContent);

	return {
		stack: "legacy",
		id: row.id,
		name: row.name,
		subject: row.subject,
		fromEmail: row.fromEmail,
		fromName: row.fromName,
		status: row.status,
		scheduledAt: row.scheduledAt,
		sentAt: row.sentAt,
		textContent: row.textContent ? row.textContent.slice(0, 4000) : null,
		html: html.html,
		htmlTruncated: html.htmlTruncated,
		htmlChars: html.htmlChars,
		totals: {
			recipients,
			delivered,
			opened,
			clicked,
			bounced,
			deliveryRate: rate(delivered, recipients),
			openRate: rate(opened, delivered || recipients),
			clickRate: rate(clicked, opened || delivered || recipients),
			bounceRate: rate(bounced, recipients),
		},
	};
}

async function getNiscTotals(params: MarketingEmailArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	const teamIds = isAgency ? [] : await getAccessibleTeamIds(params.userId);
	const where = campaignWhere(isAgency, params.userId, params.teamId, teamIds);

	const [campaignAgg] = await db
		.select({
			campaigns: sql<number>`count(*)`,
			recipients: sql<number>`coalesce(sum(${niscEmCampaign.totalRecipients}), 0)`,
		})
		.from(niscEmCampaign)
		.where(and(where, sql`lower(trim(${niscEmCampaign.name})) <> 'transactional'`));

	const [emailAgg] = await db
		.select({
			delivered: sql<number>`count(*) filter (where ${niscEmEmail.deliveredAt} is not null)`,
			opened: sql<number>`count(*) filter (where ${niscEmEmail.openedAt} is not null)`,
			clicked: sql<number>`count(*) filter (where ${niscEmEmail.clickedAt} is not null)`,
			bounced: sql<number>`count(*) filter (where ${niscEmEmail.bouncedAt} is not null)`,
			opensTotal: sql<number>`coalesce(sum(${niscEmEmail.opens}), 0)`,
			clicksTotal: sql<number>`coalesce(sum(${niscEmEmail.clicks}), 0)`,
		})
		.from(niscEmEmail)
		.innerJoin(niscEmCampaign, eq(niscEmEmail.campaignId, niscEmCampaign.id))
		.where(and(where, sql`lower(trim(${niscEmCampaign.name})) <> 'transactional'`));

	const recipients = Number(campaignAgg?.recipients ?? 0);
	const delivered = Number(emailAgg?.delivered ?? 0);
	const opened = Number(emailAgg?.opened ?? 0);
	const clicked = Number(emailAgg?.clicked ?? 0);
	const bounced = Number(emailAgg?.bounced ?? 0);
	return {
		stack: "nisc",
		campaigns: Number(campaignAgg?.campaigns ?? 0),
		totals: {
			recipients,
			delivered,
			opened,
			clicked,
			bounced,
			opensTotal: Number(emailAgg?.opensTotal ?? 0),
			clicksTotal: Number(emailAgg?.clicksTotal ?? 0),
			deliveryRate: rate(delivered, recipients),
			openRate: rate(opened, delivered || recipients),
			clickRate: rate(clicked, opened || delivered || recipients),
			bounceRate: rate(bounced, recipients),
		},
	};
}

export async function agentMarketingEmail(params: MarketingEmailArgs): Promise<unknown> {
	if (params.action === "list_campaigns") {
		const [nisc, legacy] = await Promise.all([
			listNiscCampaigns(params).catch((e) => ({
				error: e instanceof Error ? e.message : "Failed to list Nisc email campaigns",
			})),
			listLegacyCampaigns(params).catch((e) => ({
				error: e instanceof Error ? e.message : "Failed to list legacy email campaigns",
			})),
		]);
		return {
			_tool: "marketing_email",
			action: "list_campaigns",
			note: "Totals are SQL aggregates (unique opens/clicks), not per-recipient dumps. Call get_campaign with a campaign id to read the HTML.",
			nisc,
			legacy,
		};
	}

	if (params.action === "get_totals") {
		const nisc = await getNiscTotals(params);
		return {
			_tool: "marketing_email",
			action: "get_totals",
			note: "Account-level aggregates across campaigns. Use these totals for advice; do not request recipient-level rows.",
			nisc,
		};
	}

	if (!params.campaignId) throw new Error("campaignId is required.");
	const nisc = await getNiscCampaign(params);
	if (nisc) {
		return {
			_tool: "marketing_email",
			action: "get_campaign",
			note: "HTML is part of the creative context. Totals are aggregates.",
			campaign: nisc,
		};
	}
	const legacy = await getLegacyCampaign(params);
	if (legacy) {
		return {
			_tool: "marketing_email",
			action: "get_campaign",
			note: "HTML is part of the creative context. Totals are aggregates.",
			campaign: legacy,
		};
	}
	throw new Error("Email campaign not found.");
}
