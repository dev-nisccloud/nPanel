/**
 * Domains portfolio for the Zeepo AI Agent.
 *
 * Agency view  – merges live OpenProvider gTLD data with KENIC .ke subscriptions
 *                from the DB, matching what the agency/domains-portfolio page shows.
 *
 * Customer view – reads nisc_client_subscription rows scoped to the session team
 *                 (same source as the /$slug/domains-portfolio page).
 */
export type PortfolioDomainStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" | "UNKNOWN";
export interface PortfolioDomainEntry {
    domain: string;
    status: PortfolioDomainStatus;
    expiryDate: string | null;
    registrationDate: string | null;
    autoRenewal: boolean;
    /** "openprovider" for gTLDs via OP, "kenic" for .ke from DB, "subscription" for customer DB subs */
    source: "openprovider" | "kenic" | "subscription";
    /** Agency only – registrant/team name from OP or subscription record */
    clientName?: string;
}
export interface DomainsPortfolioResult {
    _tool: "get_domains_portfolio";
    /** true = agency-wide portfolio; false = team-scoped customer portfolio */
    isAgency: boolean;
    /** Customer only: the team name to display (e.g. "you own these under Acme Ltd") */
    teamName: string | null;
    domains: PortfolioDomainEntry[];
    totalCount: number;
    activeCount: number;
    expiredCount: number;
    /** true when the backend returned results but there are more (OP pagination cap) */
    hasMore: boolean;
    checkedAt: string;
}
export declare function agentGetDomainsPortfolio(params: {
    isAgency: boolean;
    teamId: string | null;
    teamName: string | null;
}): Promise<DomainsPortfolioResult>;
