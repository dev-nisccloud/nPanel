import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainBundleCheckoutContext } from "@/stores/global-buy-now-store";

function createBundleId(): string {
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

export function createDomainBundleCheckoutContext(params: {
	domains: DomainSearchResult[];
	bundlePrice: number;
	bundleCurrency?: string;
	bundleLabel?: string;
}): DomainBundleCheckoutContext {
	const domainNames = params.domains.map((d) => d.domain).filter(Boolean);
	return {
		bundleId: createBundleId(),
		bundlePrice: params.bundlePrice,
		bundleCurrency: params.bundleCurrency ?? "KES",
		bundleLabel: params.bundleLabel ?? formatDomainBundleLabel(domainNames),
		domains: params.domains,
	};
}
