import * as React from "react";
import {
  fetchStorefrontCartQuote,
  type StorefrontCartQuote,
  type StorefrontCartQuoteRequest,
} from "@/lib/storefront-checkout-api.ts";

function stableQuoteKey(input: StorefrontCartQuoteRequest | null): string | null {
  if (!input) return null;
  return JSON.stringify(input);
}

/**
 * Fetches authoritative cart pricing without UI flicker.
 * Keeps the last quote visible while background refreshes run.
 */
export function useStorefrontCartQuote(input: StorefrontCartQuoteRequest | null) {
  const quoteKey = stableQuoteKey(input);
  const [quote, setQuote] = React.useState<StorefrontCartQuote | null>(null);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);
  const [quoteInitialLoading, setQuoteInitialLoading] = React.useState(Boolean(quoteKey));
  const [quoteRefreshing, setQuoteRefreshing] = React.useState(false);
  const hasQuoteRef = React.useRef(false);

  React.useEffect(() => {
    if (!quoteKey || !input) {
      setQuote(null);
      setQuoteError(null);
      setQuoteInitialLoading(false);
      setQuoteRefreshing(false);
      hasQuoteRef.current = false;
      return;
    }

    let cancelled = false;
    const isRefresh = hasQuoteRef.current;
    if (isRefresh) setQuoteRefreshing(true);
    else setQuoteInitialLoading(true);

    fetchStorefrontCartQuote(input)
      .then((next) => {
        if (cancelled) return;
        setQuote(next);
        setQuoteError(null);
        hasQuoteRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        if (!hasQuoteRef.current) setQuote(null);
        setQuoteError(err instanceof Error ? err.message : "Failed to load pricing.");
      })
      .finally(() => {
        if (cancelled) return;
        setQuoteInitialLoading(false);
        setQuoteRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [quoteKey]);

  return { quote, quoteError, quoteInitialLoading, quoteRefreshing };
}
