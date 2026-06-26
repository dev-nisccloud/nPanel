"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { MarketplacePricing } from "./$slug.marketplace/_components/marketplace-pricing";
import { MarketplaceHivelocityPricing, getHivelocityTypeForSlug } from "./$slug.marketplace/_components/marketplace-hivelocity-pricing";
import { slugifyProductName } from "./$slug.marketplace/marketplace-services";
import { useMarketplaceSubscriptions } from "./$slug.marketplace/_components/use-marketplace-subscriptions";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PENDING:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  SUSPENDED:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  CANCELLED:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPIRED:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date as string);
  return isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function MarketplaceServicePage() {
  const params = useParams();
  const teamSlug    = typeof params?.slug        === "string" ? params.slug        : "";
  const serviceSlug = typeof params?.serviceSlug === "string" ? params.serviceSlug : "";

  /* Fetch all active products — same source as agency nisc-services page */
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

        {/* Header — exact same style as SEO / Hosting pages */}
        <div className="flex shrink-0 flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>

        {/* Current plan banner (only when subscribed) */}
        {activeSubs.length > 0 && (
          <div className="mt-4 shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold">
                Current plan{activeSubs.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {activeSubs.map((sub) => (
                <div key={sub.id} className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-medium">
                    {sub.productPlanName ?? sub.productName}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    STATUS_STYLES[sub.status] ?? "bg-muted text-muted-foreground"
                  )}>
                    {sub.status}
                  </span>
                  {sub.subscriptionDate && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Since {formatDate(sub.subscriptionDate)}
                    </span>
                  )}
                  {(sub.nextRenewalDate ?? sub.expiryDate) && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <RotateCcw className="h-3 w-3" />
                      Renews {formatDate(sub.nextRenewalDate ?? sub.expiryDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing section — Hivelocity server grid for VPS/VDS/Dedicated, pricing table for all others */}
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
