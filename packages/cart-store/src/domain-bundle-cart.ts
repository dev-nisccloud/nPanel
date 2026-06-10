import type { DomainBundleCartItem, DomainCartItem } from "./cart-store";

export type DomainBundleCartDomain = {
  domain: string;
  status?: string;
  reason?: string;
  price?: DomainCartItem["price"];
};

export function createBundleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bundle-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Build a display label such as `example.com + .co.ke + .info`. */
export function formatDomainBundleLabel(domainNames: string[]): string {
  if (domainNames.length === 0) return "Domain bundle";
  const [first, ...rest] = domainNames;
  const firstTld = first?.includes(".") ? first.split(".").slice(1).join(".") : first;
  const parts = [first ?? "bundle"];
  for (const name of rest) {
    const tld = name.includes(".") ? name.split(".").slice(1).join(".") : name;
    parts.push(`.${tld}`);
  }
  return parts.join(" + ");
}

export function bundleDomainKey(domainNames: string[]): string {
  return domainNames
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

export function createDomainBundleCartItem(
  params: {
    domains: DomainBundleCartDomain[];
    bundlePrice: number;
    bundleCurrency?: string;
    bundleLabel?: string;
    addedInCurrency?: string;
    bundleId?: string;
  },
): Omit<DomainBundleCartItem, "id" | "type" | "addedAt"> {
  const domainNames = params.domains.map((d) => d.domain).filter(Boolean);
  return {
    bundleId: params.bundleId ?? createBundleId(),
    bundlePrice: params.bundlePrice,
    bundleCurrency: params.bundleCurrency ?? "KES",
    bundleLabel: params.bundleLabel ?? formatDomainBundleLabel(domainNames),
    domains: params.domains,
    addedInCurrency: params.addedInCurrency,
  };
}

export function getDomainBundleCartLinePrice(item: DomainBundleCartItem): number {
  return item.bundlePrice;
}

export function getDomainBundleCartLineCurrency(item: DomainBundleCartItem): string {
  return item.addedInCurrency ?? item.bundleCurrency ?? "KES";
}
