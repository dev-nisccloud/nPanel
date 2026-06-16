import { formatPrice } from "@/lib/domain-search/format-price.ts";

const USD_TO_KES = 130;

const tldPricing = [
  { tld: ".com", originalPrice: 19.99, discountedPrice: 12.0 },
  { tld: ".net", originalPrice: 17.99, discountedPrice: 11.99 },
  { tld: ".io", originalPrice: 67.99, discountedPrice: 31.99 },
  { tld: ".org", originalPrice: 15.99, discountedPrice: 7.99 },
  { tld: ".online", originalPrice: 34.99, discountedPrice: 0.99 },
  { tld: ".shop", originalPrice: 34.99, discountedPrice: 0.99 },
];

/** Static showcase cards  display only, not clickable (matches dashboard layout). */
export function TldPricingCards() {
  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tldPricing.map((item) => {
          const originalPriceKES = item.originalPrice * USD_TO_KES;
          const discountedPriceKES = item.discountedPrice * USD_TO_KES;

          return (
            <div
              key={item.tld}
              className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="font-bold text-lg text-foreground">{item.tld}</div>
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPriceKES, "KES")}
              </div>
              <div className="font-semibold text-base text-foreground">
                {formatPrice(discountedPriceKES, "KES")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
