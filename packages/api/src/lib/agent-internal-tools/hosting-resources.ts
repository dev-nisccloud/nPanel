/**
 * Hosting resource tools for the Zeepo AI Agent.
 *
 * get_hosting_resources  – list all hosting subscriptions (role-aware)
 *   Agency  → live Plesk XML (all webspaces) enriched with DB billing data
 *   Customer→ nisc_client_subscription DB (web-hosting products for the team)
 *
 * get_hosting_detail – full detail for one subscription identified by domain
 *   Both roles: Plesk XML (live stats) + DB billing overlay
 *   Customer access is scoped to the team's own subscriptions.
 *
 * Sensitive data intentionally omitted from all results:
 *   FTP credentials, numeric Plesk IDs, internal DB identifiers.
 */

import { and, eq, ilike, inArray, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingPlan, hostingSubscription } from "@npanel/db/schema/hosting";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { team as teamTable } from "@npanel/db/schema/teams";
import { sendPleskXmlRequest } from "../plesk/xml-client";
import { XMLParser } from "fast-xml-parser";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
	return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

function pleskStatus(status: unknown): "Active" | "Suspended" | "Unknown" {
	if (status === undefined || status === null) return "Unknown";
	const n = typeof status === "string" ? parseInt(status, 10) : Number(status);
	if (isNaN(n)) return "Unknown";
	return n === 0 ? "Active" : "Suspended";
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function pleskStr(v: unknown): string {
	if (v == null) return "";
	if (typeof v === "string" || typeof v === "number") return String(v);
	if (typeof v === "object" && "#text" in (v as object))
		return String((v as { "#text": unknown })["#text"] ?? "");
	return "";
}

function pleskNum(v: unknown): number {
	const n = parseFloat(pleskStr(v));
	return isNaN(n) ? 0 : n;
}

function pleskBool(v: unknown): boolean {
	if (typeof v === "boolean") return v;
	const s = pleskStr(v).toLowerCase();
	return s === "true" || s === "1";
}

function getLimitValue(limits: any, name: string): number {
	const items: any[] = Array.isArray(limits?.limit) ? limits.limit : limits?.limit ? [limits.limit] : [];
	const found = items.find((l: any) => pleskStr(l.name) === name);
	return found ? pleskNum(found.value) : 0;
}

function getProperty(props: any, name: string): string {
	const items: any[] = Array.isArray(props) ? props : props ? [props] : [];
	const found = items.find((p: any) => pleskStr(p.name) === name);
	return pleskStr(found?.value);
}

// ── Plesk XML fetch helpers ───────────────────────────────────────────────────

async function fetchPleskWebspaces(filter?: string): Promise<any[]> {
	if (!process.env.PLESK_XML_ENDPOINT) return [];
	const filterXml = filter ?? "<filter/>";
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      ${filterXml}
      <dataset>
        <gen_info/>
        <hosting/>
        <limits/>
        <stat/>
      </dataset>
    </get>
  </webspace>
</packet>`;
	try {
		const { xml: resp, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xml);
		if (isHostUnreachable || isAuthError || !resp?.trim()) return [];
		const parser = new XMLParser({ ignoreAttributes: false });
		const parsed = parser.parse(resp);
		const results = parsed?.packet?.webspace?.get?.result;
		if (!results) return [];
		return Array.isArray(results) ? results : [results];
	} catch {
		return [];
	}
}

function mapPleskWebspace(ws: any) {
	const gi = ws?.data?.gen_info ?? {};
	const stat = ws?.data?.stat ?? {};
	const hosting = ws?.data?.hosting ?? {};
	const limits = ws?.data?.limits ?? {};
	const props: any = hosting?.vrt_hst?.property ?? [];

	const diskUsage = pleskNum(gi.real_size);
	const diskLimit = getLimitValue(limits, "disk_space");
	const traffic = pleskNum(stat.traffic);

	return {
		domain: pleskStr(gi.name) || null,
		status: pleskStatus(gi.status),
		ipAddress: pleskStr(hosting?.vrt_hst?.ip_address) || pleskStr(gi.dns_ip_address) || null,
		sslEnabled: pleskBool(getProperty(props, "ssl")),
		certificateName: getProperty(props, "certificate_name") || null,
		diskUsageBytes: diskUsage,
		diskLimitBytes: diskLimit,
		diskUsageFormatted: formatBytes(diskUsage),
		diskLimitFormatted: diskLimit > 0 ? formatBytes(diskLimit) : "Unlimited",
		trafficBytes: traffic,
		trafficFormatted: formatBytes(traffic),
		mailboxCount: pleskNum(stat.box),
		databaseCount: pleskNum(stat.db),
		subdomainCount: pleskNum(stat.subdom),
		createdAt: pleskStr(gi.cr_date) || null,
		/** The Plesk numeric id — used internally, NOT exposed in the result object */
		_pleskId: Number(ws?.id ?? 0) || null,
	};
}

// ── DB enrichment (hosting subscription billing row) ─────────────────────────

interface DbBillingRow {
	planName: string | null;
	hostingType: string | null;
	billingCycle: string | null;
	expiryDate: string | null;
	nextRenewalDate: string | null;
	autoRenew: boolean | null;
	teamId: string | null;
	teamName: string | null;
}

async function fetchDbBillingByPleskId(pleskId: number): Promise<DbBillingRow | null> {
	const idStr = String(pleskId);
	const rows = await db
		.select({
			planName: hostingPlan.name,
			hostingType: hostingSubscription.hostingType,
			billingCycle: hostingSubscription.billingCycle,
			expiryDate: hostingSubscription.expiryDate,
			nextRenewalDate: hostingSubscription.nextRenewalDate,
			autoRenew: hostingSubscription.autoRenew,
			teamId: hostingSubscription.teamId,
		})
		.from(hostingSubscription)
		.leftJoin(hostingPlan, eq(hostingSubscription.hostingPlanId, hostingPlan.id))
		.where(eq(hostingSubscription.pleskFilterId, idStr))
		.limit(1);

	const row = rows[0];
	if (!row) {
		// Try niscClientSubscription as fallback
		const niscRows = await db
			.select({
				name: niscClientSubscription.name,
				billingCycle: niscClientSubscription.billingCycle,
				expiryDate: niscClientSubscription.expiryDate,
				autoRenew: niscClientSubscription.autoRenew,
				teamId: niscClientSubscription.teamId,
			})
			.from(niscClientSubscription)
			.where(
				or(
					eq(niscClientSubscription.pleskFilterId, idStr),
					sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`,
				),
			)
			.limit(1);
		const nr = niscRows[0];
		if (!nr) return null;

		let teamName: string | null = null;
		if (nr.teamId) {
			const tr = await db.select({ name: teamTable.name }).from(teamTable).where(eq(teamTable.id, nr.teamId)).limit(1);
			teamName = tr[0]?.name ?? null;
		}
		return {
			planName: nr.name ?? null,
			hostingType: null,
			billingCycle: nr.billingCycle ?? null,
			expiryDate: nr.expiryDate?.toISOString() ?? null,
			nextRenewalDate: null,
			autoRenew: nr.autoRenew ?? null,
			teamId: nr.teamId ?? null,
			teamName,
		};
	}

	let teamName: string | null = null;
	if (row.teamId) {
		const tr = await db.select({ name: teamTable.name }).from(teamTable).where(eq(teamTable.id, row.teamId)).limit(1);
		teamName = tr[0]?.name ?? null;
	}

	return {
		planName: row.planName ?? null,
		hostingType: row.hostingType ?? null,
		billingCycle: row.billingCycle ?? null,
		expiryDate: row.expiryDate?.toISOString() ?? null,
		nextRenewalDate: row.nextRenewalDate?.toISOString() ?? null,
		autoRenew: row.autoRenew ?? null,
		teamId: row.teamId ?? null,
		teamName,
	};
}

