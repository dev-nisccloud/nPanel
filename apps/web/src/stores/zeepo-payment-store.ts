import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

/**
 * Shape returned by the check_domain_availability agent tool.
 * Mirrors packages/api/src/lib/agent-internal-tools/domains.ts - kept here
 * so the frontend doesn't import from a server-only package.
 */
export interface AgentDomainCheckEntry {
  domain: string;
  status: "available" | "taken" | "reserved" | "unknown";
  available: boolean;
  price?: { amount: number; currency: string; formatted: string };
  isPremium?: boolean;
  via: "kenic" | "openprovider" | "error";
  error?: string;
}

export interface AgentDomainCheckResult {
  _tool: "check_domain_availability";
  name: string;
  checked: AgentDomainCheckEntry[];
  availableCount: number;
  displayCurrency: string;
  checkedAt: string;
}

/** Shape of a single plan returned by get_web_hosting_plans / get_email_hosting_plans. */
export interface AgentHostingPlanEntry {
  id: string;
  name: string;
  niscPrice: string | null;
  niscCurrency: string;
  billingCycle: string;
  isPopular: boolean;
  isRecommended: boolean;
  productId: string;
  productName: string;
  featureValues: Array<{ available: boolean; valueOverride: string | null }>;
}

export interface AgentHostingPlanFeatureRow {
  key: string;
  label: string;
}

/** Result returned by the get_web_hosting_plans / get_email_hosting_plans agent tools. */
export interface AgentHostingPlansResult {
  _tool: "get_web_hosting_plans" | "get_email_hosting_plans";
  productFeatures: AgentHostingPlanFeatureRow[];
  plans: AgentHostingPlanEntry[];
  checkedAt: string;
}

// ── Domains portfolio ───────────────────────────────────────────────────────

export type AgentPortfolioDomainStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "PENDING"
  | "SUSPENDED"
  | "UNKNOWN";

export interface AgentPortfolioDomainEntry {
  domain: string;
  status: AgentPortfolioDomainStatus;
  expiryDate: string | null;
  registrationDate: string | null;
  autoRenewal: boolean;
  /** Optional  tool payloads often omit this; UI infers grouping when missing. */
  source?: "openprovider" | "kenic" | "subscription";
  clientName?: string;
}

/** Result returned by the get_domains_portfolio agent tool. */
export interface AgentDomainsPortfolioResult {
  _tool: "get_domains_portfolio";
  isAgency: boolean;
  teamName: string | null;
  domains: AgentPortfolioDomainEntry[];
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  hasMore: boolean;
  checkedAt: string;
}

// ── Hosting resources ────────────────────────────────────────────────────────

export interface AgentHostingResourceEntry {
  domain: string | null;
  status: "Active" | "Suspended" | "Unknown";
  ipAddress: string | null;
  sslEnabled: boolean;
  diskUsageBytes: number;
  diskLimitBytes: number;
  diskUsageFormatted: string;
  diskLimitFormatted: string;
  trafficBytes: number;
  trafficFormatted: string;
  createdAt: string | null;
  planName: string | null;
  hostingType: string | null;
  billingCycle: string | null;
  expiryDate: string | null;
  nextRenewalDate: string | null;
  autoRenew: boolean | null;
  teamName: string | null;
}

export interface AgentHostingResourcesResult {
  _tool: "get_hosting_resources";
  isAgency: boolean;
  teamName: string | null;
  resources: AgentHostingResourceEntry[];
  totalCount: number;
  activeCount: number;
  suspendedCount: number;
  pleskUnavailable?: boolean;
  checkedAt: string;
}

export interface AgentHostingMailAccount {
  email: string;
  mailboxEnabled: boolean;
  quotaFormatted: string;
  usageFormatted: string;
  forwardingEnabled: boolean;
  forwardingAddresses: string[];
  aliases: string[];
  autoresponderEnabled: boolean;
}

