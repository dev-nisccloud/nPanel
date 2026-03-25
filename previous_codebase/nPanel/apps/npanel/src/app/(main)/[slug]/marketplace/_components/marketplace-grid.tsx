"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { MarketplaceServiceItemWithSearch } from "../marketplace-services";

interface MarketplaceGridProps {
  promoCard: React.ReactNode;
  services: MarketplaceServiceItemWithSearch[];
  renderCard: (item: MarketplaceServiceItemWithSearch, teamSlug: string) => React.ReactNode;
}

export function MarketplaceGrid({
  promoCard,
  services,
  renderCard,
}: MarketplaceGridProps) {
  const pathname = usePathname();
  const teamSlug = pathname?.split("/")[1] ?? "";

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promoCard}
        {services.map((item) => renderCard(item, teamSlug))}
      </div>
    </div>
  );
}
