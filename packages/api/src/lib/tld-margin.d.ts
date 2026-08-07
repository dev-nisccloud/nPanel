/**
 * Shared TLD margin helpers: normalize extension names, extract from domains,
 * apply PERCENTAGE/FIXED + roundOff, and load default + per-extension overrides.
 */
export type MarginConfig = {
    id?: string;
    name?: string;
    marginType: "PERCENTAGE" | "FIXED" | string | null;
    percentageMargin: string | null;
    fixedMargin: string | null;
    roundOff: string | null;
    isDefault?: boolean;
};
export type MarginMap = {
    default: MarginConfig | null;
    overrides: Record<string, MarginConfig>;
};
/** Lowercase, strip leading dots: `.COM` / `com` → `com`. */
export declare function normalizeTldExtension(input: string): string;
/**
 * Extension from a domain: everything after the first label.
 * `example.co.ke` → `co.ke`, `foo.com` → `com`.
 */
export declare function extractExtensionFromDomain(domain: string): string;
/** Same formula as use-domain-pricing / agent pricing. */
export declare function applyMargin(price: number, margin: MarginConfig | null): number;
/** Load platform default + all non-default rows keyed by normalized name. */
export declare function loadMarginMap(): Promise<MarginMap>;
/** Resolve override for extension/domain, else platform default. */
export declare function resolveMarginForExtension(map: MarginMap, extensionOrDomain: string | undefined | null): MarginConfig | null;
export declare function findOverrideByExtension(extension: string): Promise<MarginConfig | null>;
export declare function findDefaultMargin(): Promise<MarginConfig | null>;
