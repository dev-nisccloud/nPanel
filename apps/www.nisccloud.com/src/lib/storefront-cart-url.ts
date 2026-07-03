import type { SharedHostingPlan } from "@/lib/vps-plans-api.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { createStorefrontHandoff } from "@/lib/storefront-checkout-api.ts";

export type StorefrontBillingCycle = "MONTHLY" | "YEARLY";

export interface StorefrontCartParams {
  serviceType: string;
  planId?: string;
  productId?: string;
  planName: string;
  productName: string;
  currency?: string;
  billingCycle?: StorefrontBillingCycle;
  locationName?: string;
  bundleDomains?: string[];
  transferProvider?: "kenic" | "openprovider";
  providerPriceAmount?: number | null;
  providerPriceCurrency?: string | null;
  customerPriceAmount?: number;
  customerPriceCurrency?: string;
}

/** Navigate to cart with a server-signed handoff token (no prices in URL). */
export async function navigateToStorefrontCart(params: StorefrontCartParams) {
  const { handoff } = await createStorefrontHandoff({
    serviceType: params.serviceType,
    planId: params.planId,
    productId: params.productId,
    planName: params.planName,
    productName: params.productName,
    billingCycle: params.billingCycle ?? "MONTHLY",
    locationName: params.locationName,
    bundleDomains: params.bundleDomains,
    transferProvider: params.transferProvider,
    providerPriceAmount: params.providerPriceAmount ?? undefined,
    providerPriceCurrency: params.providerPriceCurrency ?? undefined,
    customerPriceAmount: params.customerPriceAmount,
    customerPriceCurrency: params.customerPriceCurrency,
  });
  window.location.assign(`/cart?h=${encodeURIComponent(handoff)}`);
}

export function buildSharedHostingCartParams(
  plan: SharedHostingPlan,
  serviceType: string,
  isYearly: boolean,
): StorefrontCartParams {
  return {
    serviceType,
    planId: plan.id,
    productId: plan.productId,
    planName: plan.name,
    productName: plan.productName,
    currency: plan.niscCurrency || "KES",
    billingCycle: isYearly ? "YEARLY" : "MONTHLY",
  };
}

export function buildDomainTransferCartParams(params: {
  domain: string;
  provider: "kenic" | "openprovider";
  customerPriceAmount: number;
  customerPriceCurrency: string;
  providerPriceAmount?: number | null;
  providerPriceCurrency?: string | null;
}): StorefrontCartParams {
  return {
    serviceType: "domain_transfer",
    planName: params.domain,
    productName: "Domain Transfer",
    currency: params.customerPriceCurrency,
    billingCycle: "YEARLY",
    transferProvider: params.provider,
    customerPriceAmount: params.customerPriceAmount,
    customerPriceCurrency: params.customerPriceCurrency,
    providerPriceAmount: params.providerPriceAmount,
    providerPriceCurrency: params.providerPriceCurrency,
  };
}

export function buildDomainRegistrationCartParams(
  result: DomainSearchResult,
): StorefrontCartParams {
  return {
    serviceType: "domain_registration",
    productId: "nisc-domains",
    planName: result.domain,
    productName: "Domain Registration",
    currency: "KES",
    billingCycle: "YEARLY",
  };
}

export function buildDomainBundleCartParams(params: {
  domains: string[];
  bundleLabel: string;
  currency?: string;
}): StorefrontCartParams {
  return {
    serviceType: "domain_registration",
    productId: "nisc-domains",
    planName: params.bundleLabel,
    productName: "Domain Bundle",
    currency: params.currency ?? "KES",
    billingCycle: "YEARLY",
    bundleDomains: params.domains,
  };
}

export function buildOrderPlanCartParams(
  plan: { id: string; name: string; period: string },
  serviceType: string,
  productName: string,
  productId?: string,
): StorefrontCartParams {
  const period = plan.period.toLowerCase();
  const isYearly = period === "yr" || period === "year" || period === "yearly";
  return {
    serviceType,
    planId: plan.id,
    productId,
    planName: plan.name,
    productName,
    currency: "KES",
    billingCycle: isYearly ? "YEARLY" : "MONTHLY",
  };
}

export function buildVpsCartParams(params: {
  productId: number;
  planName: string;
  productName: string;
  currency?: string;
  serviceType?: "vps" | "vds" | "dedicated_servers";
  locationName: string;
}): StorefrontCartParams {
  const serviceType = params.serviceType ?? "vps";
  const productIdMap = {
    vps: "nisc-vps-hosting",
    vds: "nisc-vds-hosting",
    dedicated_servers: "nisc-dedicated-servers",
  } as const;
  return {
    serviceType,
    planId: String(params.productId),
    productId: productIdMap[serviceType],
    planName: params.planName,
    productName: params.productName,
    currency: params.currency ?? "KES",
    billingCycle: "MONTHLY",
    locationName: params.locationName,
  };
}
