"use client";

import * as React from "react";
import { useLocation, Link } from "react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { trpc } from "@/utils/trpc";
import { slugifyProductName, DB_CATEGORY_LABELS } from "../../$slug.marketplace/marketplace-services";
import { useMarketplaceSubscriptions } from "../../$slug.marketplace/_components/use-marketplace-subscriptions";
import { getServiceIconConfig } from "../../$slug.marketplace/_components/service-icons";
import {
  pickRecommendedMarketplaceProducts,
  type RecommendableProduct,
} from "./recommend-marketplace-products";

export function DashboardPromoSection() {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  const [open, setOpen] = React.useState(true);

  const { data: rawProducts = [], isLoading: productsLoading } = trpc.products.getAll.useQuery(
    { isActive: true },
    { staleTime: 5 * 60 * 1000 }
  );

  const { bySlug, isLoading: subsLoading } = useMarketplaceSubscriptions(teamSlug || undefined);

  const recommendations = React.useMemo(() => {
    const products: RecommendableProduct[] = rawProducts.map((p) => ({
      id: p.id,
      slug: slugifyProductName(p.name),
      name: p.name,
      description: p.description,
      category: p.category,
      highlights: p.highlights,
      sortOrder: p.sortOrder,
    }));

    return pickRecommendedMarketplaceProducts(products, Object.keys(bySlug), 3);
  }, [rawProducts, bySlug]);

  const isLoading = productsLoading || subsLoading;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold leading-tight tracking-tight">
              Recommended for you
            </h2>
            <p className="text-sm text-muted-foreground">
              Marketplace services tailored to what you don&apos;t already have.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0" aria-label={open ? "Collapse" : "Expand"}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-5 py-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader className="pb-2 space-y-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Skeleton className="h-8 w-full rounded-md" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                You&apos;re covered for now.{" "}
                <Link to={`/${teamSlug}/marketplace`} className="text-primary underline-offset-4 hover:underline">
                  Browse the marketplace
                </Link>{" "}
                anytime for more services.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((product) => {
                  const { Icon } = getServiceIconConfig(product.slug);
                  const categoryLabel = DB_CATEGORY_LABELS[product.category] ?? product.category;
                  return (
                    <Card key={product.id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold leading-tight">{product.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description ?? "Explore plans and subscribe from the marketplace."}
                        </p>
                      </CardHeader>
                      <CardContent className="mt-auto pt-0">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link to={`/${teamSlug}/marketplace/${product.slug}`}>View plans</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
