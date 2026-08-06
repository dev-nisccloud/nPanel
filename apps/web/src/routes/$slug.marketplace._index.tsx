"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { useLocation } from "react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { MarketplaceCard, type MarketplaceCardProduct } from "./$slug.marketplace/_components/marketplace-card";
import { DB_CATEGORY_LABELS, slugifyProductName } from "./$slug.marketplace/marketplace-services";
import { useMarketplaceSubscriptions } from "./$slug.marketplace/_components/use-marketplace-subscriptions";

const CATEGORY_ORDER = ["CLOUD", "MARKETING", "AI", "CONSULTING", "CUSTOM"];

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 gap-3">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-2 h-9 w-full rounded-md" />
    </div>
  );
}

export default function MarketplacePage() {
  React.useEffect(() => {
    captureEvent("marketplace_viewed", { user_type: "customer" });
  }, []);

  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  const [search, setSearch] = React.useState("");

  const { data: rawProducts = [], isLoading } = trpc.products.getAll.useQuery(
    { isActive: true },
    { staleTime: 5 * 60 * 1000 }
  );

  const { hasSubscription } = useMarketplaceSubscriptions(teamSlug || undefined);

  /** Normalise DB products into MarketplaceCardProduct (add slug). */
  const products = React.useMemo<MarketplaceCardProduct[]>(
    () =>
      rawProducts.map((p) => ({
        id:          p.id,
        slug:        slugifyProductName(p.name),
        name:        p.name,
        description: p.description,
        category:    p.category,
        highlights:  p.highlights,
      })),
    [rawProducts]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.highlights.some((h) => h.toLowerCase().includes(q))
    );
  }, [products, search]);

  /** Group products by DB category in a fixed display order. */
  const grouped = React.useMemo(() => {
    if (search.trim()) return null;
    const byCategory: Record<string, MarketplaceCardProduct[]> = {};
    for (const p of products) {
      (byCategory[p.category] ??= []).push(p);
    }
    return CATEGORY_ORDER.filter((cat) => (byCategory[cat]?.length ?? 0) > 0).map((cat) => ({
      id:       cat,
      label:    DB_CATEGORY_LABELS[cat] ?? cat,
      services: byCategory[cat]!,
    }));
  }, [products, search]);

  const activeCount = React.useMemo(
    () => products.filter((p) => hasSubscription(p.slug)).length,
    [products, hasSubscription]
  );

  return (
    <div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-7 py-9 md:px-10 md:py-11">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Marketplace
              </h1>
              <p className="mt-2 max-w-lg text-muted-foreground">
                Explore and subscribe to premium services: hosting, email, AI tools, marketing and
                more. All managed in one place.
              </p>

              {/* Stats pills */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-6 w-32 rounded-full" />
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {products.length} service{products.length !== 1 ? "s" : ""} available
                  </div>
                )}
                {activeCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {activeCount} active plan{activeCount !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative mt-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="bg-background/80 pl-9 backdrop-blur-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton while loading */}
        {isLoading && (
          <div className="space-y-10">
            {[0, 1].map((i) => (
              <section key={i}>
                <div className="mb-4 flex items-center gap-3">
                  <Skeleton className="h-4 w-40" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <CardSkeleton key={j} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Search results (flat) */}
        {!isLoading && search.trim() ? (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <MarketplaceCard
                    key={p.id}
                    product={p}
                    teamSlug={teamSlug}
                    hasActiveSub={hasSubscription(p.slug)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No services match your search. Try a different keyword.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Category sections (no search active) */}
        {!isLoading && !search.trim() && (
          <div className="space-y-10">
            {grouped?.map((cat) => (
              <section key={cat.id}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    {cat.label}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {cat.services.length} service{cat.services.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.services.map((p) => (
                    <MarketplaceCard
                      key={p.id}
                      product={p}
                      teamSlug={teamSlug}
                      hasActiveSub={hasSubscription(p.slug)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
