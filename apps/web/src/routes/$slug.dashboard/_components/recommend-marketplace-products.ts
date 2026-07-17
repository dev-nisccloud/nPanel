/**
 * Dashboard "Recommended for you" ranking for marketplace products.
 *
 * Rules:
 * - Never recommend a product the team already subscribes to.
 * - If they have website hosting, also skip email hosting and WordPress hosting
 *   (website plans already cover those needs).
 * - If they only have email hosting, website hosting and WordPress hosting remain eligible.
 * - Prefer three recommendations from different marketplace categories.
 */

export type RecommendableProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  highlights: string[];
  sortOrder?: number;
};

/** Canonical marketplace slug → other slugs that mean the same service. */
const SLUG_ALIASES: Record<string, string[]> = {
  "email-hosting": ["business-email"],
  "business-email": ["email-hosting"],
};

const CATEGORY_PRIORITY = ["CLOUD", "MARKETING", "AI", "CONSULTING", "CUSTOM"];

function expandOwnedSlugs(ownedSlugs: Iterable<string>): Set<string> {
  const owned = new Set<string>();
  for (const slug of ownedSlugs) {
    owned.add(slug);
    for (const alias of SLUG_ALIASES[slug] ?? []) {
      owned.add(alias);
    }
  }
  return owned;
}

/**
 * Build the set of marketplace slugs that should not be recommended,
 * based on the team's current subscriptions.
 */
export function getExcludedRecommendationSlugs(ownedSlugs: Iterable<string>): Set<string> {
  const owned = expandOwnedSlugs(ownedSlugs);
  const excluded = new Set(owned);

  const hasWebsiteHosting = owned.has("website-hosting");
  if (hasWebsiteHosting) {
    // Website hosting already includes mailbox + WordPress toolkit capacity.
    excluded.add("email-hosting");
    excluded.add("business-email");
    excluded.add("wordpress-hosting");
  }

  return excluded;
}

function categoryRank(category: string): number {
  const idx = CATEGORY_PRIORITY.indexOf(category);
  return idx === -1 ? CATEGORY_PRIORITY.length : idx;
}

/**
 * Pick up to `count` marketplace products the team does not already have,
 * spreading across categories when possible.
 */
export function pickRecommendedMarketplaceProducts(
  products: RecommendableProduct[],
  ownedSlugs: Iterable<string>,
  count = 3
): RecommendableProduct[] {
  const excluded = getExcludedRecommendationSlugs(ownedSlugs);

  const eligible = products
    .filter((p) => p.slug && !excluded.has(p.slug))
    .slice()
    .sort((a, b) => {
      const cat = categoryRank(a.category) - categoryRank(b.category);
      if (cat !== 0) return cat;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

  const picked: RecommendableProduct[] = [];
  const usedCategories = new Set<string>();
  const pickedIds = new Set<string>();

  // Pass 1: one product per category for diversity
  for (const product of eligible) {
    if (picked.length >= count) break;
    if (usedCategories.has(product.category)) continue;
    picked.push(product);
    usedCategories.add(product.category);
    pickedIds.add(product.id);
  }

  // Pass 2: fill remaining slots from any remaining eligible products
  if (picked.length < count) {
    for (const product of eligible) {
      if (picked.length >= count) break;
      if (pickedIds.has(product.id)) continue;
      picked.push(product);
      pickedIds.add(product.id);
    }
  }

  return picked;
}
