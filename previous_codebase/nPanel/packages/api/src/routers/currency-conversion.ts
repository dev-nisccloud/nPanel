import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { Redis } from "@upstash/redis";

// Lazy-loaded Redis client instance
let redisInstance: Redis | null = null;

/**
 * Get or create Redis client (lazy initialization)
 */
function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing required Upstash Redis environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN"
      );
    }

    redisInstance = new Redis({ url, token });

    // Add del method if not available (for development)
    if (!redisInstance.del) {
      (redisInstance as any).del = async (key: string) => {
        console.log(`Mock Redis DEL: ${key}`);
        return 1;
      };
    }
  }
  return redisInstance;
}

// Supported currencies
const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
];

// Cache keys and durations
const CACHE_KEYS = {
  EXCHANGE_RATES: 'exchange_rates',
  LAST_FETCH_TIME: 'exchange_rates_last_fetch',
  API_USAGE: 'exchange_api_usage',
} as const;

const CACHE_DURATION = {
  RATES: 6 * 60 * 60, // 6 hours in seconds
  USAGE_TRACKING: 30 * 24 * 60 * 60, // 30 days in seconds
} as const;

// API usage tracking
const API_LIMITS = {
  MONTHLY_LIMIT: 1500,
  WARNING_THRESHOLD: 1200,
  CRITICAL_THRESHOLD: 1400,
} as const;

// Input/Output schemas
const getExchangeRatesSchema = z.object({
  baseCurrency: z.string().default('USD'),
});

const convertPricesSchema = z.object({
  prices: z.array(z.object({
    amount: z.number(),
    currency: z.string(),
  })),
  targetCurrency: z.string(),
});

const exchangeRatesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    base: z.string(),
    rates: z.record(z.string(), z.number()),
    timestamp: z.number(),
  }).optional(),
  error: z.string().optional(),
});

const convertedPricesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    originalAmount: z.number(),
    convertedAmount: z.number(),
    rate: z.number(),
    currency: z.string(),
  })).optional(),
  error: z.string().optional(),
});

