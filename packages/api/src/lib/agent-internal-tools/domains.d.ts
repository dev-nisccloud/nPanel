/**
 * Domain availability checking for the Zeepo AI Agent.
 *
 * Routes domain checks through NISC Cloud's domain registry infrastructure.
 * The agent never needs to direct users to external registrars.
 *
 * Reuses existing Redis auth-token caching for efficiency.
 */
export type DomainStatus = "available" | "taken" | "reserved" | "unknown";
export interface DomainCheckEntry {
    domain: string;
    status: DomainStatus;
    available: boolean;
    /**
     * Retail price after platform margin and currency conversion.
     */
    price?: {
        amount: number;
        currency: string;
        formatted: string;
    };
    isPremium?: boolean;
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
 * routing each through NISC Cloud's domain registry infrastructure.
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
