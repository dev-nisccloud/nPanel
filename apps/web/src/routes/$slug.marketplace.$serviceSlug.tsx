"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { MarketplaceCurrentPlans } from "./$slug.marketplace/_components/marketplace-current-plans";
import { MarketplacePricing } from "./$slug.marketplace/_components/marketplace-pricing";
import { MarketplaceHivelocityPricing, getHivelocityTypeForSlug } from "./$slug.marketplace/_components/marketplace-hivelocity-pricing";
import { slugifyProductName } from "./$slug.marketplace/marketplace-services";
import { useMarketplaceSubscriptions } from "./$slug.marketplace/_components/use-marketplace-subscriptions";

export default function MarketplaceServicePage() {
  const params = useParams();
  const teamSlug    = typeof params?.slug        === "string" ? params.slug        : "";
  const serviceSlug = typeof params?.serviceSlug === "string" ? params.serviceSlug : "";

  React.useEffect(() => {
    captureEvent("marketplace_product_viewed", { product_type: serviceSlug });
  }, [serviceSlug]);

  /* Fetch all active products  same source as agency nisc-services page */
  const { data: allProducts = [], isLoading: productsLoading } = trpc.products.getAll.useQuery(
    { isActive: true },
    { staleTime: 5 * 60 * 1000 }
  );

  /* Find the matching product by slug derived from its name */
  const product = React.useMemo(
    () => allProducts.find((p) => slugifyProductName(p.name) === serviceSlug),
    [allProducts, serviceSlug]
  );

  const { bySlug } = useMarketplaceSubscriptions(teamSlug || undefined);
  const activeSubs = bySlug[serviceSlug] ?? [];

  /* Loading state */
  if (productsLoading) {
    return (
      <div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col gap-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="mt-4 h-[min(calc(100dvh-14rem),52rem)] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  /* Product not found (slug doesn't match any active product) */
  if (!product) {
    return (
      <div className="@container/main flex min-h-0 flex-1 flex-col gap-4 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="mx-auto w-full max-w-7xl">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 self-start" asChild>
            <Link to={teamSlug ? `/${teamSlug}/marketplace` : "/marketplace"}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Service not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">

        {/* Back */}
        <Button variant="ghost" size="sm" className="-ml-2 mb-2 shrink-0 self-start" asChild>
          <Link to={teamSlug ? `/${teamSlug}/marketplace` : "/marketplace"}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>

        {/* Header  exact same style as SEO / Hosting pages */}
        <div className="flex shrink-0 flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>

        <MarketplaceCurrentPlans
          teamSlug={teamSlug}
          serviceSlug={serviceSlug}
          subscriptions={activeSubs}
        />

        {/* Pricing section  Hivelocity server grid for VPS/VDS/Dedicated, pricing table for all others */}
        <div className="mt-6 min-h-0 flex-1">
          {(() => {
            const hivelocityType = getHivelocityTypeForSlug(serviceSlug);
            if (hivelocityType) {
              return <MarketplaceHivelocityPricing type={hivelocityType} />;
            }
            return <MarketplacePricing serviceSlug={serviceSlug} productName={product.name} />;
          })()}
        </div>

      </div>
    </div>
  );
}
