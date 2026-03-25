"use client";

import { MarketplacePromoCard } from "./$slug.marketplace/_components/marketplace-promo-card";
import { MarketplaceCard } from "./$slug.marketplace/_components/marketplace-card";
import { MARKETPLACE_SERVICES } from "./$slug.marketplace/marketplace-services";
import { MarketplaceGrid } from "./$slug.marketplace/_components/marketplace-grid";

export default function MarketplacePage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Marketplace</h1>
          <p className="text-xs text-muted-foreground">
            Explore and subscribe to services Ã¢â‚¬â€ hosting, email, marketing, and more.
          </p>
        </div>

        <MarketplaceGrid
          promoCard={<MarketplacePromoCard />}
          services={MARKETPLACE_SERVICES}
          renderCard={(item, teamSlug) => (
            <MarketplaceCard key={item.slug} item={item} teamSlug={teamSlug} />
          )}
        />
      </div>
    </div>
  );
}