export interface AgentHostingDetailResult {
  _tool: "get_hosting_detail";
  domain: string;
  found: boolean;
  status: "Active" | "Suspended" | "Unknown";
  ipAddress: string | null;
  sslEnabled: boolean;
  certificateName: string | null;
  diskUsageBytes: number;
  diskLimitBytes: number;
  diskUsageFormatted: string;
  diskLimitFormatted: string;
  trafficBytes: number;
  trafficFormatted: string;
  mailboxCount: number;
  databaseCount: number;
  subdomainCount: number;
  createdAt: string | null;
  planName: string | null;
  hostingType: string | null;
  billingCycle: string | null;
  expiryDate: string | null;
  nextRenewalDate: string | null;
  autoRenew: boolean | null;
  teamName: string | null;
  // Optional sections
  dnsRecords?: Array<{ type: string; host: string; value: string; ttl?: number }>;
  mailAccounts?: AgentHostingMailAccount[];
  subdomains?: Array<{ name: string; fqdn: string }>;
  databases?: Array<{ name: string; type: string }>;
  accessDenied?: boolean;
  pleskUnavailable?: boolean;
  error?: string;
  checkedAt: string;
}

// ── Domain detail ────────────────────────────────────────────────────────────

export interface AgentDomainDetailDnsRecord {
  type: string;
  host: string;
  value: string;
  ttl?: number;
}

/** Result returned by the get_domain_detail agent tool. */
export interface AgentDomainDetailResult {
  _tool: "get_domain_detail";
  domain: string;
  found: boolean;
  source?: "openprovider" | "kenic" | "subscription";

  // Overview
  status?: string;
  expiryDate?: string | null;
  registrationDate?: string | null;
  renewalDate?: string | null;
  autoRenewal?: boolean;
  registrantHandle?: string;
  registrantName?: string;
  registrantEmail?: string;
  adminHandle?: string;
  techHandle?: string;
  isLocked?: boolean;
  isDnssecEnabled?: boolean;

  // Hosting
  hasHosting: boolean;
  hostingPlanName?: string | null;

  // Optional sections
  nameservers?: string[];
  dnsRecords?: AgentDomainDetailDnsRecord[];
  dnsNote?: string;

  accessDenied?: boolean;
  error?: string;
  checkedAt: string;
}

/** Maps an agent DomainCheckEntry price to the shape GlobalBuyNowDialog expects. */
function domainCheckEntryToSearchResult(entry: AgentDomainCheckEntry): DomainSearchResult {
  const retailAmount = entry.price
    ? Math.ceil(entry.price.amount)
    : undefined;

  return {
    domain: entry.domain,
    status: entry.status,
    price:
      retailAmount != null && entry.price
        ? {
            product: { price: retailAmount, currency: entry.price.currency },
            reseller: { price: retailAmount, currency: entry.price.currency },
            calculated: {
              originalPrice: retailAmount,
              marginAmount: 0,
              finalPrice: retailAmount,
              currency: entry.price.currency,
              marginType: null,
              marginValue: null,
              convertedPrice: retailAmount,
              displayCurrency: entry.price.currency,
            },
          }
        : undefined,
  };
}

/**
 * Unified payment handler hook for anything payment-related inside the Zeepo
 * AI agent. Delegates to GlobalBuyNowDialog so the full payment flow (M-Pesa
 * STK, registrant info, order creation) is reused without duplication.
 *
 * Extend this hook when future payment surfaces are added to the agent
 * (e.g. purchaseHosting, purchaseSSL) - all call sites stay the same.
 */
export function useZeepoPaymentHandler() {
  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId, isLoading: isLoadingProductId } =
    trpc.clientSubscriptions.getDomainsProductId.useQuery();

  const purchaseDomain = (entry: AgentDomainCheckEntry) => {
    if (!domainsProductId || !entry.available) return;
    openForProduct({
      productId: domainsProductId,
      productName: "Domains",
      domain: domainCheckEntryToSearchResult(entry),
    });
  };

  return { purchaseDomain, domainsProductId, isLoadingProductId };
}
