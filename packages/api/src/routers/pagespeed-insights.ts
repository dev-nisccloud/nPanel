import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from '../trpc';

// Simple in-memory cache (can be upgraded to Redis later)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Google raised the PSI API max analysis window to 120s (2021-03-02 release notes).
 * @see https://developers.google.com/speed/docs/insights/release_notes
 */
const PSI_FETCH_TIMEOUT_MS = 120_000;

/**
 * Hard wall-clock budget for the whole call (including retries). Must stay under
 * the web proxy PAGESPEED_PROXY_TIMEOUT_MS (150s).
 */
const PSI_TOTAL_DEADLINE_MS = 140_000;

/** Transient statuses Google / edge proxies return for PSI overload or throttling. */
const PSI_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Truncated exponential backoff with jitter (Google API client guidance).
 * Fast 503s are retried; a full 120s timeout is not retried (no budget left).
 */
const PSI_MAX_ATTEMPTS = 4;
const PSI_BACKOFF_BASE_MS = 1_000;
const PSI_BACKOFF_MAX_MS = 8_000;

/** Official service endpoint per Google REST docs. */
const PSI_API_ENDPOINT =
  "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";

function getCacheKey(url: string, strategy: 'mobile' | 'desktop'): string {
  return `pagespeed:${url}:${strategy}`;
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number.parseInt(retryAfterHeader, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, PSI_BACKOFF_MAX_MS);
    }
  }
  const exp = PSI_BACKOFF_BASE_MS * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(exp + jitter, PSI_BACKOFF_MAX_MS);
}

/**
 * Always read as text first. Google (and edge proxies) sometimes return plain text
 * bodies like "Service Unavailable" instead of JSON on 5xx  calling response.json()
 * produces: Unexpected token 'S', "Service Unavailable" is not valid JSON.
 */
async function readPsiBody(response: Response): Promise<{
  text: string;
  json: unknown | undefined;
}> {
  const text = await response.text();
  if (!text) {
    return { text: "", json: undefined };
  }
  try {
    return { text, json: JSON.parse(text) as unknown };
  } catch {
    return { text, json: undefined };
  }
}

function googleErrorMessage(json: unknown, text: string): string | undefined {
  if (json && typeof json === "object") {
    const msg = (json as { error?: { message?: unknown } }).error?.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  const trimmed = text.trim();
  if (trimmed && trimmed.length <= 200 && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }
  return undefined;
}

function isRetryableTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  return (
    name === "timeouterror" ||
    name === "aborterror" ||
    message.includes("timeout") ||
    message.includes("aborted") ||
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("socket")
  );
}

function throwForPsiHttpStatus(
  status: number,
  googleMessage: string | undefined,
): never {
  if (status === 400) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        googleMessage ??
        'PageSpeed Insights returned 400. Check GOOGLE_PAGESPEED_API_KEY (valid, unrestricted or server/IP allowed), URL reachability, and API parameters.',
    });
  }
  if (status === 401 || status === 403) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: googleMessage ?? 'Invalid API key or authentication failed',
    });
  }
  if (status === 429) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: googleMessage ?? 'Rate limit exceeded. Please try again later.',
    });
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message:
      googleMessage ??
      `PageSpeed Insights API error: ${status}`,
  });
}

/**
 * Call Google PageSpeed Insights API with retries for transient failures.
 * @see https://developers.google.com/speed/docs/insights/v5/get-started
 * @see https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed
 */
