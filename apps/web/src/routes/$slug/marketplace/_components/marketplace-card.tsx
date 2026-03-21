"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketplaceServiceItem } from "../marketplace-services";

interface MarketplaceCardProps {
  item: MarketplaceServiceItem;
  teamSlug: string;
}

export function MarketplaceCard({ item, teamSlug }: MarketplaceCardProps) {
  const href = `/${teamSlug}/marketplace/${item.slug}`;
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-0">
        {/* Image flush with card top; badge in the very top-right corner, blending with card border */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-t-lg bg-muted/50">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center bg-primary/5 px-4 py-3 text-center text-xs font-medium text-muted-foreground"
              aria-hidden
            >
              {item.title}
            </div>
          )}
          <Badge
            className="absolute right-0 top-0 border-0 px-2 py-1 text-xs font-medium text-foreground shadow-none"
            style={{
              backgroundColor: "#d9eeff",
              borderRadius: "0 0.5rem 0 0.5rem",
            }}
          >
            {item.badgeText}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold leading-tight tracking-tight">
            {item.title}
          </h3>
          <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
            {item.description}
          </p>
          <Button variant="default" size="sm" className="mt-4 w-full" asChild>
            <Link href={href}>Explore offer</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
