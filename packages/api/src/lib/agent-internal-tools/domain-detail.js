/**
 * Domain detail lookup for the Zeepo AI Agent.
 *
 * Given a FQDN, resolves full domain detail from the appropriate backend:
 *  - gTLDs   → OpenProvider REST API (searchDomains with pattern)
 *  - .ke TLDs → KENIC EPP (domain:info) for live data, DB fallback
 *
 * Authorization:
 *  - Agency users can look up any domain that appears in their portfolio.
 *  - Customer users may only look up domains belonging to their team's
 *    nisc_client_subscription records.
 *
 * Optional sections (fetched only when the caller sets the flag):
 *  - nameservers  – always included by default for overview; this flag adds
 *                   the full server list when not already part of overview
 *  - dns          – Plesk DNS records; only returned when a Plesk webspace
 *                   for the domain exists (hasHosting must be true)
 */
import { and, eq, ilike, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { hostingSubscription } from "@npanel/db/schema/hosting";
import { createOpenProviderClient } from "../openprovider-client";
import { getRedisClient } from "../redis";
import { isKenicDomain } from "../epp/kenic-tlds";
import { createConnection, readFrame, sendFrame } from "../epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildDomainInfoXml, } from "../epp/epp-xml";
import { getKenicEppConfig } from "../epp/kenic-config";
import { sendPleskXmlRequest } from "../plesk/xml-client";
import { XMLParser } from "fast-xml-parser";
// ── OpenProvider token cache (shared with other tools) ────────────────────────
const OP_TOKEN_KEY = "openprovider:auth-token";
async function getOpToken() {
    const redis = getRedisClient();
    if (!redis)
        return null;
    try {
        const cached = await redis.get(OP_TOKEN_KEY);
        if (!cached)
            return null;
        const parsed = typeof cached === "string"
            ? JSON.parse(cached)
            : cached;
        if (parsed?.token &&
            typeof parsed.expiresAt === "number" &&
            parsed.expiresAt > Date.now())
            return parsed.token;
    }
    catch {
        /* ignore */
    }
    return null;
}
async function cacheOpToken(token) {
    const redis = getRedisClient();
    if (!redis)
        return;
    const TTL = 47 * 60 * 60;
    await redis
        .setex(OP_TOKEN_KEY, TTL, JSON.stringify({ token, expiresAt: Date.now() + TTL * 1000 }))
        .catch(() => { });
}
// ── XML helper ────────────────────────────────────────────────────────────────
function escapeXml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
function pleskScalar(value) {
    if (value == null)
        return undefined;
    if (typeof value === "string" || typeof value === "number")
        return String(value).trim();
    if (typeof value === "object" && "#text" in value) {
        const t = value["#text"];
        return t == null ? undefined : String(t).trim();
    }
    return undefined;
}
// ── Customer ownership guard ──────────────────────────────────────────────────
async function customerOwnsDomain(teamId, domainFqdn) {
    const domainProducts = await db
        .select({ id: niscProduct.id })
        .from(niscProduct)
        .where(and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%domains%")));
    const productIds = domainProducts.map((p) => p.id);
    if (!productIds.length)
        return false;
    const row = await db
        .select({ id: niscClientSubscription.id })
        .from(niscClientSubscription)
        .where(and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.primaryDomain, domainFqdn.toLowerCase())))
        .limit(1)
        .then((r) => r[0] ?? null);
    return !!row;
}
// ── Plesk hosting check ───────────────────────────────────────────────────────
async function getHostingInfo(domainName, teamId, isAgency) {
    if (!process.env.PLESK_XML_ENDPOINT)
        return { hasHosting: false, pleskSiteId: null, planName: null };
    try {
        const xmlReq = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter><name>${escapeXml(domainName)}</name></filter>
      <dataset><gen_info/></dataset>
    </get>
  </webspace>
</packet>`;
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlReq);
        if (isHostUnreachable || isAuthError || !xml?.trim())
            return { hasHosting: false, pleskSiteId: null, planName: null };
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(xml);
        const rawResult = parsed?.packet?.webspace?.get?.result;
        if (!rawResult)
            return { hasHosting: false, pleskSiteId: null, planName: null };
        const result = (Array.isArray(rawResult) ? rawResult[0] : rawResult);
        const st = pleskScalar(result.status);
        if (st?.toLowerCase() === "error")
            return { hasHosting: false, pleskSiteId: null, planName: null };
        const s = pleskScalar(result.id);
        let pleskSiteId = s ? parseInt(s.replace(/\s/g, ""), 10) : null;
        if (pleskSiteId != null && isNaN(pleskSiteId))
            pleskSiteId = null;
        // For customers, verify the webspace is linked to their team.
        if (!isAgency && teamId && pleskSiteId) {
            const idStr = String(pleskSiteId);
            const [direct, viaHosting] = await Promise.all([
                db
                    .select({ id: niscClientSubscription.id })
                    .from(niscClientSubscription)
                    .where(and(eq(niscClientSubscription.teamId, teamId), or(eq(niscClientSubscription.pleskFilterId, idStr), sql `(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`)))
                    .limit(1)
                    .then((r) => r[0] ?? null),
                db
                    .select({ id: niscClientSubscription.id })
                    .from(niscClientSubscription)
                    .innerJoin(hostingSubscription, eq(niscClientSubscription.hostingSubscriptionId, hostingSubscription.id))
                    .where(and(eq(niscClientSubscription.teamId, teamId), eq(hostingSubscription.pleskFilterId, idStr)))
                    .limit(1)
                    .then((r) => r[0] ?? null),
            ]);
            if (!direct && !viaHosting)
                return { hasHosting: false, pleskSiteId: null, planName: null };
        }
        // Resolve the hosting plan name from DB.
        let planName = null;
        if (pleskSiteId) {
            const idStr = String(pleskSiteId);
            const row = await db
                .select({ planName: niscClientSubscription.name })
                .from(niscClientSubscription)
                .where(or(eq(niscClientSubscription.pleskFilterId, idStr), sql `(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`))
                .limit(1)
                .then((r) => r[0] ?? null);
            planName = row?.planName ?? null;
        }
        return { hasHosting: !!pleskSiteId, pleskSiteId, planName };
    }
    catch {
        return { hasHosting: false, pleskSiteId: null, planName: null };
    }
}
// ── Plesk DNS fetch ────────────────────────────────────────────────────────────
async function getPleskDnsRecords(siteId) {
    try {
        const xmlReq = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <get_rec>
      <filter><site-id>${siteId}</site-id></filter>
    </get_rec>
  </dns>
</packet>`;
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlReq);
        if (isHostUnreachable || isAuthError || !xml?.trim())
            return [];
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(xml);
        const results = parsed?.packet?.dns?.get_rec?.result;
        if (!results)
            return [];
        const rows = Array.isArray(results) ? results : [results];
        const records = [];
        for (const r of rows) {
            const data = r?.data;
            if (!data)
                continue;
            const type = pleskScalar(data.type);
            const host = pleskScalar(data.host) ?? pleskScalar(data.name) ?? "";
            const value = pleskScalar(data.value) ?? pleskScalar(data.pointsTo) ?? "";
            const ttl = data.ttl ? parseInt(String(pleskScalar(data.ttl) ?? ""), 10) : undefined;
            if (type)
                records.push({ type, host, value, ...(ttl && !isNaN(ttl) ? { ttl } : {}) });
        }
        return records;
    }
    catch {
        return [];
    }
}
// ── OpenProvider domain lookup ────────────────────────────────────────────────
async function lookupOpenProvider(domain) {
    try {
        const client = createOpenProviderClient();
        const cached = await getOpToken();
        if (cached) {
            client.setToken(cached);
        }
        else {
            const auth = await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME ?? "",
                password: process.env.OPENPROVIDER_PASSWORD ?? "",
            });
            if (auth?.data?.token)
                await cacheOpToken(auth.data.token);
        }
        // Use the SLD (first label) as the search pattern
        const sld = domain.split(".")[0] ?? domain;
        const resp = await client.searchDomains({
            domain_name_pattern: sld,
            limit: 100,
            offset: 0,
            with_customer_info: false,
        });
        if (resp?.code !== 0)
            return { found: false };
        const results = (resp.data?.results ?? []);
        // Find exact match
        const match = results.find((d) => {
            const name = typeof d.domain === "object"
                ? `${d.domain.name}.${d.domain.extension}`
                : String(d.domain ?? "");
            return name.toLowerCase() === domain.toLowerCase();
        });
        if (!match)
            return { found: false };
        const nsList = Array.isArray(match.name_servers)
            ? match.name_servers
            : match.name_servers
                ? [match.name_servers]
                : [];
        const statusMap = {
            ACT: "ACTIVE",
            REQ: "PENDING",
            DEL: "EXPIRED",
            FAIL: "SUSPENDED",
        };
        return {
            found: true,
            status: statusMap[String(match.status ?? "").toUpperCase()] ?? String(match.status ?? "UNKNOWN"),
            expiryDate: match.expiration_date ?? null,
            registrationDate: match.creation_date ?? null,
            renewalDate: match.renewal_date ?? null,
            autoRenewal: match.autorenew === "on",
            nameservers: nsList.map((ns) => (typeof ns === "string" ? ns : ns.name ?? String(ns))).filter(Boolean),
            registrantHandle: match.owner_handle,
            adminHandle: match.admin_handle,
            techHandle: match.tech_handle,
            isLocked: match.is_locked ?? false,
            isDnssecEnabled: match.is_dnssec_enabled ?? false,
        };
    }
    catch {
        return { found: false };
    }
}
// ── KENIC EPP lookup ──────────────────────────────────────────────────────────
async function lookupKenic(domain) {
    let socket;
    try {
        const config = getKenicEppConfig(true);
        socket = await createConnection(config);
        await readFrame(socket); // greeting
        sendFrame(socket, buildLoginXml(config.username, config.password));
        const loginXml = (await readFrame(socket)).toString("utf8");
        const parser = new XMLParser({ ignoreAttributes: false });
        const loginParsed = parser.parse(loginXml);
        const loginRes = loginParsed?.epp?.response?.result;
        const loginCode = String((Array.isArray(loginRes) ? loginRes[0] : loginRes)?.["@_code"] ?? "0");
        if (loginCode !== "1000")
            return { found: false };
        sendFrame(socket, buildDomainInfoXml(domain));
        const infoXml = (await readFrame(socket)).toString("utf8");
        const infoParsed = parser.parse(infoXml);
        const infoResult = infoParsed?.epp?.response?.result;
        const infoCode = String((Array.isArray(infoResult) ? infoResult[0] : infoResult)?.["@_code"] ?? "0");
        if (infoCode !== "1000")
            return { found: false };
        const infoData = infoParsed?.epp?.response?.resData?.["domain:infData"];
        const nsList = infoData?.["domain:ns"]?.["domain:hostObj"];
        const nameservers = Array.isArray(nsList) ? nsList : nsList ? [nsList] : [];
        sendFrame(socket, buildLogoutXml());
        await readFrame(socket).catch(() => { });
        return {
            found: true,
            status: "ACTIVE",
            expiryDate: infoData?.["domain:exDate"] ?? null,
            registrationDate: infoData?.["domain:crDate"] ?? null,
            nameservers: nameservers.filter(Boolean),
        };
    }
    catch {
        return { found: false };
    }
    finally {
        socket?.destroy?.();
    }
}
// ── KENIC DB fallback (for customer, or when EPP is unavailable) ──────────────
async function lookupKenicFromDb(domain, teamId) {
    const q = teamId
        ? and(eq(niscClientSubscription.primaryDomain, domain.toLowerCase()), eq(niscClientSubscription.teamId, teamId))
        : eq(niscClientSubscription.primaryDomain, domain.toLowerCase());
    const row = await db
        .select({
        status: niscClientSubscription.status,
        expiryDate: niscClientSubscription.expiryDate,
        subscriptionDate: niscClientSubscription.subscriptionDate,
    })
        .from(niscClientSubscription)
        .where(q)
        .limit(1)
        .then((r) => r[0] ?? null);
    if (!row)
        return { found: false };
    const now = new Date();
    const expiry = row.expiryDate;
    const isExpired = expiry ? expiry < now : false;
    const statusMap = {
        ACTIVE: "ACTIVE",
        PENDING: "PENDING",
        PROCESSING: "PENDING",
        SUSPENDED: "SUSPENDED",
        CANCELLED: "EXPIRED",
        EXPIRED: "EXPIRED",
    };
    return {
        found: true,
        status: isExpired ? "EXPIRED" : (statusMap[row.status] ?? "UNKNOWN"),
        expiryDate: row.expiryDate?.toISOString() ?? null,
        registrationDate: row.subscriptionDate?.toISOString() ?? null,
    };
}
// ── Public entry point ────────────────────────────────────────────────────────
export async function agentGetDomainDetail(params) {
    const { domain, isAgency, teamId, includeNameservers, includeDns } = params;
    const domainLower = domain.toLowerCase().trim();
    const checkedAt = new Date().toISOString();
    const isKenic = isKenicDomain(domainLower);
    // ── Customer ownership check ─────────────────────────────────────
    if (!isAgency && teamId) {
        const owns = await customerOwnsDomain(teamId, domainLower);
        if (!owns) {
            return {
                _tool: "get_domain_detail",
                domain: domainLower,
                found: false,
                accessDenied: true,
                hasHosting: false,
                error: "This domain is not registered under your organisation.",
                checkedAt,
            };
        }
    }
    // ── Domain registry lookup ────────────────────────────────────────
    let registryData = { found: false };
    let source = "subscription";
    if (isKenic) {
        source = "kenic";
        // Try live EPP first; fall back to DB if unavailable.
        const eppData = await lookupKenic(domainLower);
        if (eppData.found) {
            registryData = eppData;
        }
        else {
            const dbData = await lookupKenicFromDb(domainLower, isAgency ? null : teamId);
            registryData = dbData;
        }
    }
    else {
        source = "openprovider";
        registryData = await lookupOpenProvider(domainLower);
        // For customer with no OP data, fall back to subscription DB record.
        if (!registryData.found && !isAgency && teamId) {
            source = "subscription";
            const dbData = await lookupKenicFromDb(domainLower, teamId);
            registryData = dbData;
        }
    }
    if (!registryData.found) {
        return {
            _tool: "get_domain_detail",
            domain: domainLower,
            found: false,
            hasHosting: false,
            error: isAgency
                ? "Domain not found in the Nisc Cloud portfolio."
                : "Domain not found in your organisation's subscriptions.",
            checkedAt,
        };
    }
    // ── Hosting check (always) ────────────────────────────────────────
    const { hasHosting, pleskSiteId, planName } = await getHostingInfo(domainLower, teamId, isAgency);
    // ── DNS records (optional, only when hosting present) ────────────
    let dnsRecords;
    let dnsNote;
    if (includeDns) {
        if (hasHosting && pleskSiteId) {
            dnsRecords = await getPleskDnsRecords(pleskSiteId);
        }
        else {
            dnsNote = hasHosting
                ? "DNS records unavailable (Plesk site ID could not be resolved)."
                : "DNS records are only available for domains connected to a Nisc Cloud hosting plan.";
        }
    }
    return {
        _tool: "get_domain_detail",
        domain: domainLower,
        found: true,
        source,
        status: registryData.status,
        expiryDate: registryData.expiryDate ?? null,
        registrationDate: registryData.registrationDate ?? null,
        renewalDate: registryData.renewalDate ?? null,
        autoRenewal: registryData.autoRenewal,
        registrantHandle: registryData.registrantHandle,
        registrantName: registryData.registrantName,
        registrantEmail: registryData.registrantEmail,
        adminHandle: registryData.adminHandle,
        techHandle: registryData.techHandle,
        isLocked: registryData.isLocked,
        isDnssecEnabled: registryData.isDnssecEnabled,
        hasHosting,
        hostingPlanName: planName,
        ...(includeNameservers ? { nameservers: registryData.nameservers ?? [] } : {}),
        ...(includeDns
            ? {
                dnsRecords: dnsRecords ?? [],
                ...(dnsNote ? { dnsNote } : {}),
            }
            : {}),
        checkedAt,
    };
}
