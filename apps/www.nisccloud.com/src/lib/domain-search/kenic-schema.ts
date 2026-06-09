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

export type KenicTldSlug = (typeof KENIC_SUPPORTED_TLDS)[number];

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
  return KENIC_SUPPORTED_TLDS.map((tld) => `${name}.${tld}`);
}

const KENIC_TLD_SET = new Set(KENIC_SUPPORTED_TLDS);

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
    if (KENIC_TLD_SET.has(twoPartTld as KenicTldSlug)) {
      return { name: parts.slice(0, -2).join("."), tld: twoPartTld };
    }
  }
  if (last === "ke") {
    return { name: parts.slice(0, -1).join("."), tld: "ke" };
  }
  return { name: parts.slice(0, -1).join("."), tld: last };
}

export function isKenicTld(tld: string): boolean {
  return KENIC_TLD_SET.has(tld.toLowerCase() as KenicTldSlug);
}

export function stripKenyanTldFromQuery(query: string): string {
  const lower = query.trim().toLowerCase();
  const sorted = [...KENIC_SUPPORTED_TLDS].sort((a, b) => b.length - a.length);
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

  return KENIC_SUPPORTED_TLDS.map((tldSlug) => {
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
