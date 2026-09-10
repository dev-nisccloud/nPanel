/**
 * Live media-buying tools for Zeepo AI.
 * Meta / Instagram, Google Ads, LinkedIn Ads  account through campaign (and children).
 * Every money field is tagged with the ad account's native currency. No FX conversion.
 */
import { and, eq, ilike, inArray, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { googleAdsAccount } from "@npanel/db/schema/google-ads";
import { metaAdsAccount } from "@npanel/db/schema/meta-ads";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { NISC_MEDIA_BUYING_PRODUCT_ID } from "../media-buying-billing";
import { MetaAdsClient } from "../meta-ads-client";
import { getStoredMetaAccessToken } from "../meta-credentials";
import {
	createGoogleAdsClient,
	getCustomerInstance,
} from "../google-ads-client";
import {
	getGoogleAdsClientId,
	getGoogleAdsClientSecret,
	getGoogleAdsDeveloperToken,
} from "../google-ads-credentials";
import { getGoogleAdsExecutionContext } from "../../routers/google-ads/access";
import { LinkedInAdsClient } from "../linkedin-ads-client";
import {
	getStoredLinkedInAccessToken,
	getStoredLinkedInAccessTokenForSession,
} from "../linkedin-credentials";
import {
	AD_ACCOUNT_CURRENCY_RULE,
	getAccessibleTeamIds,
	isAgencyMarketingRole,
	money,
	moneyFromMicros,
	moneyFromMinorUnits,
	resolveMarketingDateRange,
	type ResolvedDateRange,
} from "./marketing-access";

export type MarketingAdsPlatform = "meta" | "instagram" | "google" | "linkedin" | "all";
export type MarketingAdsAction =
	| "list_accounts"
	| "get_account"
	| "get_campaign"
	| "get_performance";

export type MarketingAdsArgs = {
	action: MarketingAdsAction;
	platform?: MarketingAdsPlatform | null;
	accountId?: string | null;
	campaignId?: string | null;
	entityId?: string | null;
	level?: "account" | "campaign" | "adset" | "ad" | "adgroup" | "campaign_group" | null;
	datePreset?: string | null;
	since?: string | null;
	until?: string | null;
	breakdown?: string | null;
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null;
};

const META_INSIGHT_METRICS = [
	"campaign_id",
	"adset_id",
	"ad_id",
	"impressions",
	"clicks",
	"inline_link_clicks",
	"spend",
	"reach",
	"frequency",
	"ctr",
	"cpc",
	"cpm",
	"cpp",
	"unique_clicks",
	"unique_ctr",
	"purchase_roas",
	"quality_ranking",
	"engagement_rate_ranking",
	"conversion_rate_ranking",
	"actions",
	"cost_per_action_type",
	"date_start",
	"date_stop",
];

function sanitizeNumericId(value: string): string {
	const id = value.replace(/[^\d]/g, "");
	if (!id) throw new Error("Invalid campaign or entity id.");
	return id;
}

function publicError(e: unknown, fallback: string): string {
	const raw = e instanceof Error ? e.message : String(e);
	if (/oauth|connect your account|no active/i.test(raw)) return raw;
	if (/forbidden|do not have access/i.test(raw)) return raw;
	return fallback;
}

function normalizeMetaAccountId(value: string): string {
	const trimmed = value.trim();
	if (trimmed.startsWith("act_")) return trimmed;
	const numeric = trimmed.replace(/[^0-9]/g, "");
	return numeric.length > 0 ? `act_${numeric}` : trimmed;
}

function normalizeGoogleCustomerId(value: string): string {
	return value.replace(/-/g, "").trim();
}

function normalizeLinkedInAccountUrn(value: string): string {
	if (value.startsWith("urn:li:sponsoredAccount:")) return value;
	const numeric = value.replace(/[^0-9]/g, "");
	return numeric.length > 0 ? `urn:li:sponsoredAccount:${numeric}` : value;
}

function inferPlatform(accountId?: string | null): MarketingAdsPlatform | null {
	if (!accountId) return null;
	if (accountId.startsWith("urn:li:") || accountId.includes("sponsoredAccount")) return "linkedin";
	if (accountId.startsWith("act_")) return "meta";
	const digits = accountId.replace(/-/g, "").replace(/\D/g, "");
	if (digits.length === 10) return "google";
	return null;
}

async function hasSubscriptionAccess(
	teamIds: string[],
	platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS",
	accountId: string,
): Promise<boolean> {
	if (teamIds.length === 0) return false;
	const variants = [accountId];
	if (platform === "META_ADS") {
		const n = normalizeMetaAccountId(accountId);
		variants.push(n, n.replace(/^act_/, ""));
	}
	if (platform === "GOOGLE_ADS") {
		const raw = normalizeGoogleCustomerId(accountId);
		const dashed =
			raw.length === 10 ? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}` : raw;
		variants.push(raw, dashed);
	}
	if (platform === "LINKEDIN_ADS") {
		const urn = normalizeLinkedInAccountUrn(accountId);
		variants.push(urn, accountId.replace(/[^0-9]/g, ""));
	}
	const [row] = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(
			and(
				inArray(niscClientSubscription.teamId, teamIds),
				or(
					eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID),
					ilike(niscProduct.name, "%media buying%"),
				),
				sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${platform}`,
				or(
					...variants.map(
						(v) => sql`(${niscClientSubscription.serviceRefs}->>'adAccountId') = ${v}`,
					),
				),
			),
		)
		.limit(1);
	return !!row;
}

async function assertAccountAccess(params: {
	userId: string;
	userRole: string | null | undefined;
	platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS";
	accountId: string;
}): Promise<void> {
	if (isAgencyMarketingRole(params.userRole)) return;
	const teamIds = await getAccessibleTeamIds(params.userId);
	const ok = await hasSubscriptionAccess(teamIds, params.platform, params.accountId);
	if (!ok) {
		throw new Error("You do not have access to this ad account.");
	}
}