// Helper function to fetch rates from ExchangeRate-API
async function fetchExchangeRates(baseCurrency: string = 'USD') {
  try {
    // Use API key if available, otherwise use free tier
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    const baseUrl = apiKey 
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      : `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    console.log(`Fetching exchange rates from ${apiKey ? 'paid tier' : 'free tier'} API`);
    
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    // Validate response structure
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response structure');
    }
    
    return {
      base: data.base,
      rates: data.rates,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw new Error(`Failed to fetch exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to track API usage
async function trackApiUsage() {
  try {
    const redis = getRedisClient();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageKey = `${CACHE_KEYS.API_USAGE}:${currentMonth}`;
    
    const currentUsage = await redis.incr(usageKey);
    await redis.expire(usageKey, CACHE_DURATION.USAGE_TRACKING);
    
    console.log(`API usage tracked: ${currentUsage}/${API_LIMITS.MONTHLY_LIMIT} calls used this month`);
    return currentUsage;
  } catch (error) {
    console.error('Failed to track API usage:', error);
    return 0;
  }
}

// Helper function to clean up expired cache entries
async function cleanupExpiredCache() {
  try {
    // This is a simple cleanup - in production, you might want to use Redis SCAN
    // For now, we rely on Redis TTL to handle expiration
    console.log('Cache cleanup completed (handled by Redis TTL)');
  } catch (error) {
    console.error('Failed to cleanup cache:', error);
  }
}

// Helper function to get cached rates
async function getCachedRates(baseCurrency: string) {
  try {
    const redis = getRedisClient();
    const ratesKey = `${CACHE_KEYS.EXCHANGE_RATES}:${baseCurrency}`;
    const lastFetchKey = `${CACHE_KEYS.LAST_FETCH_TIME}:${baseCurrency}`;
    
    const [cachedRates, lastFetchTime] = await Promise.all([
      redis.get(ratesKey),
      redis.get(lastFetchKey),
    ]);
    
    if (cachedRates && lastFetchTime) {
      const timeSinceLastFetch = Date.now() - parseInt(lastFetchTime as string);
      const cacheAgeHours = timeSinceLastFetch / (1000 * 60 * 60);
      
      // Return cached rates if less than 6 hours old
      if (cacheAgeHours < 6) {
        try {
          // Handle both string and object responses from Redis
          let rates: Record<string, number>;
          if (typeof cachedRates === 'string') {
            rates = JSON.parse(cachedRates) as Record<string, number>;
          } else if (typeof cachedRates === 'object' && cachedRates !== null) {
            rates = cachedRates as Record<string, number>;
          } else {
            throw new Error('Invalid cached rates format');
          }
          
          return {
            rates,
            timestamp: parseInt(lastFetchTime as string),
            fromCache: true,
          };
        } catch (parseError) {
          console.error('Failed to parse cached rates:', parseError);
          // Clear invalid cache and return null to trigger fresh fetch
          await redis.del(ratesKey);
          await redis.del(lastFetchKey);
          return null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get cached rates:', error);
    // Return null to trigger fresh fetch
    return null;
  }
}

// Helper function to cache rates
async function cacheRates(baseCurrency: string, rates: Record<string, number>, timestamp: number) {
  try {
    const redis = getRedisClient();
    const ratesKey = `${CACHE_KEYS.EXCHANGE_RATES}:${baseCurrency}`;
    const lastFetchKey = `${CACHE_KEYS.LAST_FETCH_TIME}:${baseCurrency}`;
    
    // Ensure we store JSON strings
    const ratesJson = JSON.stringify(rates);
    const timestampStr = timestamp.toString();
    
    await Promise.all([
      redis.setex(ratesKey, CACHE_DURATION.RATES, ratesJson),
      redis.setex(lastFetchKey, CACHE_DURATION.RATES, timestampStr),
    ]);
    
    console.log(`Cached exchange rates for ${baseCurrency} with ${Object.keys(rates).length} currencies`);
  } catch (error) {
    console.error('Failed to cache rates:', error);
    // Don't throw error - caching failure shouldn't break the API
  }
}

export const currencyConversionRouter = router({
  // Get supported currencies
  getSupportedCurrencies: protectedProcedure
    .output(z.array(z.object({
      code: z.string(),
      name: z.string(),
      symbol: z.string(),
    })))
    .query(() => {
      return SUPPORTED_CURRENCIES;
    }),

  // Get exchange rates (with smart caching)
  getExchangeRates: protectedProcedure
    .input(getExchangeRatesSchema)
    .output(exchangeRatesResponseSchema)
    .query(async ({ input }) => {
      try {
        const { baseCurrency } = input;
        
        // Check cache first
        const cachedRates = await getCachedRates(baseCurrency);
        if (cachedRates) {
          return {
            success: true,
            data: {
              base: baseCurrency,
              rates: cachedRates.rates,
              timestamp: cachedRates.timestamp,
            },
          };
        }
        
        // Check API usage limits
        const currentUsage = await trackApiUsage();
        if (currentUsage > API_LIMITS.CRITICAL_THRESHOLD) {
          throw new Error('API usage limit exceeded. Please try again later.');
        }
        
        // Fetch fresh rates
        const freshRates = await fetchExchangeRates(baseCurrency);
        
        // Cache the new rates
        await cacheRates(baseCurrency, freshRates.rates, freshRates.timestamp);
        
        // Clean up expired cache entries
        await cleanupExpiredCache();
        
        return {
          success: true,
          data: freshRates,
        };
      } catch (error) {
        console.error('Failed to get exchange rates:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch exchange rates',
        };
      }
    }),

  // Convert prices efficiently
  convertPrices: protectedProcedure
    .input(convertPricesSchema)
    .output(convertedPricesResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const { prices, targetCurrency } = input;
        
        if (prices.length === 0) {
          return {
            success: true,
            data: [],
          };
        }
        
        // Get exchange rates
        const cachedRates = await getCachedRates('USD');
        if (!cachedRates) {
          throw new Error('Exchange rates not available. Please try again later.');
        }
        
        const { rates } = cachedRates;
        
        // Convert all prices in one go
        const convertedPrices = prices.map(({ amount, currency }) => {
          let rate = 1;
          
          if (currency === targetCurrency) {
            // Same currency, no conversion needed
            rate = 1;
          } else if (currency === 'USD') {
            // Convert from USD to target currency
            rate = rates[targetCurrency] || 1;
          } else if (targetCurrency === 'USD') {
            // Convert to USD from source currency
            rate = 1 / (rates[currency] || 1);
          } else {
            // Convert between two non-USD currencies
            const usdToSource = rates[currency] || 1;
            const usdToTarget = rates[targetCurrency] || 1;
            rate = usdToTarget / usdToSource;
          }
          
          return {
            originalAmount: amount,
            convertedAmount: Math.round(amount * rate * 100) / 100, // Round to 2 decimal places
            rate,
            currency: targetCurrency,
          };
        });
        
        return {
          success: true,
          data: convertedPrices,
        };
      } catch (error) {
        console.error('Failed to convert prices:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to convert prices',
        };
      }
    }),

  // Get API configuration status
  getApiConfigStatus: protectedProcedure
    .output(z.object({
      apiKeyConfigured: z.boolean(),
      apiTier: z.enum(['free', 'paid']),
      apiEndpoint: z.string(),
      monthlyLimit: z.number(),
    }))
    .query(() => {
      const apiKey = process.env.EXCHANGERATE_API_KEY;
      const hasApiKey = !!apiKey;
      
      return {
        apiKeyConfigured: hasApiKey,
        apiTier: hasApiKey ? 'paid' : 'free',
        apiEndpoint: hasApiKey 
          ? `https://v6.exchangerate-api.com/v6/${apiKey?.slice(0, 8)}.../latest/USD`
          : 'https://api.exchangerate-api.com/v4/latest/USD',
        monthlyLimit: hasApiKey ? 10000 : 1500, // Paid tier has higher limits
      };
    }),

  // Get cache status and health
  getCacheStatus: protectedProcedure
    .output(z.object({
      redisConnected: z.boolean(),
      cacheKeys: z.array(z.string()),
      lastFetchTime: z.number().optional(),
      cacheAge: z.string().optional(),
    }))
    .query(async () => {
      try {
        const redis = getRedisClient();
        
        // Test Redis connection
        await redis.ping();
        
        // Get cache keys (simplified - in production use SCAN)
        const ratesKey = `${CACHE_KEYS.EXCHANGE_RATES}:USD`;
        const lastFetchKey = `${CACHE_KEYS.LAST_FETCH_TIME}:USD`;
        
        const lastFetchTime = await redis.get(lastFetchKey);
        const cacheAge = lastFetchTime ? 
          `${Math.round((Date.now() - parseInt(lastFetchTime as string)) / (1000 * 60 * 60))} hours` : 
          'No cache';
        
        return {
          redisConnected: true,
          cacheKeys: [ratesKey, lastFetchKey],
          lastFetchTime: lastFetchTime ? parseInt(lastFetchTime as string) : undefined,
          cacheAge,
        };
      } catch (error) {
        console.error('Failed to get cache status:', error);
        return {
          redisConnected: false,
          cacheKeys: [],
          lastFetchTime: undefined,
          cacheAge: 'Error',
        };
      }
    }),

  // Get API usage status
  getApiUsageStatus: protectedProcedure
    .output(z.object({
      currentUsage: z.number(),
      monthlyLimit: z.number(),
      usagePercentage: z.number(),
      status: z.enum(['normal', 'warning', 'critical']),
    }))
    .query(async () => {
      try {
        const redis = getRedisClient();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usageKey = `${CACHE_KEYS.API_USAGE}:${currentMonth}`;
        
        const currentUsage = Number(await redis.get(usageKey)) || 0;
        const usagePercentage = (currentUsage / API_LIMITS.MONTHLY_LIMIT) * 100;
        
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (currentUsage >= API_LIMITS.CRITICAL_THRESHOLD) {
          status = 'critical';
        } else if (currentUsage >= API_LIMITS.WARNING_THRESHOLD) {
          status = 'warning';
        }
        
        return {
          currentUsage,
          monthlyLimit: API_LIMITS.MONTHLY_LIMIT,
          usagePercentage,
          status,
        };
      } catch (error) {
        console.error('Failed to get API usage status:', error);
        return {
          currentUsage: 0,
          monthlyLimit: API_LIMITS.MONTHLY_LIMIT,
          usagePercentage: 0,
          status: 'normal' as const,
        };
      }
    }),
});
