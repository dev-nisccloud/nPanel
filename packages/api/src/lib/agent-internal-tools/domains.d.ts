/**
 * Domain availability checking for the Zeepo AI Agent.
 *
 * Routes .ke / .co.ke / .or.ke etc. through KENIC EPP and all other
 * extensions through the OpenProvider REST API - both of which are
 * Nisc Cloud's existing backend integrations. The agent never needs to
 * direct users to external registrars.
 *
 * Reuses the same Redis auth-token caching that the OpenProvider tRPC
 * router uses, so tokens are shared across in-process callers.
 */
export type DomainStatus = "available" | "taken" | "reserved" | "unknown";
export type DomainBackend = "kenic" | "openprovider" | "error";
export interface DomainCheckEntry {
    domain: string;
    status: DomainStatus;
    available: boolean;
    /**
     * Retail price after platform margin and currency conversion.
     * Only present for gTLDs via OpenProvider when pricing data is available.
     */
    price?: {
        amount: number;
        currency: string;
        formatted: string;
    };
    isPremium?: boolean;
    via: DomainBackend;
    error?: string;
}
export interface DomainCheckResult {
    _tool: "check_domain_availability";
    name: string;
    /** All domains with availability + retail pricing in the team's currency. */
    checked: DomainCheckEntry[];
    availableCount: number;
    /** ISO 4217 code that all prices are expressed in. */
    displayCurrency: string;
    checkedAt: string;
}
/**
 * Check availability for `name` across the requested `extensions`,
 * routing each through the correct backend (KENIC EPP for .ke TLDs,
 * OpenProvider for everything else).
 *
 * @param targetCurrency ISO 4217 code for pricing display (e.g. "KES", "USD").
 *   Defaults to KES (Kenyan Shilling) - the most common currency for Nisc Cloud clients.
 */
export declare function agentCheckDomainAvailability(params: {
    name: string;
    extensions: string[];
    targetCurrency?: string;
}): Promise<DomainCheckResult>;
/** Default extensions to check for a Kenyan business when the model doesn't specify. */
export declare const DEFAULT_DOMAIN_EXTENSIONS: string[];
