"use client";

import * as React from "react";
import { useParams } from "react-router";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";

/**
 * Map a marketplace slug (derived from slugifyProductName) to the checkout
 * subType used by BuyNowDialog.
 *
 * We match on substrings so that variations like "website-hosting" and
 * "web-hosting" both map correctly.
 */
function getSubTypeForSlug(slug: string): string {
  if (slug.includes("website") || slug.includes("web-host")) return "WEB_HOSTING";
  if (slug.includes("vps"))                                   return "VPS_HOSTING";
  if (slug.includes("email-hosting") || slug.includes("business-email")) return "EMAIL_HOSTING";
  if (slug.includes("email-marketing"))                       return "EMAIL_MARKETING";
  if (slug.includes("seo"))                                   return "SEO";
  if (slug.includes("media-buying"))                          return "MEDIA_BUYING";
  if (slug.includes("creatives") || slug.includes("design"))  return "CREATIVES";
  if (slug.includes("background-remover"))                    return "AI_TOOLS";
  if (slug.includes("ai-image"))                              return "AI_TOOLS";
  return "CUSTOM";
}

/** Determine which dedicated pricing query to use based on slug/product name. */
function getQueryKey(slug: string): string {
  if (slug.includes("website") || slug.includes("web-host"))           return "hosting";
  if (slug.includes("email-hosting") || slug.includes("business-email")) return "emailHosting";
  if (slug.includes("email-marketing"))                                  return "emailMarketing";
  if (slug.includes("seo"))                                              return "seo";
  if (slug.includes("media-buying"))                                     return "mediaBuying";
  if (slug.includes("creatives") || slug.includes("creative"))           return "creatives";
  return "fallback";
}

/** Slugs that use commission-based pricing. */
function isCommissionSlug(slug: string): boolean {
  return slug.includes("media-buying");
}

export function MarketplacePricing({
  serviceSlug,
  productName,
}: {
  serviceSlug: string;
  productName?: string;
}) {
  const params = useParams();
  const teamSlug = typeof params?.slug === "string" ? params.slug : "";

  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const queryKey = getQueryKey(serviceSlug);

  // ── Dedicated per-service queries (same source as each dedicated customer page) ──
  const hostingQ = trpc.products.getHostingPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "hosting",
  });
  const emailHostingQ = trpc.products.getEmailHostingPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "emailHosting",
  });
  const emailMarketingQ = trpc.products.getNiscEmailMarketingPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "emailMarketing",
  });
  const seoQ = trpc.products.getSeoPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "seo",
  });
  const mediaBuyingQ = trpc.products.getMediaBuyingPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "mediaBuying",
  });
  const creativesQ = trpc.products.getCreativesDesignPlansForPricing.useQuery(undefined, {
    enabled: queryKey === "creatives",
  });
  // Generic fallback (VPS, background-remover, ai-image-generator, and any unknown product)
  const fallbackQ = trpc.products.getPlansForPricingBySlug.useQuery(
    { slug: productName ? productName.toLowerCase().replace(/\s+/g, "-") : serviceSlug },
    { enabled: queryKey === "fallback" }
  );

  const { pricingData, isLoading } = React.useMemo(() => {
    switch (queryKey) {
      case "hosting":       return { pricingData: hostingQ.data,        isLoading: hostingQ.isLoading };
      case "emailHosting":  return { pricingData: emailHostingQ.data,   isLoading: emailHostingQ.isLoading };
      case "emailMarketing":return { pricingData: emailMarketingQ.data, isLoading: emailMarketingQ.isLoading };
      case "seo":           return { pricingData: seoQ.data,            isLoading: seoQ.isLoading };
      case "mediaBuying":   return { pricingData: mediaBuyingQ.data,    isLoading: mediaBuyingQ.isLoading };
      case "creatives":     return { pricingData: creativesQ.data,      isLoading: creativesQ.isLoading };
      default:              return { pricingData: fallbackQ.data,       isLoading: fallbackQ.isLoading };
    }
  }, [
    queryKey,
    hostingQ.data, hostingQ.isLoading,
    emailHostingQ.data, emailHostingQ.isLoading,
    emailMarketingQ.data, emailMarketingQ.isLoading,
    seoQ.data, seoQ.isLoading,
    mediaBuyingQ.data, mediaBuyingQ.isLoading,
    creativesQ.data, creativesQ.isLoading,
    fallbackQ.data, fallbackQ.isLoading,
  ]);

  const isCommission = isCommissionSlug(serviceSlug);

  const handleBuyNow = React.useCallback(
    (plan: {
      id: string;
      name: string;
      niscPrice?: string | null;
      niscCurrency?: string;
      billingCycle?: string;
      productId?: string;
      commissionRate?: number | null;
      selectedBillingCycle?: "MONTHLY" | "YEARLY";
      selectedPrice?: number;
    }) => {
      const billingCycle = plan.selectedBillingCycle || plan.billingCycle || "MONTHLY";
      const price = plan.selectedPrice
        ?? (isCommission && plan.commissionRate != null ? plan.commissionRate : null)
        ?? parseFloat(plan.niscPrice || "0");

      const planDetails: ServicePlanDetails = {
        planId:       plan.id,
        planName:     plan.name,
        planType:     "HOSTING",
        subType:      getSubTypeForSlug(serviceSlug),
        price,
        currency:     plan.niscCurrency || "KES",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId:    plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    [serviceSlug, isCommission]
  );

  return (
    <>
      <ScrollArea className="h-[min(calc(100dvh-14rem),52rem)] w-full rounded-xl border bg-card/40">
        <div className="min-w-0 p-1 pb-4">
          <PricingTableWrapper
            plans={pricingData?.plans ?? []}
            productFeatures={pricingData?.productFeatures}
            isLoading={isLoading}
            currency="KES"
            locale="en-KE"
            pricingMode={isCommission ? "commission" : "fixed"}
            onBuyNow={handleBuyNow}
          />
        </div>
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {selectedPlan && (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          plan={selectedPlan}
          requireDomainStep={!serviceSlug.includes("seo")}
          teamId={teamData?.id}
          buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
          seoReportsHref={serviceSlug.includes("seo") && teamSlug ? `/${teamSlug}/seo-reports` : undefined}
        />
      )}
    </>
  );
}
