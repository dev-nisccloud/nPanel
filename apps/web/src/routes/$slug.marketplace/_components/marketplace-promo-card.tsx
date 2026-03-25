"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MARKETPLACE_PROMO } from "../marketplace-services";

export function MarketplacePromoCard() {
  return (
    <Card className="relative aspect-square w-full gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 py-0 shadow-sm">
      <img
        src={MARKETPLACE_PROMO.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <CardContent className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-semibold leading-tight tracking-tight text-foreground [text-shadow:0_1px_2px_rgba(255,255,255,0.8)]">
          {MARKETPLACE_PROMO.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground [text-shadow:0_1px_2px_rgba(255,255,255,0.8)]">
          {MARKETPLACE_PROMO.description}
        </p>
      </CardContent>
    </Card>
  );
}
