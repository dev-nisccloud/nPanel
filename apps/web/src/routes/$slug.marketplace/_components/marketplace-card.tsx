"use client";

import * as React from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceIconConfig } from "./service-icons";
import { DB_CATEGORY_LABELS } from "../marketplace-services";

export interface MarketplaceCardProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  highlights: string[];
}

interface MarketplaceCardProps {
  product: MarketplaceCardProduct;
  teamSlug: string;
  hasActiveSub?: boolean;
}

export function MarketplaceCard({ product, teamSlug, hasActiveSub = false }: MarketplaceCardProps) {
  const href = `/${teamSlug}/marketplace/${product.slug}`;
  const { Icon, bg } = getServiceIconConfig(product.slug);
  const categoryLabel = DB_CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-5 transition-all hover:shadow-md",
        hasActiveSub && "ring-1 ring-primary/25 border-primary/20"
      )}
    >
      {/* Active subscription pill */}
      {hasActiveSub && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
        </div>
      )}

      {/* Service icon */}
      <div className={cn("mb-4 h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
        <Icon size={22} className="text-white" />
      </div>

      {/* Category badge */}
      <Badge variant="secondary" className="mb-2 w-fit text-xs font-medium">
        {categoryLabel}
      </Badge>

      {/* Title */}
      <h3 className="font-semibold text-[15px] leading-snug mb-1.5">{product.name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
        {product.description ?? ""}
      </p>

      {/* Top 2 highlights from DB */}
      {product.highlights.length > 0 && (
        <div className="mb-4 space-y-1">
          {product.highlights.slice(0, 2).map((h) => (
            <div key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {h}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <Button
        variant={hasActiveSub ? "outline" : "default"}
        size="sm"
        className="w-full"
        asChild
      >
        <Link to={href}>{hasActiveSub ? "Manage Plan" : "View Plans"}</Link>
      </Button>
    </div>
  );
}
