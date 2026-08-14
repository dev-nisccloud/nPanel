import { request, Agent } from "undici";
import { asArray, pleskXmlInt, pleskXmlScalar, sendPleskXmlOrThrow } from "./xml-utils";
import { getPleskPanelBase } from "./session";
/**
 * Plesk "Related to" is domain_pref --show-assigned-database per site on the
 * subscription. There is no bulk XML/REST field for it, so we:
 *   1. list sites in one XML packet (webspace + child sites)
 *   2. call CLI for every site in parallel
 *
 * Do not use GET /api/v2/domains (whole server) or XML get-db webspace-id.
 */
const restAgent = new Agent({
    connections: 8,
    pipelining: 0,
    keepAliveTimeout: 60000,
    keepAliveMaxTimeout: 60000,
});
function secretKey() {
    const key = process.env.PLESK_SECRET_KEY;
    return key?.trim() || null;
}
async function pleskRestJson(method, path, body) {
    const key = secretKey();
    if (!key)
        return null;
    try {
        const response = await request(`${getPleskPanelBase()}/api/v2${path}`, {
            method,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-API-Key": key,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            dispatcher: restAgent,
            signal: AbortSignal.timeout(15000),
        });
        const text = await response.body.text();
        if (!text.trim())
            return { status: response.statusCode, body: null };
        try {
            return { status: response.statusCode, body: JSON.parse(text) };
        }
        catch {
            return { status: response.statusCode, body: null };
        }
    }
    catch (error) {
        console.error("[Plesk related site] REST failed:", method, path, error);
        return null;
    }
}
function parsePositiveId(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0)
        return value;
    if (typeof value === "string" && value.trim()) {
        const n = parseInt(value.trim(), 10);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return null;
}
function xmlGenInfoName(row) {
    const data = row.data;
    const genInfo = data?.gen_info;
    return pleskXmlScalar(genInfo?.name) || pleskXmlScalar(genInfo?.["ascii-name"]) || null;
}
function parseXmlGetResults(packet, operator) {
    const node = packet?.[operator];
    const getNode = node?.get;
    const sites = [];
    for (const result of asArray(getNode?.result)) {
        if (!result || typeof result !== "object")
            continue;
        const row = result;
        if (pleskXmlScalar(row.status)?.toLowerCase() === "error")
            continue;
        const id = pleskXmlInt(row.id);
        const name = xmlGenInfoName(row);
        if (id && name)
            sites.push({ id, name });
    }
    return sites;
}
async function fetchSitesOnWebspace(webspaceId) {
    const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        <id>${webspaceId}</id>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </webspace>
  <site>
    <get>
      <filter>
        <parent-id>${webspaceId}</parent-id>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </site>
</packet>`);
    const packet = parsed.packet;
    const byId = new Map();
    for (const site of [
        ...parseXmlGetResults(packet, "webspace"),
        ...parseXmlGetResults(packet, "site"),
    ]) {
        byId.set(site.id, site);
    }
    return [...byId.values()];
}
async function fetchAssignedDatabaseId(domainName) {
    const res = await pleskRestJson("POST", "/cli/domain_pref/call", {
        params: ["--show-assigned-database", domainName],
    });
    if (res?.status !== 200 || !res.body || typeof res.body !== "object")
        return null;
    const payload = res.body;
    if (payload.code !== 0 && payload.code !== "0")
        return null;
    const firstLine = String(payload.stdout ?? "").trim().split(/\r?\n/)[0] ?? "";
    return parsePositiveId(firstLine);
}
/**
 * Database id → Plesk "Related to" site. Missing key means unconnected.
 */
export async function getRelatedSitesByDatabaseId(webspaceId) {
    const sites = await fetchSitesOnWebspace(webspaceId);
    const assigned = await Promise.all(sites.map(async (site) => {
        const databaseId = await fetchAssignedDatabaseId(site.name);
        return databaseId ? { databaseId, site } : null;
    }));
    const relatedByDbId = {};
    for (const item of assigned) {
        if (item)
            relatedByDbId[String(item.databaseId)] = item.site;
    }
    console.log(`[Plesk related site] webspace=${webspaceId} sites=${sites.length} assigned=${Object.keys(relatedByDbId).length}`);
    return relatedByDbId;
}
