export type SeoProject = {
  id: string;
  name: string;
  primaryDomain: string;
  locationCode: number;
  locationName: string;
  languageCode: string;
  brandEntities: string[];
  competitorDomains: string[];
  gscSiteId?: string | null;
  ga4PropertyId?: string | null;
  teamId?: string | null;
  createdById: string;
  archivedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function formatNumber(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return `${n.toFixed(1)}%`;
}

export function formatDate(value: unknown, fallback = "—"): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString();
}

/** Safely read a nested path from vendor JSON. */
export function getNested(obj: unknown, path: string, fallback: unknown = undefined): unknown {
  if (obj == null) return fallback;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return fallback;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur === undefined ? fallback : cur;
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: unknown[] }).items;
  }
  return [];
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function keywordFromItem(item: unknown): string {
  const r = asRecord(item);
  const fromKeywordData = getNested(r, "keyword_data.keyword");
  const fromKeyword = r.keyword;
  const fromKey = r.key;
  const val = fromKeywordData ?? fromKeyword ?? fromKey;
  return typeof val === "string" ? val : "";
}

export function searchVolumeFromItem(item: unknown): number | null {
  const r = asRecord(item);
  const v =
    getNested(r, "keyword_data.keyword_info.search_volume") ??
    getNested(r, "keyword_info.search_volume") ??
    r.search_volume;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function competitionFromItem(item: unknown): number | null {
  const r = asRecord(item);
  const v =
    getNested(r, "keyword_data.keyword_info.competition") ??
    getNested(r, "keyword_info.competition") ??
    r.competition;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function cpcFromItem(item: unknown): number | null {
  const r = asRecord(item);
  const v =
    getNested(r, "keyword_data.keyword_info.cpc") ??
    getNested(r, "keyword_info.cpc") ??
    r.cpc;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseCommaList(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const CREDENTIALS_TOAST =
  "DataForSEO credentials are not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.";
