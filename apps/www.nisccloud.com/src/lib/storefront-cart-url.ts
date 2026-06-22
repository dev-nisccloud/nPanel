import type { SharedHostingPlan } from "@/lib/vps-plans-api.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";

export type StorefrontBillingCycle = "MONTHLY" | "YEARLY";

export interface StorefrontCartParams {
  serviceType: string;
  planId?: string;
  productId?: string;
  planName: string;
  productName: string;
  currency?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycle?: StorefrontBillingCycle;
  /** Hivelocity data center code — required for VPS/VDS/dedicated checkout. */
  locationName?: string;
}

/** Derive monthly/yearly display prices from a plan's stored niscPrice + billingCycle. */
export function derivePlanPricing(niscPrice: string | null | undefined, billingCycle: string) {
  if (!niscPrice) return { monthly: 0, yearly: 0 };
  const price = parseFloat(niscPrice);
  if (isNaN(price)) return { monthly: 0, yearly: 0 };

  if (billingCycle === "MONTHLY") {
    return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
  }
  if (billingCycle === "YEARLY") {
    return { monthly: Math.round(price / 12), yearly: Math.round(price) };
  }
  return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
}

export function getDomainPriceKes(result: DomainSearchResult): number {
  const calc = result.price?.calculated;
  if (calc?.convertedPrice != null) return Math.round(calc.convertedPrice);
  if (calc?.finalPrice != null) return Math.round(calc.finalPrice);
  const reseller = result.price?.reseller?.price;
  if (reseller != null && Number.isFinite(reseller)) return Math.round(reseller);
  const product = result.price?.product?.price;
  if (product != null && Number.isFinite(product)) return Math.round(product);
  return 0;
}

/** Navigate to the storefront cart — uses full page navigation for reliability. */
export function goToStorefrontCart(url: string) {
  window.location.assign(url);
}

export function buildStorefrontCartUrl(params: StorefrontCartParams): string {
  const search = new URLSearchParams();
  search.set("serviceType", params.serviceType);
  if (params.planId) search.set("planId", params.planId);
  if (params.productId) search.set("productId", params.productId);
  search.set("planName", params.planName);
  search.set("productName", params.productName);
  search.set("currency", params.currency ?? "KES");
  search.set("monthlyPrice", String(params.monthlyPrice));
  search.set("yearlyPrice", String(params.yearlyPrice));
  if (params.billingCycle) search.set("billingCycle", params.billingCycle);
  if (params.locationName) search.set("locationName", params.locationName);
  return `/cart?${search.toString()}`;
}

export function buildSharedHostingCartUrl(
  plan: SharedHostingPlan,
  serviceType: string,
  isYearly: boolean,
): string {
  const price = derivePlanPricing(plan.niscPrice, plan.billingCycle);
  return buildStorefrontCartUrl({
    serviceType,
    planId: plan.id,
    productId: plan.productId,
    planName: plan.name,
    productName: plan.productName,
    currency: plan.niscCurrency || "KES",
    monthlyPrice: price.monthly,
    yearlyPrice: price.yearly,
    billingCycle: isYearly ? "YEARLY" : "MONTHLY",
  });
}

export function buildDomainRegistrationCartUrl(result: DomainSearchResult): string {
  const yearly = getDomainPriceKes(result);
  return buildStorefrontCartUrl({
    serviceType: "domain_registration",
    productId: "nisc-domains",
    planName: result.domain,
    productName: "Domain Registration",
    currency: "KES",
    monthlyPrice: 0,
    yearlyPrice: yearly,
    billingCycle: "YEARLY",
  });
}

export function buildDomainBundleCartUrl(params: {
  bundleLabel: string;
  bundlePrice: number;
  currency?: string;
}): string {
  return buildStorefrontCartUrl({
    serviceType: "domain_registration",
    productId: "nisc-domains",
    planName: params.bundleLabel,
    productName: "Domain Bundle",
    currency: params.currency ?? "KES",
    monthlyPrice: 0,
    yearlyPrice: Math.round(params.bundlePrice),
    billingCycle: "YEARLY",
  });
}

export function buildOrderPlanCartUrl(
  plan: { id: string; name: string; price: number; period: string },
  serviceType: string,
  productName: string,
): string {
  const period = plan.period.toLowerCase();
  const isYearly = period === "yr" || period === "year" || period === "yearly";
  const isOnce = period === "once";

  let monthlyPrice: number;
  let yearlyPrice: number;
  let billingCycle: StorefrontBillingCycle;

  if (isOnce) {
    monthlyPrice = plan.price;
    yearlyPrice = plan.price;
    billingCycle = "MONTHLY";
  } else if (isYearly) {
    monthlyPrice = Math.round(plan.price / 12);
    yearlyPrice = plan.price;
    billingCycle = "YEARLY";
  } else {
    monthlyPrice = plan.price;
    yearlyPrice = Math.round(plan.price * 12 * 0.8);
    billingCycle = "MONTHLY";
  }

  return buildStorefrontCartUrl({
    serviceType,
    planId: plan.id,
    planName: plan.name,
    productName,
    currency: "KES",
    monthlyPrice,
    yearlyPrice,
    billingCycle,
  });
}

export function buildVpsCartUrl(params: {
  productId: number;
  planName: string;
  productName: string;
  monthlyPrice: number;
  currency?: string;
  serviceType?: "vps" | "vds" | "dedicated_servers";
  locationName: string;
}): string {
  const monthly = Math.round(params.monthlyPrice);
  const serviceType = params.serviceType ?? "vps";
  const productIdMap = {
    vps: "nisc-vps-hosting",
    vds: "nisc-vds-hosting",
    dedicated_servers: "nisc-dedicated-servers",
  } as const;
  return buildStorefrontCartUrl({
    serviceType,
    planId: String(params.productId),
    productId: productIdMap[serviceType],
    planName: params.planName,
    productName: params.productName,
    currency: params.currency ?? "KES",
    monthlyPrice: monthly,
    yearlyPrice: Math.round(monthly * 12 * 0.8),
    billingCycle: "MONTHLY",
    locationName: params.locationName,
  });
}
