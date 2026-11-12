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
  const [requestKey, setRequestKey] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const hasQuoteRef = React.useRef(false);
  const inputRef = React.useRef(input);
  inputRef.current = input;

  React.useEffect(() => {
    const request = inputRef.current;
    if (!quoteKey || !request) {
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

    fetchStorefrontCartQuote(request)
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
  }, [quoteKey, requestKey]);

  React.useEffect(() => {
    if (!quote?.quoteExpiresAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [quote?.quoteExpiresAt]);

  const quoteExpiresIn = quote?.quoteExpiresAt
    ? Math.max(0, quote.quoteExpiresAt - now)
    : null;
  const quoteExpired = quoteExpiresIn === 0;
  const retryQuote = React.useCallback(() => {
    setNow(Date.now());
    setRequestKey((key) => key + 1);
  }, []);

  return {
    quote,
    quoteError,
    quoteInitialLoading,
    quoteRefreshing,
    quoteExpiresIn,
    quoteExpired,
    retryQuote,
  };
}
