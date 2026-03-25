import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from '../trpc';

// Simple in-memory cache (can be upgraded to Redis later)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

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

/**
 * Call Google PageSpeed Insights API
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
  // Categories are case-insensitive: performance, accessibility, best-practices, seo
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid URL or request parameters',
        });
      }
      if (response.status === 401 || response.status === 403) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key or authentication failed',
        });
      }
      if (response.status === 429) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `PageSpeed Insights API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch PageSpeed Insights data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      cause: error,
    });
  }
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
  getPageSpeed: publicProcedure
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