// ── Optional section fetchers (read-only, no mutations) ───────────────────────

async function fetchPleskDnsRecords(siteId: number): Promise<Array<{ type: string; host: string; value: string; ttl?: number }>> {
	try {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <get_rec>
      <filter><site-id>${siteId}</site-id></filter>
    </get_rec>
  </dns>
</packet>`;
		const { xml: resp, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xml);
		if (isHostUnreachable || isAuthError || !resp?.trim()) return [];
		const parser = new XMLParser({ ignoreAttributes: false });
		const parsed = parser.parse(resp);
		const results = parsed?.packet?.dns?.get_rec?.result;
		if (!results) return [];
		const rows = Array.isArray(results) ? results : [results];
		return rows
			.map((r: any) => {
				const data = r?.data;
				if (!data) return null;
				const type = pleskStr(data.type);
				const host = pleskStr(data.host) || pleskStr(data.name) || "";
				const value = pleskStr(data.value) || pleskStr(data.pointsTo) || "";
				const ttl = data.ttl ? parseInt(pleskStr(data.ttl), 10) : undefined;
				if (!type) return null;
				return { type, host, value, ...(ttl && !isNaN(ttl) ? { ttl } : {}) };
			})
			.filter(Boolean) as Array<{ type: string; host: string; value: string; ttl?: number }>;
	} catch {
		return [];
	}
}

export interface HostingMailAccount {
	email: string;
	mailboxEnabled: boolean;
	quotaBytes: number;
	quotaFormatted: string;
	usageBytes: number;
	usageFormatted: string;
	forwardingEnabled: boolean;
	forwardingAddresses: string[];
	aliases: string[];
	autoresponderEnabled: boolean;
}

async function fetchPleskMailAccounts(siteId: number, domainName: string): Promise<HostingMailAccount[]> {
	try {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <get_info>
      <filter><site-id>${siteId}</site-id></filter>
      <mailbox/>
      <mailbox-usage/>
      <forwarding/>
      <aliases/>
      <autoresponder/>
    </get_info>
  </mail>
</packet>`;
		const { xml: resp, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xml);
		if (isHostUnreachable || isAuthError || !resp?.trim()) return [];
		const parser = new XMLParser({ ignoreAttributes: false });
		const parsed = parser.parse(resp);
		const raw = parsed?.packet?.mail?.get_info?.result;
		if (!raw) return [];
		const rows = Array.isArray(raw) ? raw : [raw];
		return rows
			.map((r: any) => {
				const mn = r?.mailname;
				if (!mn) return null;
				const name = pleskStr(mn.name);
				if (!name) return null;
				const email = name.includes("@") ? name : `${name}@${domainName}`;
				const quota = pleskNum(mn.mailbox?.quota);
				const usage = pleskNum(mn.mailbox?.usage);
				const fwdAddr = mn.forwarding?.address;
				const aliases = mn.alias;
				return {
					email,
					mailboxEnabled: pleskBool(mn.mailbox?.enabled ?? true),
					quotaBytes: quota,
					quotaFormatted: quota > 0 ? formatBytes(quota) : "Unlimited",
					usageBytes: usage,
					usageFormatted: formatBytes(usage),
					forwardingEnabled: pleskBool(mn.forwarding?.enabled),
					forwardingAddresses: fwdAddr
						? (Array.isArray(fwdAddr) ? fwdAddr : [fwdAddr]).map(pleskStr).filter(Boolean)
						: [],
					aliases: aliases ? (Array.isArray(aliases) ? aliases : [aliases]).map(pleskStr).filter(Boolean) : [],
					autoresponderEnabled: pleskBool(mn.autoresponder?.enabled),
				} satisfies HostingMailAccount;
			})
			.filter(Boolean) as HostingMailAccount[];
	} catch {
		return [];
	}
}