async function callPageSpeedAPI(url: string, strategy: 'mobile' | 'desktop'): Promise<any> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'GOOGLE_PAGESPEED_API_KEY environment variable is not set',
    });
  }

  // Request all categories explicitly - API v5 only returns Performance by default
  const apiUrl = new URL(PSI_API_ENDPOINT);
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("strategy", strategy);
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    apiUrl.searchParams.append("category", category);
  }
  apiUrl.searchParams.set("key", apiKey);

  let lastFailureMessage = "PageSpeed Insights API request failed";
  const startedAt = Date.now();

  for (let attempt = 0; attempt < PSI_MAX_ATTEMPTS; attempt++) {
    const remainingMs = PSI_TOTAL_DEADLINE_MS - (Date.now() - startedAt);
    if (remainingMs < 5_000) {
      break;
    }

    const attemptTimeoutMs = Math.min(PSI_FETCH_TIMEOUT_MS, remainingMs - 1_000);

    try {
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(attemptTimeoutMs),
      });

      const { text, json } = await readPsiBody(response);
      const googleMessage = googleErrorMessage(json, text);

      if (!response.ok) {
        lastFailureMessage =
          googleMessage ??
          `PageSpeed Insights API error: ${response.status} ${response.statusText || ""}`.trim();

        const delay = backoffDelayMs(attempt, response.headers.get("Retry-After"));
        const canRetry =
          PSI_RETRYABLE_STATUS.has(response.status) &&
          attempt < PSI_MAX_ATTEMPTS - 1 &&
          Date.now() - startedAt + delay + 5_000 < PSI_TOTAL_DEADLINE_MS;

        if (canRetry) {
          console.warn(
            `[pagespeed] HTTP ${response.status} attempt ${attempt + 1}/${PSI_MAX_ATTEMPTS}; retry in ${delay}ms`,
          );
          await sleep(delay);
          continue;
        }

        throwForPsiHttpStatus(response.status, googleMessage);
      }

      // HTTP 2xx but body is plain text (e.g. edge "Service Unavailable")  retry.
      if (json === undefined) {
        lastFailureMessage =
          googleMessage ??
          `PageSpeed Insights returned a non-JSON response (${response.status})`;

        const delay = backoffDelayMs(attempt, null);
        const canRetry =
          attempt < PSI_MAX_ATTEMPTS - 1 &&
          Date.now() - startedAt + delay + 5_000 < PSI_TOTAL_DEADLINE_MS;

        if (canRetry) {
          console.warn(
            `[pagespeed] non-JSON body attempt ${attempt + 1}/${PSI_MAX_ATTEMPTS}; retry in ${delay}ms`,
          );
          await sleep(delay);
          continue;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'PageSpeed Insights is temporarily unavailable. Please try again in a moment.',
        });
      }

      return json;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      lastFailureMessage =
        error instanceof Error ? error.message : "Unknown error";

      const delay = backoffDelayMs(attempt, null);
      const canRetry =
        isRetryableTransportError(error) &&
        attempt < PSI_MAX_ATTEMPTS - 1 &&
        Date.now() - startedAt + delay + 5_000 < PSI_TOTAL_DEADLINE_MS;

      if (canRetry) {
        console.warn(
          `[pagespeed] transport error attempt ${attempt + 1}/${PSI_MAX_ATTEMPTS}; retry in ${delay}ms: ${lastFailureMessage}`,
        );
        await sleep(delay);
        continue;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch PageSpeed Insights data: ${lastFailureMessage}`,
        cause: error,
      });
    }
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message:
      lastFailureMessage.includes("Service Unavailable") ||
      lastFailureMessage.includes("not valid JSON")
        ? "PageSpeed Insights is temporarily unavailable. Please try again in a moment."
        : lastFailureMessage,
  });
}

/**
 * Extract and format performance metrics from API response
 */
function formatPageSpeedData(apiResponse: any) {
  const lighthouse = apiResponse.lighthouseResult;
  const categories = lighthouse?.categories || {};
  const audits = lighthouse?.audits || {};

  // Performance score (0-100)
  const performanceScore = categories.performance?.score != null
    ? Math.round(categories.performance.score * 100)
    : null;

  // Core Web Vitals
  const lcp = audits['largest-contentful-paint'];
  const fid = audits['max-potential-fid'] || audits['first-input-delay'];
  const cls = audits['cumulative-layout-shift'];
  const fcp = audits['first-contentful-paint'];
  const tbt = audits['total-blocking-time'];
  const si = audits['speed-index'];
  const tti = audits['interactive'];

  // Category scores - check for undefined/null, not truthiness (0 is a valid score)
  const accessibilityScore = categories.accessibility?.score != null
    ? Math.round(categories.accessibility.score * 100)
    : null;
  const bestPracticesScore = categories['best-practices']?.score != null
    ? Math.round(categories['best-practices'].score * 100)
    : null;
  const seoScore = categories.seo?.score != null
    ? Math.round(categories.seo.score * 100)
    : null;

  // Field data (real user metrics) - optional
  const loadingExperience = apiResponse.loadingExperience;
  const fieldData = loadingExperience ? {
    overallCategory: loadingExperience.overall_category,
    metrics: loadingExperience.metrics ? {
      fcp: loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS,
      lcp: loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS,
      fid: loadingExperience.metrics.FIRST_INPUT_DELAY_MS,
      cls: loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE,
      inp: loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT,
    } : null,
  } : null;

  return {
    performance: {
      score: performanceScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
    },
    metrics: {
      lcp: lcp ? {
        value: lcp.numericValue,
        displayValue: lcp.displayValue,
        score: lcp.score ? Math.round(lcp.score * 100) : null,
      } : null,
      fid: fid ? {
        value: fid.numericValue,
        displayValue: fid.displayValue,
        score: fid.score ? Math.round(fid.score * 100) : null,
      } : null,
      cls: cls ? {
        value: cls.numericValue,
        displayValue: cls.displayValue,
        score: cls.score ? Math.round(cls.score * 100) : null,
      } : null,
      fcp: fcp ? {
        value: fcp.numericValue,
        displayValue: fcp.displayValue,
        score: fcp.score ? Math.round(fcp.score * 100) : null,
      } : null,
      tbt: tbt ? {
        value: tbt.numericValue,
        displayValue: tbt.displayValue,
        score: tbt.score ? Math.round(tbt.score * 100) : null,
      } : null,
      si: si ? {
        value: si.numericValue,
        displayValue: si.displayValue,
        score: si.score ? Math.round(si.score * 100) : null,
      } : null,
      tti: tti ? {
        value: tti.numericValue,
        displayValue: tti.displayValue,
        score: tti.score ? Math.round(tti.score * 100) : null,
      } : null,
    },
    fieldData,
    timestamp: lighthouse?.fetchTime || new Date().toISOString(),
    url: lighthouse?.finalUrl || lighthouse?.requestedUrl,
  };
}

export const pagespeedInsightsRouter = router({
  getPageSpeed: protectedProcedure
    .input(z.object({
      url: z.string().url('Invalid URL format'),
      strategy: z.enum(['mobile', 'desktop']).default('mobile'),
      forceRefresh: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      try {
        const { url, strategy, forceRefresh } = input;
        const cacheKey = getCacheKey(url, strategy);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = getCachedData(cacheKey);
          if (cached) {
            return {
              ...cached,
              cached: true,
            };
          }
        }

        // Call Google API
        const apiResponse = await callPageSpeedAPI(url, strategy);

        // Format the response
        const formattedData = formatPageSpeedData(apiResponse);

        // Cache the result
        setCachedData(cacheKey, formattedData);

        return {
          ...formattedData,
          cached: false,
        };
      } catch (error) {
        console.error('PageSpeed Insights API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get PageSpeed Insights data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),
});
