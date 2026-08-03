/** All KENIC TLDs we can parse / exact-match (includes specialty SLDs). */
export const KENIC_SUPPORTED_TLDS = [
  "ke",
  "co.ke",
  "or.ke",
  "ne.ke",
  "me.ke",
  "mobi.ke",
  "info.ke",
  "sc.ke",
  "ac.ke",
] as const;

/**
 * Kenyan TLDs shown in domain search lists.
 * Specialty SLDs (or.ke, ac.ke, etc.) are only shown via exact-match search.
 */
export const KENIC_SEARCH_TLDS = ["ke", "co.ke"] as const;

/**
 * Recognized KENIC SLDs that cannot be purchased through nPanel.
 * Never show these in search results or offer add-to-cart.
 */
export const KENIC_UNAVAILABLE_TLDS = ["go.ke"] as const;

export type KenicTldSlug = (typeof KENIC_SUPPORTED_TLDS)[number];
export type KenicSearchTldSlug = (typeof KENIC_SEARCH_TLDS)[number];

export interface KenicCardItem {
  domain: string;
  tld: string;
  available: boolean;
  reason?: string;
  currency: string;
  createPrice?: number;
  renewPrice?: number;
  transferPrice?: number;
}

export function buildKenicDomainsFromQuery(searchQuery: string): string[] {
  const name = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
  if (!name) return [];
  return KENIC_SEARCH_TLDS.map((tld) => `${name}.${tld}`);
}

const KENIC_TLD_SET = new Set(KENIC_SUPPORTED_TLDS);
const KENIC_UNAVAILABLE_SET = new Set<string>(KENIC_UNAVAILABLE_TLDS);

export function parseFullDomain(input: string): { name: string; tld: string } | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  const parts = s.split(".");
  if (parts.length < 2 || parts.some((p) => !p.length)) return null;
  if (parts.length === 2) {
    return { name: parts[0]!, tld: parts[1]! };
  }
  const last = parts.at(-1) ?? "";
  const secondLast = parts.at(-2) ?? "";
  if (last === "ke" && secondLast) {
    const twoPartTld = `${secondLast}.${last}`;
    if (
      KENIC_TLD_SET.has(twoPartTld as KenicTldSlug) ||
      KENIC_UNAVAILABLE_SET.has(twoPartTld)
    ) {
      return { name: parts.slice(0, -2).join("."), tld: twoPartTld };
    }
  }
  if (last === "ke") {
    return { name: parts.slice(0, -1).join("."), tld: "ke" };
  }
  return { name: parts.slice(0, -1).join("."), tld: last };
}

/** True if TLD is managed by KENIC and purchasable through nPanel. */
export function isKenicTld(tld: string): boolean {
  const lower = tld.toLowerCase();
  if (KENIC_UNAVAILABLE_SET.has(lower)) return false;
  return KENIC_TLD_SET.has(lower as KenicTldSlug);
}

/** True if this TLD/domain cannot be purchased (e.g. .go.ke). */
export function isUnavailableKenicTld(tldOrDomain: string): boolean {
  const lower = tldOrDomain.toLowerCase().replace(/^\./, "");
  if (KENIC_UNAVAILABLE_SET.has(lower)) return true;
  for (const blocked of KENIC_UNAVAILABLE_TLDS) {
    if (lower === blocked || lower.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function stripKenyanTldFromQuery(query: string): string {
  const lower = query.trim().toLowerCase();
  const sorted = [...KENIC_SUPPORTED_TLDS, ...KENIC_UNAVAILABLE_TLDS].sort(
    (a, b) => b.length - a.length,
  );
  for (const tld of sorted) {
    if (lower.endsWith("." + tld)) return lower.slice(0, -(tld.length + 1));
  }
  return lower;
}

export function normalizedItemToKenicCard(item: {
  domain: string;
  available: boolean;
  reason?: string;
  currency?: string;
  createFee?: { amount: number; currency: string };
  renewFee?: { amount: number; currency: string };
  transferFee?: { amount: number; currency: string };
}): KenicCardItem {
  const domain = item.domain.toLowerCase();
  const parts = domain.split(".");
  const last = parts.at(-1) ?? "";
  const secondLast = parts.at(-2) ?? "";
  const tldDisplay =
    last === "ke" && secondLast && KENIC_TLD_SET.has(`${secondLast}.ke` as KenicTldSlug)
      ? `.${secondLast}.ke`
      : last === "ke"
        ? ".ke"
        : `.${last}`;
  return {
    domain: item.domain,
    tld: tldDisplay,
    available: item.available,
    reason: item.reason,
    currency: item.currency ?? "KES",
    createPrice: item.createFee?.amount,
    renewPrice: item.renewFee?.amount,
    transferPrice: item.transferFee?.amount,
  };
}

export function normalizeToKenicCards(
  searchQuery: string,
  normalized: Array<{
    domain: string;
    available: boolean;
    reason?: string;
    currency?: string;
    createFee?: { amount: number; currency: string };
    renewFee?: { amount: number; currency: string };
    transferFee?: { amount: number; currency: string };
  }>,
): KenicCardItem[] {
  const name = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
  if (!name) return [];

  const byDomain = new Map(
    normalized.map((item) => [
      item.domain.toLowerCase(),
      {
        available: item.available,
        reason: item.reason,
        currency: item.currency ?? "KES",
        createPrice: item.createFee?.amount,
        renewPrice: item.renewFee?.amount,
        transferPrice: item.transferFee?.amount,
      },
    ]),
  );

  return KENIC_SEARCH_TLDS.map((tldSlug) => {
    const domain = `${name}.${tldSlug}`;
    const tldDisplay = tldSlug === "ke" ? ".ke" : `.${tldSlug}`;
    const data = byDomain.get(domain);
    if (data) {
      return {
        domain,
        tld: tldDisplay,
        available: data.available,
        reason: data.reason,
        currency: data.currency,
        createPrice: data.createPrice,
        renewPrice: data.renewPrice,
        transferPrice: data.transferPrice,
      };
    }
    return {
      domain,
      tld: tldDisplay,
      available: false,
      currency: "KES",
      reason: "Check failed or not returned",
    };
  });
}
