"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { slugifyProductName } from "../marketplace-services";

/**
 * Derive a marketplace slug from a subscription's productName.
 *
 * Subscriptions come from clientSubscriptions.listForTeam and carry the
 * product name as the customer subscribed to it (e.g. "Nisc Website Hosting").
 * We slugify the name the same way we do for product cards so the two can be
 * matched without a hard-coded lookup table.
 *
 * The function first tries an exact slugify match, then falls back to keyword
 * matching for common naming variations (e.g. "Nisc Website Hosting" → "website-hosting").
 */
const FALLBACK_MATCHERS: { slug: string; terms: string[] }[] = [
  { slug: "website-hosting",    terms: ["website hosting", "web hosting", "web host"] },
  { slug: "business-email",     terms: ["email hosting", "business email", "professional email"] },
  { slug: "vps-hosting",        terms: ["vps", "virtual private server"] },
  { slug: "email-marketing",    terms: ["email marketing", "nisc email marketing"] },
  { slug: "background-remover", terms: ["background remover", "bg remover", "background removal"] },
  { slug: "ai-image-generator", terms: ["ai image", "image generator"] },
  { slug: "creatives-design",   terms: ["creatives", "creative assets"] },
  { slug: "seo",                terms: ["seo", "search engine optimization", "seo report"] },
  { slug: "media-buying",       terms: ["media buying", "ad campaign"] },
];

export function getSlugFromProductName(productName: string): string {
  // Direct slugify — works when the subscription product name is the same as
  // the DB product name (most common case after the marketplace was DB-driven).
  const direct = slugifyProductName(productName);
  if (direct) return direct;

  // Keyword-based fallback for legacy / slightly-different naming.
  const lower = productName.toLowerCase();
  for (const { slug, terms } of FALLBACK_MATCHERS) {
    if (terms.some((t) => lower.includes(t))) return slug;
  }
  return direct;
}

export function useMarketplaceSubscriptions(teamSlug: string | undefined) {
  const { data = [], isLoading } = trpc.clientSubscriptions.listForTeam.useQuery(
    { teamSlug: teamSlug ?? "" },
    { enabled: !!teamSlug, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 }
  );

  const bySlug = React.useMemo(() => {
    const map: Record<string, (typeof data)[number][]> = {};
    for (const sub of data) {
      const slug = getSlugFromProductName(sub.productName);
      if (slug) (map[slug] ??= []).push(sub);
    }
    return map;
  }, [data]);

  const hasSubscription = React.useCallback(
    (slug: string) => (bySlug[slug]?.length ?? 0) > 0,
    [bySlug]
  );

  return { bySlug, hasSubscription, isLoading };
}