async function linkedAccountsFromSubscriptions(
	teamIds: string[],
	platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS",
): Promise<Array<{ accountId: string; accountName: string | null }>> {
	if (teamIds.length === 0) return [];
	const rows = await db
		.select({
			serviceRefs: niscClientSubscription.serviceRefs,
			name: niscClientSubscription.name,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(
			and(
				inArray(niscClientSubscription.teamId, teamIds),
				or(
					eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID),
					ilike(niscProduct.name, "%media buying%"),
				),
				sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${platform}`,
			),
		);
	const byId = new Map<string, { accountId: string; accountName: string | null }>();
	for (const row of rows) {
		const refs = row.serviceRefs as Record<string, unknown> | null;
		const raw = typeof refs?.adAccountId === "string" ? refs.adAccountId.trim() : "";
		if (!raw) continue;
		const accountNameRaw =
			typeof refs?.adAccountName === "string" ? refs.adAccountName.trim() : "";
		if (!byId.has(raw)) {
			byId.set(raw, { accountId: raw, accountName: accountNameRaw || row.name || null });
		}
	}
	return [...byId.values()];
}

function mapMetaInsights(row: Record<string, unknown>, currency: string) {
	const actions = Array.isArray(row.actions) ? row.actions : [];
	const linkClick = actions.find(
		(a: { action_type?: string }) =>
			a.action_type === "link_click" || a.action_type === "inline_link_click",
	) as { value?: string } | undefined;
	const purchase = actions.find(
		(a: { action_type?: string }) =>
			a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase",
	) as { value?: string } | undefined;
	return {
		impressions: num(row.impressions),
		clicks: num(row.clicks),
		link_clicks: linkClick ? num(linkClick.value) : num(row.inline_link_clicks),
		reach: num(row.reach),
		frequency: num(row.frequency),
		ctr: num(row.ctr),
		cpc: money(row.cpc, currency),
		cpm: money(row.cpm, currency),
		spend: money(row.spend, currency),
		unique_clicks: num(row.unique_clicks),
		unique_ctr: num(row.unique_ctr),
		purchase_roas: row.purchase_roas ?? null,
		purchases: purchase ? num(purchase.value) : null,
		quality_ranking: row.quality_ranking ?? null,
		engagement_rate_ranking: row.engagement_rate_ranking ?? null,
		conversion_rate_ranking: row.conversion_rate_ranking ?? null,
		actions,
		date_start: row.date_start ?? null,
		date_stop: row.date_stop ?? null,
		publisher_platform: row.publisher_platform ?? null,
	};
}

async function metaClient(): Promise<MetaAdsClient> {
	const token = await getStoredMetaAccessToken();
	if (!token) {
		throw new Error("No active Meta Ads connection. Connect Meta Ads first.");
	}
	return new MetaAdsClient({ accessToken: token.accessToken });
}

async function linkedInClient(userId: string, role?: string | null): Promise<LinkedInAdsClient> {
	const token =
		(await getStoredLinkedInAccessTokenForSession({ userId, role })) ??
		(await getStoredLinkedInAccessToken());
	if (!token) {
		throw new Error("No active LinkedIn Ads connection. Connect LinkedIn Ads first.");
	}
	return new LinkedInAdsClient({ accessToken: token.accessToken });
}

function liDate(iso: string): { year: number; month: number; day: number } {
	const [y, m, d] = iso.split("-").map(Number);
	return { year: y, month: m, day: d };
}

function formatGoogleDate(iso: string): string {
	return iso.replace(/-/g, "");
}

async function listMetaAccounts(params: MarketingAdsArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	if (!isAgency) {
		const teamIds = await getAccessibleTeamIds(params.userId);
		const linked = await linkedAccountsFromSubscriptions(teamIds, "META_ADS");
		const ids = linked.map((a) => normalizeMetaAccountId(a.accountId));
		const dbRows =
			ids.length > 0
				? await db.query.metaAdsAccount.findMany({
						where: inArray(metaAdsAccount.accountId, ids),
					})
				: [];
		const byId = new Map(dbRows.map((r) => [r.accountId, r]));
		return linked.map((a) => {
			const id = normalizeMetaAccountId(a.accountId);
			const row = byId.get(id);
			const currency = row?.currency ?? null;
			return {
				platform: "meta",
				accountId: id,
				name: row?.accountName ?? a.accountName,
				currency,
				timezone: row?.timezone ?? null,
				status: row?.status ?? "ACTIVE",
				amountSpent: moneyFromMinorUnits(row?.amountSpent ?? null, currency),
				spendLimit: moneyFromMinorUnits(row?.spendLimit ?? null, currency),
			};
		});
	}

	const rows = await db.query.metaAdsAccount.findMany();
	if (rows.length > 0) {
		return rows.map((acc) => ({
			platform: "meta",
			accountId: acc.accountId,
			name: acc.accountName,
			currency: acc.currency,
			timezone: acc.timezone,
			status: acc.status,
			amountSpent: moneyFromMinorUnits(acc.amountSpent, acc.currency),
			spendLimit: moneyFromMinorUnits(acc.spendLimit, acc.currency),
			instagramUserId: acc.instagramUserId ?? null,
		}));
	}

	const client = await metaClient();
	const response = await client.getAdAccounts();
	return (response.data ?? []).map((account: Record<string, unknown>) => {
		const raw = String(account.account_id ?? account.id ?? "");
		const accountId = normalizeMetaAccountId(raw);
		const currency = (account.currency as string) || null;
		return {
			platform: "meta",
			accountId,
			name: account.name ?? null,
			currency,
			timezone: account.timezone_name ?? null,
			status: account.account_status ?? null,
			amountSpent: moneyFromMinorUnits(account.amount_spent as string, currency),
			spendLimit: moneyFromMinorUnits(account.spend_cap as string, currency),
			instagramUserId: account.instagram_user_id ?? null,
		};
	});
}

async function listGoogleAccounts(params: MarketingAdsArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	if (!isAgency) {
		const teamIds = await getAccessibleTeamIds(params.userId);
		const linked = await linkedAccountsFromSubscriptions(teamIds, "GOOGLE_ADS");
		const ids = linked.map((a) => normalizeGoogleCustomerId(a.accountId));
		const dbRows =
			ids.length > 0
				? await db
						.select()
						.from(googleAdsAccount)
						.where(inArray(googleAdsAccount.customerId, ids))
				: [];
		const byId = new Map(dbRows.map((r) => [r.customerId, r]));
		return linked.map((a) => {
			const id = normalizeGoogleCustomerId(a.accountId);
			const row = byId.get(id);
			return {
				platform: "google",
				accountId: id,
				name: row?.accountName ?? a.accountName,
				currency: row?.currencyCode ?? null,
				timezone: row?.timeZone ?? null,
				status: row?.status ?? "ACTIVE",
			};
		});
	}

	const rows = await db.select().from(googleAdsAccount);
	return rows.map((acc) => ({
		platform: "google",
		accountId: acc.customerId,
		name: acc.accountName,
		currency: acc.currencyCode,
		timezone: acc.timeZone,
		status: acc.status,
	}));
}

async function listLinkedInAccounts(params: MarketingAdsArgs) {
	const isAgency = isAgencyMarketingRole(params.userRole);
	if (!isAgency) {
		const teamIds = await getAccessibleTeamIds(params.userId);
		const linked = await linkedAccountsFromSubscriptions(teamIds, "LINKEDIN_ADS");
		return linked.map((a) => ({
			platform: "linkedin",
			accountId: normalizeLinkedInAccountUrn(a.accountId),
			name: a.accountName,
			currency: null as string | null,
			timezone: null as string | null,
			status: "ACTIVE",
		}));
	}

	const client = await linkedInClient(params.userId, params.userRole);
	const response = await client.getAdAccounts();
	return (response.elements || []).map((account: Record<string, unknown>) => ({
		platform: "linkedin",
		accountId: normalizeLinkedInAccountUrn(String(account.id ?? "")),
		name: account.name ?? null,
		currency: (account.currency as string) || null,
		timezone: account.timezone ?? null,
		status: account.status ?? account.accountStatus ?? null,
		type: account.type ?? null,
	}));
}

const META_CAMPAIGN_INSIGHT_OPTS = {
	level: "campaign" as const,
	metrics: META_INSIGHT_METRICS,
};

async function fetchMetaCampaigns(
	client: MetaAdsClient,
	accountId: string,
	range: ResolvedDateRange,
	currency: string,
	publisherPlatform?: "instagram" | "facebook",
) {
	const response = await client.getCampaigns(accountId);
	const insightOpts: Parameters<MetaAdsClient["getInsights"]>[1] = {
		...META_CAMPAIGN_INSIGHT_OPTS,
		breakdowns: publisherPlatform ? ["publisher_platform"] : undefined,
	};
	if (range.metaDatePreset) insightOpts.datePreset = range.metaDatePreset;
	else insightOpts.timeRange = { since: range.since, until: range.until };

	let map: Record<string, Record<string, unknown>> = {};
	try {
		const insights = await client.getInsights(accountId, insightOpts);
		const rows = (insights.data ?? []).filter((row: Record<string, unknown>) =>
			publisherPlatform ? row.publisher_platform === publisherPlatform : true,
		);
		for (const row of rows) {
			if (row.campaign_id) map[String(row.campaign_id)] = row;
		}
	} catch {
		map = {};
	}

	return (response.data ?? []).map((campaign: Record<string, unknown>) => {
		const insights = map[String(campaign.id)] ?? null;
		return {
			id: String(campaign.id),
			name: campaign.name ?? null,
			objective: campaign.objective ?? null,
			status: campaign.status ?? null,
			daily_budget: moneyFromMinorUnits(campaign.daily_budget as string, currency),
			lifetime_budget: moneyFromMinorUnits(campaign.lifetime_budget as string, currency),
			start_time: campaign.start_time ?? null,
			stop_time: campaign.stop_time ?? null,
			insights: insights ? mapMetaInsights(insights, currency) : null,
		};
	});
}

async function getMetaAccount(params: MarketingAdsArgs, asInstagram: boolean) {
	if (!params.accountId) throw new Error("accountId is required.");
	const accountId = normalizeMetaAccountId(params.accountId);
	await assertAccountAccess({
		userId: params.userId,
		userRole: params.userRole,
		platform: "META_ADS",
		accountId,
	});
	const range = resolveMarketingDateRange(params);
	const client = await metaClient();
	const details = await client.getAdAccountDetails(accountId);
	const currency = (details.currency as string) || "UNKNOWN";
	const campaigns = await fetchMetaCampaigns(
		client,
		accountId,
		range,
		currency,
		asInstagram ? "instagram" : undefined,
	);
	const totals = campaigns.reduce(
		(acc, c) => {
			acc.impressions += c.insights?.impressions ?? 0;
			acc.clicks += c.insights?.clicks ?? 0;
			acc.spend += c.insights?.spend.amount ?? 0;
			acc.reach += c.insights?.reach ?? 0;
			return acc;
		},
		{ impressions: 0, clicks: 0, spend: 0, reach: 0 },
	);
	return {
		_tool: "marketing_ads",
		action: "get_account",
		platform: asInstagram ? "instagram" : "meta",
		hierarchy: "account → campaign → ad set → ad",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		account: {
			accountId,
			name: details.name ?? null,
			currency,
			timezone: details.timezone_name ?? null,
			status: details.account_status ?? null,
			amountSpentLifetime: moneyFromMinorUnits(details.amount_spent, currency),
			spendLimit: moneyFromMinorUnits(details.spend_cap, currency),
			balance: moneyFromMinorUnits(details.balance, currency),
		},
		totals: {
			impressions: totals.impressions,
			clicks: totals.clicks,
			reach: totals.reach,
			spend: money(totals.spend, currency),
			campaignCount: campaigns.length,
		},
		campaigns,
	};
}

async function getMetaCampaign(params: MarketingAdsArgs, asInstagram: boolean) {
	if (!params.campaignId) throw new Error("campaignId is required.");
	const campaignId = sanitizeNumericId(params.campaignId);
	const range = resolveMarketingDateRange(params);
	const client = await metaClient();
	const details = await client.getCampaignDetails(campaignId);
	const accountId = normalizeMetaAccountId(
		String(params.accountId ?? details.account_id ?? details.account ?? ""),
	);
	if (accountId) {
		await assertAccountAccess({
			userId: params.userId,
			userRole: params.userRole,
			platform: "META_ADS",
			accountId,
		});
	}
	let currency = "UNKNOWN";
	if (accountId) {
		try {
			const acc = await client.getAdAccountDetails(accountId);
			currency = (acc.currency as string) || currency;
		} catch {
			/* keep UNKNOWN */
		}
	}

	const insightOpts: Parameters<MetaAdsClient["getInsights"]>[1] = {
		level: "campaign",
		metrics: META_INSIGHT_METRICS,
		breakdowns: asInstagram ? ["publisher_platform"] : undefined,
	};
	if (range.metaDatePreset) insightOpts.datePreset = range.metaDatePreset;
	else insightOpts.timeRange = { since: range.since, until: range.until };

	let campaignInsights: ReturnType<typeof mapMetaInsights> | null = null;
	try {
		const ins = await client.getInsights(campaignId, insightOpts);
		const row = (ins.data ?? []).find((r: Record<string, unknown>) =>
			asInstagram ? r.publisher_platform === "instagram" : true,
		);
		if (row) campaignInsights = mapMetaInsights(row, currency);
	} catch {
		/* optional */
	}

	const [adSetsRes, adsRes] = await Promise.all([
		client.getAdSets(campaignId).catch(() => ({ data: [] })),
		client.getAds(campaignId).catch(() => ({ data: [] })),
	]);

	let adSetInsights: Record<string, ReturnType<typeof mapMetaInsights>> = {};
	try {
		const ins = await client.getInsights(campaignId, {
			...insightOpts,
			level: "adset",
		});
		for (const row of ins.data ?? []) {
			if (asInstagram && row.publisher_platform !== "instagram") continue;
			if (row.adset_id) adSetInsights[String(row.adset_id)] = mapMetaInsights(row, currency);
		}
	} catch {
		adSetInsights = {};
	}

	return {
		_tool: "marketing_ads",
		action: "get_campaign",
		platform: asInstagram ? "instagram" : "meta",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		campaign: {
			id: String(details.id ?? campaignId),
			name: details.name ?? null,
			objective: details.objective ?? null,
			status: details.status ?? null,
			daily_budget: moneyFromMinorUnits(details.daily_budget, currency),
			lifetime_budget: moneyFromMinorUnits(details.lifetime_budget, currency),
			start_time: details.start_time ?? null,
			stop_time: details.stop_time ?? null,
			insights: campaignInsights,
		},
		ad_sets: (adSetsRes.data ?? []).map((set: Record<string, unknown>) => ({
			id: String(set.id),
			name: set.name ?? null,
			status: set.status ?? null,
			optimization_goal: set.optimization_goal ?? null,
			billing_event: set.billing_event ?? null,
			daily_budget: moneyFromMinorUnits(set.daily_budget as string, currency),
			lifetime_budget: moneyFromMinorUnits(set.lifetime_budget as string, currency),
			targeting: set.targeting ?? null,
			insights: adSetInsights[String(set.id)] ?? null,
		})),
		ads: (adsRes.data ?? []).slice(0, 40).map((ad: Record<string, unknown>) => ({
			id: String(ad.id),
			name: ad.name ?? null,
			status: ad.status ?? null,
			creative: ad.creative ?? null,
		})),
	};
}

async function getMetaPerformance(params: MarketingAdsArgs, asInstagram: boolean) {
	const entityId = params.entityId || params.campaignId || params.accountId;
	if (!entityId) throw new Error("entityId, campaignId, or accountId is required.");
	const range = resolveMarketingDateRange({ ...params, datePreset: params.datePreset ?? "last_30d" });
	if (range.preset === "lifetime") {
		throw new Error("Daily/breakdown performance needs a bounded date range (use last_30d or since/until).");
	}
	let currency = "UNKNOWN";
	if (params.accountId) {
		try {
			const acc = await (await metaClient()).getAdAccountDetails(
				normalizeMetaAccountId(params.accountId),
			);
			currency = (acc.currency as string) || currency;
		} catch {
			/* ignore */
		}
	}
	const client = await metaClient();
	const level = (params.level as "campaign" | "adset" | "ad" | "account") || "campaign";
	const breakdown = params.breakdown;
	const baseBreakdowns = asInstagram ? ["publisher_platform"] : [];
	const breakdowns = breakdown
		? Array.from(new Set([...baseBreakdowns, breakdown]))
		: asInstagram
			? ["publisher_platform"]
			: undefined;

	const response = await client.getInsights(entityId, {
		level: level === "account" ? "account" : level,
		metrics: META_INSIGHT_METRICS,
		timeRange: { since: range.since, until: range.until },
		timeIncrement: breakdown ? undefined : 1,
		breakdowns,
	});
	const rows = (response.data ?? []).filter((row: Record<string, unknown>) =>
		asInstagram ? row.publisher_platform === "instagram" : true,
	);
	return {
		_tool: "marketing_ads",
		action: "get_performance",
		platform: asInstagram ? "instagram" : "meta",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		level,
		breakdown: breakdown ?? null,
		rows: rows.map((row: Record<string, unknown>) => ({
			...mapMetaInsights(row, currency),
			age: row.age ?? null,
			gender: row.gender ?? null,
			region: row.region ?? null,
			device_platform: row.device_platform ?? null,
			platform_position: row.platform_position ?? null,
		})),
	};
}

async function getGoogleAccount(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required.");
	const customerId = normalizeGoogleCustomerId(params.accountId);
	const range = resolveMarketingDateRange(params);
	const exec = await getGoogleAdsExecutionContext(
		{ session: { user: { id: params.userId, role: params.userRole } } },
		customerId,
	);
	const client = createGoogleAdsClient({
		developerToken: getGoogleAdsDeveloperToken(),
		clientId: getGoogleAdsClientId(),
		clientSecret: getGoogleAdsClientSecret(),
		refreshToken: exec.integration.refreshToken,
	});
	const customer = getCustomerInstance(
		client,
		exec.customerIdWithoutDashes,
		exec.integration.refreshToken,
	);

	let currency = "UNKNOWN";
	let name: string | null = null;
	let timezone: string | null = null;
	try {
		const [dbAcc] = await db
			.select()
			.from(googleAdsAccount)
			.where(eq(googleAdsAccount.customerId, exec.customerIdWithoutDashes))
			.limit(1);
		if (dbAcc?.currencyCode) {
			currency = dbAcc.currencyCode;
			name = dbAcc.accountName;
			timezone = dbAcc.timeZone;
		}
		if (currency === "UNKNOWN") {
			const info = (await customer.query(`
				SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone
				FROM customer
				LIMIT 1
			`)) as Array<{ customer?: Record<string, unknown> }>;
			const c = info[0]?.customer;
			if (c) {
				currency = String(c.currency_code || currency);
				name = (c.descriptive_name as string) || name;
				timezone = (c.time_zone as string) || timezone;
			}
		}
	} catch {
		/* keep UNKNOWN */
	}

	const since = formatGoogleDate(range.since);
	const until = formatGoogleDate(range.until);
	const query = `
		SELECT
			campaign.id,
			campaign.name,
			campaign.status,
			campaign.advertising_channel_type,
			campaign.bidding_strategy_type,
			campaign_budget.amount_micros,
			metrics.impressions,
			metrics.clicks,
			metrics.cost_micros,
			metrics.ctr,
			metrics.average_cpc,
			metrics.conversions,
			metrics.conversions_value,
			metrics.cost_per_conversion
		FROM campaign
		WHERE campaign.status != 'REMOVED'
		  AND segments.date BETWEEN '${since}' AND '${until}'
	`;
	const rows = (await customer.query(query)) as Array<Record<string, any>>;
	const map = new Map<
		string,
		{
			id: string;
			name: string | null;
			status: string | null;
			channel: string | null;
			bidding: string | null;
			budget: ReturnType<typeof moneyFromMicros>;
			impressions: number;
			clicks: number;
			costMicros: number;
			conversions: number;
			conversionValue: number;
		}
	>();
	for (const row of rows) {
		const id = String(row.campaign?.id ?? "");
		if (!id) continue;
		const existing = map.get(id) ?? {
			id,
			name: row.campaign?.name ?? null,
			status: String(row.campaign?.status ?? ""),
			channel: String(row.campaign?.advertising_channel_type ?? ""),
			bidding: String(row.campaign?.bidding_strategy_type ?? ""),
			budget: moneyFromMicros(row.campaign_budget?.amount_micros, currency),
			impressions: 0,
			clicks: 0,
			costMicros: 0,
			conversions: 0,
			conversionValue: 0,
		};
		existing.impressions += num(row.metrics?.impressions);
		existing.clicks += num(row.metrics?.clicks);
		existing.costMicros += num(row.metrics?.cost_micros);
		existing.conversions += num(row.metrics?.conversions);
		existing.conversionValue += num(row.metrics?.conversions_value);
		map.set(id, existing);
	}
	const campaigns = [...map.values()].map((c) => ({
		id: c.id,
		name: c.name,
		status: c.status,
		channel: c.channel,
		bidding: c.bidding,
		daily_budget: c.budget,
		insights: {
			impressions: c.impressions,
			clicks: c.clicks,
			conversions: c.conversions,
			conversion_value: money(c.conversionValue, currency),
			spend: moneyFromMicros(c.costMicros, currency),
			ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
		},
	}));
	const totals = campaigns.reduce(
		(acc, c) => {
			acc.impressions += c.insights.impressions;
			acc.clicks += c.insights.clicks;
			acc.spend += c.insights.spend.amount ?? 0;
			acc.conversions += c.insights.conversions;
			return acc;
		},
		{ impressions: 0, clicks: 0, spend: 0, conversions: 0 },
	);
	return {
		_tool: "marketing_ads",
		action: "get_account",
		platform: "google",
		hierarchy: "account → campaign → ad group → ad",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		account: {
			accountId: exec.customerIdWithoutDashes,
			name,
			currency,
			timezone,
		},
		totals: {
			...totals,
			spend: money(totals.spend, currency),
			campaignCount: campaigns.length,
		},
		campaigns,
	};
}

async function getGoogleCampaign(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required for Google Ads.");
	if (!params.campaignId) throw new Error("campaignId is required.");
	const campaignId = sanitizeNumericId(params.campaignId);
	const customerId = normalizeGoogleCustomerId(params.accountId);
	const range = resolveMarketingDateRange(params);
	const exec = await getGoogleAdsExecutionContext(
		{ session: { user: { id: params.userId, role: params.userRole } } },
		customerId,
	);
	const client = createGoogleAdsClient({
		developerToken: getGoogleAdsDeveloperToken(),
		clientId: getGoogleAdsClientId(),
		clientSecret: getGoogleAdsClientSecret(),
		refreshToken: exec.integration.refreshToken,
	});
	const customer = getCustomerInstance(
		client,
		exec.customerIdWithoutDashes,
		exec.integration.refreshToken,
	);
	let currency = "UNKNOWN";
	const [dbAcc] = await db
		.select()
		.from(googleAdsAccount)
		.where(eq(googleAdsAccount.customerId, exec.customerIdWithoutDashes))
		.limit(1);
	if (dbAcc?.currencyCode) currency = dbAcc.currencyCode;

	const since = formatGoogleDate(range.since);
	const until = formatGoogleDate(range.until);
	const campaignQuery = `
		SELECT
			campaign.id, campaign.name, campaign.status,
			campaign.advertising_channel_type, campaign.bidding_strategy_type,
			campaign_budget.amount_micros,
			metrics.impressions, metrics.clicks, metrics.cost_micros,
			metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
		FROM campaign
		WHERE campaign.id = ${campaignId}
		  AND segments.date BETWEEN '${since}' AND '${until}'
	`;
	const adGroupQuery = `
		SELECT
			ad_group.id, ad_group.name, ad_group.status,
			metrics.impressions, metrics.clicks, metrics.cost_micros,
			metrics.conversions, metrics.conversions_value
		FROM ad_group
		WHERE campaign.id = ${campaignId}
		  AND segments.date BETWEEN '${since}' AND '${until}'
	`;
	const adsQuery = `
		SELECT
			ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status,
			ad_group_ad.ad.type, metrics.impressions, metrics.clicks, metrics.cost_micros
		FROM ad_group_ad
		WHERE campaign.id = ${campaignId}
		  AND segments.date BETWEEN '${since}' AND '${until}'
	`;
	const [cRows, agRows, adRows] = await Promise.all([
		customer.query(campaignQuery) as Promise<Array<Record<string, any>>>,
		customer.query(adGroupQuery) as Promise<Array<Record<string, any>>>,
		customer.query(adsQuery) as Promise<Array<Record<string, any>>>,
	]);

	const campAgg = {
		id: campaignId,
		name: cRows[0]?.campaign?.name ?? null,
		status: String(cRows[0]?.campaign?.status ?? ""),
		channel: String(cRows[0]?.campaign?.advertising_channel_type ?? ""),
		budget: moneyFromMicros(cRows[0]?.campaign_budget?.amount_micros, currency),
		impressions: 0,
		clicks: 0,
		costMicros: 0,
		conversions: 0,
		conversionValue: 0,
	};
	for (const row of cRows) {
		campAgg.impressions += num(row.metrics?.impressions);
		campAgg.clicks += num(row.metrics?.clicks);
		campAgg.costMicros += num(row.metrics?.cost_micros);
		campAgg.conversions += num(row.metrics?.conversions);
		campAgg.conversionValue += num(row.metrics?.conversions_value);
	}

	const agMap = new Map<string, { id: string; name: string | null; status: string; impressions: number; clicks: number; costMicros: number; conversions: number }>();
	for (const row of agRows) {
		const id = String(row.ad_group?.id ?? "");
		if (!id) continue;
		const cur = agMap.get(id) ?? {
			id,
			name: row.ad_group?.name ?? null,
			status: String(row.ad_group?.status ?? ""),
			impressions: 0,
			clicks: 0,
			costMicros: 0,
			conversions: 0,
		};
		cur.impressions += num(row.metrics?.impressions);
		cur.clicks += num(row.metrics?.clicks);
		cur.costMicros += num(row.metrics?.cost_micros);
		cur.conversions += num(row.metrics?.conversions);
		agMap.set(id, cur);
	}

	const adsMap = new Map<string, { id: string; name: string | null; status: string; type: string; impressions: number; clicks: number; costMicros: number }>();
	for (const row of adRows) {
		const id = String(row.ad_group_ad?.ad?.id ?? "");
		if (!id) continue;
		const cur = adsMap.get(id) ?? {
			id,
			name: row.ad_group_ad?.ad?.name ?? null,
			status: String(row.ad_group_ad?.status ?? ""),
			type: String(row.ad_group_ad?.ad?.type ?? ""),
			impressions: 0,
			clicks: 0,
			costMicros: 0,
		};
		cur.impressions += num(row.metrics?.impressions);
		cur.clicks += num(row.metrics?.clicks);
		cur.costMicros += num(row.metrics?.cost_micros);
		adsMap.set(id, cur);
	}

	return {
		_tool: "marketing_ads",
		action: "get_campaign",
		platform: "google",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		campaign: {
			...campAgg,
			insights: {
				impressions: campAgg.impressions,
				clicks: campAgg.clicks,
				conversions: campAgg.conversions,
				conversion_value: money(campAgg.conversionValue, currency),
				spend: moneyFromMicros(campAgg.costMicros, currency),
			},
		},
		ad_groups: [...agMap.values()].map((g) => ({
			id: g.id,
			name: g.name,
			status: g.status,
			insights: {
				impressions: g.impressions,
				clicks: g.clicks,
				conversions: g.conversions,
				spend: moneyFromMicros(g.costMicros, currency),
			},
		})),
		ads: [...adsMap.values()].slice(0, 40).map((ad) => ({
			id: ad.id,
			name: ad.name,
			status: ad.status,
			type: ad.type,
			insights: {
				impressions: ad.impressions,
				clicks: ad.clicks,
				spend: moneyFromMicros(ad.costMicros, currency),
			},
		})),
	};
}

async function getGooglePerformance(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required for Google Ads.");
	if (!params.campaignId) throw new Error("campaignId is required.");
	const campaignId = sanitizeNumericId(params.campaignId);
	const range = resolveMarketingDateRange({ ...params, datePreset: params.datePreset ?? "last_30d" });
	const exec = await getGoogleAdsExecutionContext(
		{ session: { user: { id: params.userId, role: params.userRole } } },
		normalizeGoogleCustomerId(params.accountId),
	);
	const client = createGoogleAdsClient({
		developerToken: getGoogleAdsDeveloperToken(),
		clientId: getGoogleAdsClientId(),
		clientSecret: getGoogleAdsClientSecret(),
		refreshToken: exec.integration.refreshToken,
	});
	const customer = getCustomerInstance(
		client,
		exec.customerIdWithoutDashes,
		exec.integration.refreshToken,
	);
	let currency = "UNKNOWN";
	const [dbAcc] = await db
		.select()
		.from(googleAdsAccount)
		.where(eq(googleAdsAccount.customerId, exec.customerIdWithoutDashes))
		.limit(1);
	if (dbAcc?.currencyCode) currency = dbAcc.currencyCode;
	const since = formatGoogleDate(range.since);
	const until = formatGoogleDate(range.until);
	const query = `
		SELECT
			segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros,
			metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
		FROM campaign
		WHERE campaign.id = ${campaignId}
		  AND segments.date BETWEEN '${since}' AND '${until}'
		ORDER BY segments.date ASC
	`;
	const rows = (await customer.query(query)) as Array<Record<string, any>>;
	return {
		_tool: "marketing_ads",
		action: "get_performance",
		platform: "google",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		rows: rows.map((row) => ({
			date: row.segments?.date ?? null,
			impressions: num(row.metrics?.impressions),
			clicks: num(row.metrics?.clicks),
			conversions: num(row.metrics?.conversions),
			conversion_value: money(row.metrics?.conversions_value, currency),
			spend: moneyFromMicros(row.metrics?.cost_micros, currency),
			ctr: num(row.metrics?.ctr),
			average_cpc: moneyFromMicros(row.metrics?.average_cpc, currency),
		})),
	};
}

async function getLinkedInAccount(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required.");
	const accountUrn = normalizeLinkedInAccountUrn(params.accountId);
	await assertAccountAccess({
		userId: params.userId,
		userRole: params.userRole,
		platform: "LINKEDIN_ADS",
		accountId: accountUrn,
	});
	const range = resolveMarketingDateRange(params);
	const client = await linkedInClient(params.userId, params.userRole);
	const details = await client.getAdAccountDetails(accountUrn);
	const currency = (details.currency as string) || "UNKNOWN";
	const groupsRes = await client.getCampaignGroups(accountUrn);
	const groups = groupsRes.elements || [];
	let insightsById: Record<string, Record<string, number>> = {};
	try {
		const analytics = await client.getAnalytics({
			dateRange: { start: liDate(range.since), end: liDate(range.until) },
			accounts: [accountUrn],
			pivots: [{ pivot: "CAMPAIGN_GROUP" }],
			fields: [
				"impressions",
				"clicks",
				"costInLocalCurrency",
				"externalWebsiteConversions",
				"oneClickLeads",
				"videoViews",
				"pivotValues",
			],
		});
		for (const elem of analytics.elements || []) {
			const pivot = Array.isArray((elem as any).pivotValues)
				? (elem as any).pivotValues[0]
				: undefined;
			const groupId = pivot ? String(pivot).split(":").pop() : undefined;
			if (!groupId) continue;
			const acc = insightsById[groupId] ?? {
				impressions: 0,
				clicks: 0,
				spend: 0,
				conversions: 0,
				leads: 0,
			};
			acc.impressions += num((elem as any).impressions);
			acc.clicks += num((elem as any).clicks);
			acc.spend += num((elem as any).costInLocalCurrency);
			acc.conversions += num((elem as any).externalWebsiteConversions);
			acc.leads += num((elem as any).oneClickLeads);
			insightsById[groupId] = acc;
		}
	} catch {
		insightsById = {};
	}

	const campaign_groups = groups.map((g: Record<string, unknown>) => {
		const id = String(g.id);
		const ins = insightsById[id];
		return {
			id,
			name: g.name ?? null,
			status: g.status ?? g.campaignGroupStatus ?? null,
			runSchedule: g.runSchedule ?? null,
			insights: ins
				? {
						impressions: ins.impressions,
						clicks: ins.clicks,
						conversions: ins.conversions,
						leads: ins.leads,
						spend: money(ins.spend, currency),
					}
				: null,
		};
	});
	const totals = campaign_groups.reduce(
		(acc, g) => {
			acc.impressions += g.insights?.impressions ?? 0;
			acc.clicks += g.insights?.clicks ?? 0;
			acc.spend += g.insights?.spend.amount ?? 0;
			return acc;
		},
		{ impressions: 0, clicks: 0, spend: 0 },
	);
	return {
		_tool: "marketing_ads",
		action: "get_account",
		platform: "linkedin",
		hierarchy: "account → campaign group → campaign → creative",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		account: {
			accountId: accountUrn,
			name: details.name ?? null,
			currency,
			timezone: details.timezone ?? null,
			status: details.status ?? details.accountStatus ?? null,
		},
		totals: {
			...totals,
			spend: money(totals.spend, currency),
			campaignGroupCount: campaign_groups.length,
		},
		campaign_groups,
	};
}

async function getLinkedInCampaign(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required for LinkedIn Ads.");
	if (!params.campaignId) throw new Error("campaignId is required (campaign group id).");
	const accountUrn = normalizeLinkedInAccountUrn(params.accountId);
	await assertAccountAccess({
		userId: params.userId,
		userRole: params.userRole,
		platform: "LINKEDIN_ADS",
		accountId: accountUrn,
	});
	const range = resolveMarketingDateRange(params);
	const client = await linkedInClient(params.userId, params.userRole);
	let currency = "UNKNOWN";
	try {
		const acc = await client.getAdAccountDetails(accountUrn);
		currency = (acc.currency as string) || currency;
	} catch {
		/* ignore */
	}
	const groupId = String(params.campaignId).replace(/[^0-9]/g, "") || params.campaignId;
	const groupUrn = `urn:li:sponsoredCampaignGroup:${groupId}`;
	const details = await client.getCampaignGroupDetails(groupUrn).catch(() => ({
		id: groupId,
		name: null,
	}));
	const campaignsRes = await client.getCampaigns(groupUrn, accountUrn).catch(() => ({ elements: [] }));
	let groupInsights: Record<string, number> | null = null;
	try {
		const analytics = await client.getAnalytics({
			dateRange: { start: liDate(range.since), end: liDate(range.until) },
			accounts: [accountUrn],
			campaignGroups: [groupUrn],
			pivots: [{ pivot: "CAMPAIGN" }],
			fields: [
				"impressions",
				"clicks",
				"costInLocalCurrency",
				"externalWebsiteConversions",
				"oneClickLeads",
				"pivotValues",
			],
		});
		const byCampaign: Record<string, Record<string, number>> = {};
		let totalSpend = 0;
		let totalImpr = 0;
		let totalClicks = 0;
		for (const elem of analytics.elements || []) {
			const pivot = Array.isArray((elem as any).pivotValues)
				? (elem as any).pivotValues[0]
				: undefined;
			const cid = pivot ? String(pivot).split(":").pop() : "group";
			const spend = num((elem as any).costInLocalCurrency);
			totalSpend += spend;
			totalImpr += num((elem as any).impressions);
			totalClicks += num((elem as any).clicks);
			if (!cid) continue;
			const acc = byCampaign[cid] ?? { impressions: 0, clicks: 0, spend: 0, conversions: 0, leads: 0 };
			acc.impressions += num((elem as any).impressions);
			acc.clicks += num((elem as any).clicks);
			acc.spend += spend;
			acc.conversions += num((elem as any).externalWebsiteConversions);
			acc.leads += num((elem as any).oneClickLeads);
			byCampaign[cid] = acc;
		}
		groupInsights = { impressions: totalImpr, clicks: totalClicks, spend: totalSpend };
		const campaigns = (campaignsRes.elements || []).map((c: Record<string, unknown>) => {
			const id = String(c.id);
			const ins = byCampaign[id];
			return {
				id,
				name: c.name ?? null,
				status: c.status ?? null,
				costType: c.costType ?? null,
				dailyBudget: c.dailyBudget ?? null,
				totalBudget: c.totalBudget ?? null,
				insights: ins
					? {
							impressions: ins.impressions,
							clicks: ins.clicks,
							conversions: ins.conversions,
							leads: ins.leads,
							spend: money(ins.spend, currency),
						}
					: null,
			};
		});
		return {
			_tool: "marketing_ads",
			action: "get_campaign",
			platform: "linkedin",
			currency,
			currency_rule: AD_ACCOUNT_CURRENCY_RULE,
			date_range: range,
			campaign_group: {
				id: groupId,
				name: (details as any).name ?? null,
				status: (details as any).status ?? null,
				insights: {
					impressions: groupInsights.impressions,
					clicks: groupInsights.clicks,
					spend: money(groupInsights.spend, currency),
				},
			},
			campaigns,
		};
	} catch {
		return {
			_tool: "marketing_ads",
			action: "get_campaign",
			platform: "linkedin",
			currency,
			currency_rule: AD_ACCOUNT_CURRENCY_RULE,
			date_range: range,
			campaign_group: { id: groupId, name: (details as any).name ?? null },
			campaigns: (campaignsRes.elements || []).map((c: Record<string, unknown>) => ({
				id: String(c.id),
				name: c.name ?? null,
				status: c.status ?? null,
			})),
		};
	}
}

async function getLinkedInPerformance(params: MarketingAdsArgs) {
	if (!params.accountId) throw new Error("accountId is required.");
	if (!params.campaignId) throw new Error("campaignId (campaign group id) is required.");
	const accountUrn = normalizeLinkedInAccountUrn(params.accountId);
	const range = resolveMarketingDateRange({ ...params, datePreset: params.datePreset ?? "last_30d" });
	const client = await linkedInClient(params.userId, params.userRole);
	let currency = "UNKNOWN";
	try {
		const acc = await client.getAdAccountDetails(accountUrn);
		currency = (acc.currency as string) || currency;
	} catch {
		/* ignore */
	}
	const groupId = String(params.campaignId).replace(/[^0-9]/g, "") || params.campaignId;
	const groupUrn = `urn:li:sponsoredCampaignGroup:${groupId}`;
	const analytics = await client.getAnalytics({
		dateRange: { start: liDate(range.since), end: liDate(range.until) },
		accounts: [accountUrn],
		campaignGroups: [groupUrn],
		timeGranularity: "DAILY",
		pivots: [{ pivot: "CAMPAIGN_GROUP" }],
		fields: [
			"dateRange",
			"impressions",
			"clicks",
			"costInLocalCurrency",
			"externalWebsiteConversions",
			"oneClickLeads",
		],
	});
	const byDate = new Map<string, { date: string; impressions: number; clicks: number; spend: number; conversions: number; leads: number }>();
	for (const elem of analytics.elements || []) {
		const start = (elem as any)?.dateRange?.start;
		if (!start) continue;
		const date = `${start.year}-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`;
		const acc = byDate.get(date) ?? {
			date,
			impressions: 0,
			clicks: 0,
			spend: 0,
			conversions: 0,
			leads: 0,
		};
		acc.impressions += num((elem as any).impressions);
		acc.clicks += num((elem as any).clicks);
		acc.spend += num((elem as any).costInLocalCurrency);
		acc.conversions += num((elem as any).externalWebsiteConversions);
		acc.leads += num((elem as any).oneClickLeads);
		byDate.set(date, acc);
	}
	return {
		_tool: "marketing_ads",
		action: "get_performance",
		platform: "linkedin",
		currency,
		currency_rule: AD_ACCOUNT_CURRENCY_RULE,
		date_range: range,
		rows: [...byDate.values()]
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((r) => ({
				...r,
				spend: money(r.spend, currency),
			})),
	};
}

export async function agentMarketingAds(params: MarketingAdsArgs): Promise<unknown> {
	const platform = params.platform ?? (params.action === "list_accounts" ? "all" : inferPlatform(params.accountId));
	const asInstagram = platform === "instagram";

	if (params.action === "list_accounts") {
		const wanted: Array<"meta" | "google" | "linkedin"> =
			!platform || platform === "all"
				? ["meta", "google", "linkedin"]
				: platform === "instagram"
					? ["meta"]
					: [platform];
		const results: Record<string, unknown> = {};
		await Promise.all(
			wanted.map(async (p) => {
				try {
					if (p === "meta") results.meta = await listMetaAccounts(params);
					else if (p === "google") results.google = await listGoogleAccounts(params);
					else results.linkedin = await listLinkedInAccounts(params);
				} catch (e) {
					results[p] = { error: publicError(e, `Could not load ${p} ad accounts.`) };
				}
			}),
		);
		if (platform === "instagram" && Array.isArray(results.meta)) {
			results.instagram = (results.meta as Array<Record<string, unknown>>).filter(
				(a) => a.instagramUserId,
			);
		}
		return {
			_tool: "marketing_ads",
			action: "list_accounts",
			currency_rule: AD_ACCOUNT_CURRENCY_RULE,
			note: "Each account has its own currency. Never mix spend across currencies. Instagram ads run on Meta ad accounts  use platform=instagram when drilling into Instagram delivery.",
			platforms: results,
		};
	}

	if (!platform || platform === "all") {
		throw new Error("Specify platform (meta, instagram, google, or linkedin) and accountId.");
	}

	if (platform === "meta" || platform === "instagram") {
		if (params.action === "get_account") return getMetaAccount(params, asInstagram);
		if (params.action === "get_campaign") return getMetaCampaign(params, asInstagram);
		return getMetaPerformance(params, asInstagram);
	}
	if (platform === "google") {
		if (params.action === "get_account") return getGoogleAccount(params);
		if (params.action === "get_campaign") return getGoogleCampaign(params);
		return getGooglePerformance(params);
	}
	if (params.action === "get_account") return getLinkedInAccount(params);
	if (params.action === "get_campaign") return getLinkedInCampaign(params);
	return getLinkedInPerformance(params);
}