export interface HostingSubdomain {
	name: string;
	fqdn: string;
}

async function fetchPleskSubdomains(parentDomain: string): Promise<HostingSubdomain[]> {
	try {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <subdomain>
    <get>
      <filter><parent-name>${escapeXml(parentDomain)}</parent-name></filter>
    </get>
  </subdomain>
</packet>`;
		const { xml: resp, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xml);
		if (isHostUnreachable || isAuthError || !resp?.trim()) return [];
		const parser = new XMLParser({ ignoreAttributes: false });
		const parsed = parser.parse(resp);
		const raw = parsed?.packet?.subdomain?.get?.result;
		if (!raw) return [];
		const rows = Array.isArray(raw) ? raw : [raw];
		return rows
			.map((r: any) => {
				const data = r?.data ?? r;
				const name = pleskStr(data?.name || data?.["subdomain-name"] || r?.name);
				if (!name) return null;
				const fqdn = name.includes(".") ? name : `${name}.${parentDomain}`;
				return { name, fqdn };
			})
			.filter(Boolean) as HostingSubdomain[];
	} catch {
		return [];
	}
}

export interface HostingDatabase {
	name: string;
	type: string;
}

async function fetchPleskDatabases(siteId: number): Promise<HostingDatabase[]> {
	try {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-db>
      <filter><webspace-id>${siteId}</webspace-id></filter>
    </get-db>
  </database>
</packet>`;
		const { xml: resp, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xml);
		if (isHostUnreachable || isAuthError || !resp?.trim()) return [];
		const parser = new XMLParser({ ignoreAttributes: false });
		const parsed = parser.parse(resp);
		const raw = parsed?.packet?.database?.["get-db"]?.result;
		if (!raw) return [];
		const rows = Array.isArray(raw) ? raw : [raw];
		return rows
			.map((r: any) => {
				const name = pleskStr(r?.name);
				if (!name) return null;
				return { name, type: pleskStr(r?.type) || "mysql" };
			})
			.filter(Boolean) as HostingDatabase[];
	} catch {
		return [];
	}
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface HostingResourceEntry {
	domain: string | null;
	status: "Active" | "Suspended" | "Unknown";
	ipAddress: string | null;
	sslEnabled: boolean;
	diskUsageBytes: number;
	diskLimitBytes: number;
	diskUsageFormatted: string;
	diskLimitFormatted: string;
	trafficBytes: number;
	trafficFormatted: string;
	createdAt: string | null;
	// DB billing (when linked)
	planName: string | null;
	hostingType: string | null;
	billingCycle: string | null;
	expiryDate: string | null;
	nextRenewalDate: string | null;
	autoRenew: boolean | null;
	teamName: string | null; // Agency only: which client owns this
}

export interface HostingResourcesResult {
	_tool: "get_hosting_resources";
	isAgency: boolean;
	teamName: string | null;
	resources: HostingResourceEntry[];
	totalCount: number;
	activeCount: number;
	suspendedCount: number;
	pleskUnavailable?: boolean;
	checkedAt: string;
}

export interface HostingDetailResult {
	_tool: "get_hosting_detail";
	domain: string;
	found: boolean;
	// Plesk live data
	status: "Active" | "Suspended" | "Unknown";
	ipAddress: string | null;
	sslEnabled: boolean;
	certificateName: string | null;
	diskUsageBytes: number;
	diskLimitBytes: number;
	diskUsageFormatted: string;
	diskLimitFormatted: string;
	trafficBytes: number;
	trafficFormatted: string;
	mailboxCount: number;
	databaseCount: number;
	subdomainCount: number;
	createdAt: string | null;
	// DB billing overlay
	planName: string | null;
	hostingType: string | null;
	billingCycle: string | null;
	expiryDate: string | null;
	nextRenewalDate: string | null;
	autoRenew: boolean | null;
	teamName: string | null; // Agency: which client
	// Optional sections (present only when requested)
	dnsRecords?: Array<{ type: string; host: string; value: string; ttl?: number }>;
	mailAccounts?: HostingMailAccount[];
	subdomains?: HostingSubdomain[];
	databases?: HostingDatabase[];
	// Error / access
	accessDenied?: boolean;
	pleskUnavailable?: boolean;
	error?: string;
	checkedAt: string;
}

// ── get_hosting_resources ─────────────────────────────────────────────────────

export async function agentGetHostingResources(params: {
	isAgency: boolean;
	teamId: string | null;
	teamName: string | null;
}): Promise<HostingResourcesResult> {
	const { isAgency, teamId, teamName } = params;
	const checkedAt = new Date().toISOString();

	// ── Customer path: DB only ───────────────────────────────────────
	if (!isAgency) {
		if (!teamId) {
			return {
				_tool: "get_hosting_resources",
				isAgency: false,
				teamName,
				resources: [],
				totalCount: 0,
				activeCount: 0,
				suspendedCount: 0,
				checkedAt,
			};
		}

		const hostingProductRows = await db
			.select({ id: niscProduct.id })
			.from(niscProduct)
			.where(
				and(
					eq(niscProduct.isActive, true),
					or(ilike(niscProduct.name, "%web hosting%"), ilike(niscProduct.name, "%website hosting%")),
				),
			);
		const productIds = hostingProductRows.map((r) => r.id);

		const subs =
			productIds.length === 0
				? []
				: await db.query.niscClientSubscription.findMany({
						where: and(eq(niscClientSubscription.teamId, teamId), inArray(niscClientSubscription.productId, productIds)),
						orderBy: (s, { desc: d }) => [d(s.createdAt)],
						columns: {
							id: true,
							name: true,
							status: true,
							subscriptionDate: true,
							expiryDate: true,
							primaryDomain: true,
							billingCycle: true,
							autoRenew: true,
							pleskFilterId: true,
							serviceRefs: true,
						},
						with: { productPlan: { columns: { name: true } } },
					});

		const resources: HostingResourceEntry[] = subs.map((sub) => {
			const nisc = sub.status;
			const mapped: "Active" | "Suspended" | "Unknown" =
				nisc === "ACTIVE" ? "Active" : nisc === "SUSPENDED" ? "Suspended" : "Unknown";
			return {
				domain: sub.primaryDomain ?? sub.name ?? null,
				status: mapped,
				ipAddress: null,
				sslEnabled: false,
				diskUsageBytes: 0,
				diskLimitBytes: 0,
				diskUsageFormatted: "—",
				diskLimitFormatted: "—",
				trafficBytes: 0,
				trafficFormatted: "—",
				createdAt: sub.subscriptionDate?.toISOString() ?? null,
				planName: sub.productPlan?.name ?? sub.name ?? null,
				hostingType: null,
				billingCycle: sub.billingCycle ?? null,
				expiryDate: sub.expiryDate?.toISOString() ?? null,
				nextRenewalDate: null,
				autoRenew: sub.autoRenew ?? null,
				teamName: null,
			};
		});

		return {
			_tool: "get_hosting_resources",
			isAgency: false,
			teamName,
			resources,
			totalCount: resources.length,
			activeCount: resources.filter((r) => r.status === "Active").length,
			suspendedCount: resources.filter((r) => r.status === "Suspended").length,
			checkedAt,
		};
	}

	// ── Agency path: live Plesk ──────────────────────────────────────
	const rawWebspaces = await fetchPleskWebspaces();

	if (!rawWebspaces.length) {
		return {
			_tool: "get_hosting_resources",
			isAgency: true,
			teamName: null,
			resources: [],
			totalCount: 0,
			activeCount: 0,
			suspendedCount: 0,
			pleskUnavailable: true,
			checkedAt,
		};
	}

	// Map Plesk data then enrich with DB billing in parallel (best-effort).
	const pleskMapped = rawWebspaces.map(mapPleskWebspace);

	const pleskIds = pleskMapped.map((m) => m._pleskId).filter((id): id is number => !!id);
	const billingMap = new Map<number, DbBillingRow>();

	// Batch DB lookup: hostingSubscription.pleskFilterId IN (ids)
	if (pleskIds.length > 0) {
		const idStrs = pleskIds.map(String);
		const hsSubs = await db
			.select({
				pleskFilterId: hostingSubscription.pleskFilterId,
				planName: hostingPlan.name,
				hostingType: hostingSubscription.hostingType,
				billingCycle: hostingSubscription.billingCycle,
				expiryDate: hostingSubscription.expiryDate,
				nextRenewalDate: hostingSubscription.nextRenewalDate,
				autoRenew: hostingSubscription.autoRenew,
				teamId: hostingSubscription.teamId,
			})
			.from(hostingSubscription)
			.leftJoin(hostingPlan, eq(hostingSubscription.hostingPlanId, hostingPlan.id))
			.where(inArray(hostingSubscription.pleskFilterId, idStrs));

		const teamIds = [...new Set(hsSubs.map((r) => r.teamId).filter(Boolean))] as string[];
		const teamsMap = new Map<string, string>();
		if (teamIds.length > 0) {
			const teams = await db
				.select({ id: teamTable.id, name: teamTable.name })
				.from(teamTable)
				.where(inArray(teamTable.id, teamIds));
			teams.forEach((t) => teamsMap.set(t.id, t.name));
		}

		hsSubs.forEach((row) => {
			if (!row.pleskFilterId) return;
			const id = parseInt(row.pleskFilterId, 10);
			if (!isNaN(id))
				billingMap.set(id, {
					planName: row.planName ?? null,
					hostingType: row.hostingType ?? null,
					billingCycle: row.billingCycle ?? null,
					expiryDate: row.expiryDate?.toISOString() ?? null,
					nextRenewalDate: row.nextRenewalDate?.toISOString() ?? null,
					autoRenew: row.autoRenew ?? null,
					teamId: row.teamId ?? null,
					teamName: row.teamId ? (teamsMap.get(row.teamId) ?? null) : null,
				});
		});
	}

	const resources: HostingResourceEntry[] = pleskMapped.map((m) => {
		const billing = m._pleskId ? billingMap.get(m._pleskId) ?? null : null;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _pleskId, ...rest } = m;
		return {
			...rest,
			planName: billing?.planName ?? null,
			hostingType: billing?.hostingType ?? null,
			billingCycle: billing?.billingCycle ?? null,
			expiryDate: billing?.expiryDate ?? null,
			nextRenewalDate: billing?.nextRenewalDate ?? null,
			autoRenew: billing?.autoRenew ?? null,
			teamName: billing?.teamName ?? null,
		};
	});

	return {
		_tool: "get_hosting_resources",
		isAgency: true,
		teamName: null,
		resources,
		totalCount: resources.length,
		activeCount: resources.filter((r) => r.status === "Active").length,
		suspendedCount: resources.filter((r) => r.status === "Suspended").length,
		checkedAt,
	};
}

