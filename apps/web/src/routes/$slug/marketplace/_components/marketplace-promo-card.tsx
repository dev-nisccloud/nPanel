"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETPLACE_PROMO } from "../marketplace-services";

export function MarketplacePromoCard() {
  return (
    <Card className="relative aspect-square w-full gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 py-0 shadow-sm">
      <Image
        src={MARKETPLACE_PROMO.image}
        alt=""
        fill
        className="object-cover object-center"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority
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
