import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

/**
 * Shape returned by the check_domain_availability agent tool.
 * Mirrors packages/api/src/lib/agent-internal-tools/domains.ts — kept here
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
 * (e.g. purchaseHosting, purchaseSSL) — all call sites stay the same.
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