// ── get_hosting_detail ────────────────────────────────────────────────────────

export async function agentGetHostingDetail(params: {
	domain: string;
	isAgency: boolean;
	teamId: string | null;
	includeDns: boolean;
	includeMail: boolean;
	includeSubdomains: boolean;
	includeDatabases: boolean;
}): Promise<HostingDetailResult> {
	const { domain, isAgency, teamId, includeDns, includeMail, includeSubdomains, includeDatabases } = params;
	const domainLower = domain.toLowerCase().trim();
	const checkedAt = new Date().toISOString();

	const empty: HostingDetailResult = {
		_tool: "get_hosting_detail",
		domain: domainLower,
		found: false,
		status: "Unknown",
		ipAddress: null,
		sslEnabled: false,
		certificateName: null,
		diskUsageBytes: 0,
		diskLimitBytes: 0,
		diskUsageFormatted: "0 B",
		diskLimitFormatted: "—",
		trafficBytes: 0,
		trafficFormatted: "0 B",
		mailboxCount: 0,
		databaseCount: 0,
		subdomainCount: 0,
		createdAt: null,
		planName: null,
		hostingType: null,
		billingCycle: null,
		expiryDate: null,
		nextRenewalDate: null,
		autoRenew: null,
		teamName: null,
		checkedAt,
	};

	// ── Customer: verify ownership ───────────────────────────────────
	let resolvedPleskId: number | null = null;

	if (!isAgency) {
		if (!teamId) return { ...empty, error: "Team context is required." };

		// Find subscription for this team + domain
		const subRow = await db
			.select({
				pleskFilterId: niscClientSubscription.pleskFilterId,
				serviceRefs: niscClientSubscription.serviceRefs,
				name: niscClientSubscription.name,
				billingCycle: niscClientSubscription.billingCycle,
				expiryDate: niscClientSubscription.expiryDate,
				autoRenew: niscClientSubscription.autoRenew,
			})
			.from(niscClientSubscription)
			.where(
				and(
					eq(niscClientSubscription.teamId, teamId),
					eq(niscClientSubscription.primaryDomain, domainLower),
				),
			)
			.limit(1)
			.then((r) => r[0] ?? null);

		if (!subRow) {
			return {
				...empty,
				accessDenied: true,
				error: "This hosting subscription does not belong to your organisation.",
			};
		}

		// Resolve Plesk ID
		const refs = subRow.serviceRefs as Record<string, unknown> | null;
		if (refs?.pleskSubscriptionId)
			resolvedPleskId = parseInt(String(refs.pleskSubscriptionId), 10) || null;
		if (!resolvedPleskId && subRow.pleskFilterId)
			resolvedPleskId = parseInt(subRow.pleskFilterId, 10) || null;

		if (!resolvedPleskId || !process.env.PLESK_XML_ENDPOINT) {
			// Return DB-only result
			return {
				...empty,
				found: true,
				planName: subRow.name ?? null,
				billingCycle: subRow.billingCycle ?? null,
				expiryDate: subRow.expiryDate?.toISOString() ?? null,
				autoRenew: subRow.autoRenew ?? null,
				pleskUnavailable: true,
			};
		}
	}

	// ── Fetch from Plesk by domain name ──────────────────────────────
	const filterXml = resolvedPleskId
		? `<filter><id>${resolvedPleskId}</id></filter>`
		: `<filter><name>${escapeXml(domainLower)}</name></filter>`;

	const webspaces = await fetchPleskWebspaces(filterXml);
	const ws = webspaces[0];

	if (!ws) {
		if (!isAgency) {
			// Try DB-only fallback
			const subRow = await db
				.select({
					name: niscClientSubscription.name,
					billingCycle: niscClientSubscription.billingCycle,
					expiryDate: niscClientSubscription.expiryDate,
					autoRenew: niscClientSubscription.autoRenew,
				})
				.from(niscClientSubscription)
				.where(and(eq(niscClientSubscription.teamId, teamId!), eq(niscClientSubscription.primaryDomain, domainLower)))
				.limit(1)
				.then((r) => r[0] ?? null);
			if (subRow) {
				return {
					...empty,
					found: true,
					planName: subRow.name ?? null,
					billingCycle: subRow.billingCycle ?? null,
					expiryDate: subRow.expiryDate?.toISOString() ?? null,
					autoRenew: subRow.autoRenew ?? null,
					pleskUnavailable: true,
				};
			}
		}
		return {
			...empty,
			error: isAgency
				? "No hosting subscription found for this domain in Plesk."
				: "Hosting details are unavailable.",
			pleskUnavailable: !process.env.PLESK_XML_ENDPOINT,
		};
	}

	const mapped = mapPleskWebspace(ws);

	// ── DB billing enrichment ─────────────────────────────────────────
	let billing: DbBillingRow | null = null;
	if (mapped._pleskId) {
		billing = await fetchDbBillingByPleskId(mapped._pleskId);
	}

	// For customer, if billing not found via pleskId lookup, attach what we already know
	if (!billing && !isAgency && teamId) {
		const subRow = await db
			.select({
				name: niscClientSubscription.name,
				billingCycle: niscClientSubscription.billingCycle,
				expiryDate: niscClientSubscription.expiryDate,
				nextRenewalDate: niscClientSubscription.nextRenewalDate,
				autoRenew: niscClientSubscription.autoRenew,
			})
			.from(niscClientSubscription)
			.where(and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.primaryDomain, domainLower)))
			.limit(1)
			.then((r) => r[0] ?? null);
		if (subRow) {
			billing = {
				planName: subRow.name ?? null,
				hostingType: null,
				billingCycle: subRow.billingCycle ?? null,
				expiryDate: subRow.expiryDate?.toISOString() ?? null,
				nextRenewalDate: subRow.nextRenewalDate?.toISOString() ?? null,
				autoRenew: subRow.autoRenew ?? null,
				teamId,
				teamName: null,
			};
		}
	}

	// ── Optional sections (fetched in parallel, only when requested) ─
	const pleskId = mapped._pleskId;
	const [dnsRecords, mailAccounts, subdomains, databases] = await Promise.all([
		includeDns && pleskId ? fetchPleskDnsRecords(pleskId) : Promise.resolve(undefined),
		includeMail && pleskId ? fetchPleskMailAccounts(pleskId, domainLower) : Promise.resolve(undefined),
		includeSubdomains ? fetchPleskSubdomains(domainLower) : Promise.resolve(undefined),
		includeDatabases && pleskId ? fetchPleskDatabases(pleskId) : Promise.resolve(undefined),
	]);

	return {
		_tool: "get_hosting_detail",
		domain: domainLower,
		found: true,
		status: mapped.status,
		ipAddress: mapped.ipAddress,
		sslEnabled: mapped.sslEnabled,
		certificateName: mapped.certificateName,
		diskUsageBytes: mapped.diskUsageBytes,
		diskLimitBytes: mapped.diskLimitBytes,
		diskUsageFormatted: mapped.diskUsageFormatted,
		diskLimitFormatted: mapped.diskLimitFormatted,
		trafficBytes: mapped.trafficBytes,
		trafficFormatted: mapped.trafficFormatted,
		mailboxCount: mapped.mailboxCount,
		databaseCount: mapped.databaseCount,
		subdomainCount: mapped.subdomainCount,
		createdAt: mapped.createdAt,
		planName: billing?.planName ?? null,
		hostingType: billing?.hostingType ?? null,
		billingCycle: billing?.billingCycle ?? null,
		expiryDate: billing?.expiryDate ?? null,
		nextRenewalDate: billing?.nextRenewalDate ?? null,
		autoRenew: billing?.autoRenew ?? null,
		teamName: isAgency ? (billing?.teamName ?? null) : null,
		...(dnsRecords !== undefined ? { dnsRecords } : {}),
		...(mailAccounts !== undefined ? { mailAccounts } : {}),
		...(subdomains !== undefined ? { subdomains } : {}),
		...(databases !== undefined ? { databases } : {}),
		checkedAt,
	};
}
