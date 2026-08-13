import { request, Agent } from "undici";
import { asArray, pleskXmlInt, pleskXmlScalar, sendPleskXmlOrThrow } from "./xml-utils";
import { getPleskPanelBase } from "./session";

/**
 * Plesk XML get-db only returns subscription id (`webspace-id`), not related site.
 * Related site is REST `parent_domain` (domain/site id). 0 / missing means none.
 *
 * @see https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-databases/retrieving-information-about-databases.34431/
 * @see https://talk.plesk.com/threads/plesk-restful-api-database-site.360270/
 */
const restAgent = new Agent({
  connections: 4,
  pipelining: 1,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 60000,
});

type RestDatabase = {
  id?: unknown;
  parent_domain?: unknown;
};

type RestDomain = {
  id?: unknown;
  name?: unknown;
  ascii_name?: unknown;
};

function secretKey(): string | null {
  const key = process.env.PLESK_SECRET_KEY;
  return key?.trim() || null;
}

async function pleskRestGetJson(path: string): Promise<{ status: number; body: unknown } | null> {
  const key = secretKey();
  if (!key) return null;
  try {
    const response = await request(`${getPleskPanelBase()}/api/v2${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": key,
      },
      dispatcher: restAgent,
      signal: AbortSignal.timeout(20000),
    });
    const text = await response.body.text();
    if (!text.trim()) return { status: response.statusCode, body: null };
    try {
      return { status: response.statusCode, body: JSON.parse(text) as unknown };
    } catch {
      return { status: response.statusCode, body: null };
    }
  } catch (error) {
    console.error("[Plesk related site] REST GET failed:", path, error);
    return null;
  }
}

function parsePositiveId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const n = parseInt(value.trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function parseDomainName(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

/** REST GET may return parent_domain as a number or `{ id, name }`. */
function parseParentDomain(value: unknown): { id: number | null; name: string | null } {
  if (value == null) return { id: null, name: null };
  if (typeof value === "number" || typeof value === "string") {
    const n =
      typeof value === "number"
        ? value
        : parseInt(String(value).trim(), 10);
    if (!Number.isFinite(n) || n <= 0) return { id: null, name: null };
    return { id: n, name: null };
  }
  if (typeof value === "object") {
    const obj = value as { id?: unknown; name?: unknown; ascii_name?: unknown };
    const id = parsePositiveId(obj.id);
    const name = parseDomainName(obj.name) || parseDomainName(obj.ascii_name);
    return { id, name };
  }
  return { id: null, name: null };
}

function xmlDbRows(parsed: Record<string, unknown>): Record<string, unknown>[] {
  const packet = parsed.packet as Record<string, unknown> | undefined;
  const database = packet?.database as Record<string, unknown> | undefined;
  const getDb = database?.["get-db"] as Record<string, unknown> | undefined;
  return asArray(getDb?.result).filter((row): row is Record<string, unknown> => {
    if (!row || typeof row !== "object") return false;
    return (pleskXmlInt((row as Record<string, unknown>).id) ?? 0) > 0;
  }) as Record<string, unknown>[];
}

function asRestDatabaseList(body: unknown): RestDatabase[] | null {
  if (!Array.isArray(body)) return null;
  return body.filter((row): row is RestDatabase => !!row && typeof row === "object");
}

function asRestDatabase(body: unknown): RestDatabase | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const row = body as RestDatabase;
  if (parsePositiveId(row.id) == null && row.parent_domain === undefined) return null;
  return row;
}

async function fetchRestDatabasesById(ids: number[]): Promise<Map<number, RestDatabase>> {
  const map = new Map<number, RestDatabase>();
  if (ids.length === 0) return map;

  const listed = await pleskRestGetJson("/databases");
  const list = listed?.status === 200 ? asRestDatabaseList(listed.body) : null;
  if (list) {
    const wanted = new Set(ids);
    for (const row of list) {
      const id = parsePositiveId(row.id);
      if (id && wanted.has(id)) map.set(id, row);
    }
  }

  const missing = ids.filter((id) => !map.has(id));
  const results = await Promise.all(
    missing.map(async (id) => {
      const res = await pleskRestGetJson(`/databases/${id}`);
      if (res?.status !== 200) return null;
      const row = asRestDatabase(res.body);
      return row ? ([id, row] as const) : null;
    }),
  );
  for (const item of results) {
    if (item) map.set(item[0], item[1]);
  }
  return map;
}

async function fetchRestDomainName(domainId: number): Promise<string | null> {
  const res = await pleskRestGetJson(`/domains/${domainId}`);
  if (res?.status !== 200) return null;
  const body = res.body as RestDomain | null;
  if (!body || typeof body !== "object") return null;
  return parseDomainName(body.name) || parseDomainName(body.ascii_name);
}

async function fetchXmlDomainName(domainId: number): Promise<string | null> {
  const fromSite = await fetchXmlNameByOperator("site", domainId);
  if (fromSite) return fromSite;
  return fetchXmlNameByOperator("webspace", domainId);
}

async function fetchXmlNameByOperator(
  operator: "site" | "webspace",
  id: number,
): Promise<string | null> {
  try {
    const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <${operator}>
    <get>
      <filter>
        <id>${id}</id>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </${operator}>
</packet>`);
    const packet = parsed.packet as Record<string, unknown> | undefined;
    const node = packet?.[operator] as Record<string, unknown> | undefined;
    const getNode = node?.get as Record<string, unknown> | undefined;
    const result = asArray(getNode?.result)[0] as Record<string, unknown> | undefined;
    if (!result || pleskXmlScalar(result.status)?.toLowerCase() === "error") return null;
    const data = result.data as Record<string, unknown> | undefined;
    const genInfo = data?.gen_info as Record<string, unknown> | undefined;
    return pleskXmlScalar(genInfo?.name) || pleskXmlScalar(genInfo?.["ascii-name"]) || null;
  } catch {
    return null;
  }
}

/**
 * Mutates parsed get-db results with `related-site-id` and `related-site-name`.
 * `related-site-id` is 0 when Plesk has no related site.
 */
export async function enrichPleskDatabasesWithRelatedSites(
  parsed: Record<string, unknown>,
): Promise<void> {
  const rows = xmlDbRows(parsed);
  if (rows.length === 0) return;

  const ids = rows
    .map((row) => pleskXmlInt(row.id))
    .filter((id): id is number => id != null && id > 0);

  const restById = await fetchRestDatabasesById(ids);
  const nameByDomainId = new Map<number, string>();

  const uniqueDomainIds = new Set<number>();
  for (const rest of restById.values()) {
    const parent = parseParentDomain(rest.parent_domain);
    if (parent.id) uniqueDomainIds.add(parent.id);
  }

  await Promise.all(
    [...uniqueDomainIds].map(async (domainId) => {
      const fromRest = await fetchRestDomainName(domainId);
      if (fromRest) {
        nameByDomainId.set(domainId, fromRest);
        return;
      }
      const fromXml = await fetchXmlDomainName(domainId);
      if (fromXml) nameByDomainId.set(domainId, fromXml);
    }),
  );

  for (const row of rows) {
    const dbId = pleskXmlInt(row.id);
    if (!dbId) continue;
    const rest = restById.get(dbId);
    if (!rest) continue;

    const parent = parseParentDomain(rest.parent_domain);
    const relatedId = parent.id ?? 0;
    const relatedName =
      parent.name || (relatedId > 0 ? nameByDomainId.get(relatedId) ?? null : null);

    row["related-site-id"] = relatedId;
    if (relatedName) row["related-site-name"] = relatedName;
  }
}
