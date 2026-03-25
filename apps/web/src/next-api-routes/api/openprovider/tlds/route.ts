import { z } from 'zod';
import { createOpenproviderClient, OpenproviderApiError } from '@/lib/openprovider-client';
import type { OpenproviderTldRequest } from '@/types/openprovider';
import { DEFAULT_OPENPROVIDER_CONFIG } from '@/types/openprovider';

// Validation schema for TLD request query parameters
const TldRequestSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
  extensions: z.string().optional().transform((val) => 
    val ? val.split(',').map(ext => ext.trim()) : undefined
  ),
  status: z.enum(['ACT', 'INACT']).optional(),
  with_price: z.coerce.boolean().optional(),
  with_description: z.coerce.boolean().optional(),
  with_restrictions: z.coerce.boolean().optional(),
});

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(params: OpenproviderTldRequest): string {
  return JSON.stringify(params);
}

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = TldRequestSchema.parse(queryParams);

    // Check cache first
    const cacheKey = getCacheKey(validatedParams);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return Response.json({
        success: true,
        data: cachedData,
        cached: true,
        cached_at: new Date().toISOString(),
      });
    }

    // Authenticate using environment variables
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/openprovider/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useEnvCredentials: true }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return Response.json(
        {
          success: false,
          error: {
            code: 401,
            message: errorData.error?.message || 'Authentication failed',
          },
        },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const token = authData.data.token;

    // Create Openprovider client with extended timeout for TLD requests
    const client = createOpenproviderClient({
      ...DEFAULT_OPENPROVIDER_CONFIG,
      timeout: 90000, // 90 seconds for TLD requests
    });
    client.setToken(token);

    // Prepare TLD request
    const tldRequest: OpenproviderTldRequest = {
      limit: validatedParams.limit || 100,
      offset: validatedParams.offset || 0,
      extensions: validatedParams.extensions,
      status: validatedParams.status || 'ACT',
      with_price: validatedParams.with_price ?? true,
      with_description: validatedParams.with_description ?? true,
      with_restrictions: validatedParams.with_restrictions ?? true,
    };

    // Fetch TLDs from Openprovider
    const tldResponse = await client.getTlds(tldRequest);

    // Check if request was successful
    if (tldResponse.code !== 0) {
      return Response.json(
        {
          success: false,
          error: {
            code: tldResponse.code,
            message: tldResponse.desc,
          },
        },
        { status: 400 }
      );
    }

    // Cache the response
    setCachedData(cacheKey, tldResponse.data);

    // Return successful response
    return Response.json({
      success: true,
      data: tldResponse.data,
      cached: false,
      fetched_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Openprovider TLD retrieval error:', error);

    // Handle timeout errors specifically
    if (error instanceof OpenproviderApiError && 
        (error.description.includes('timeout') || error.originalError?.code === 'ECONNABORTED')) {
      console.warn('TLD request timed out, this may be due to Openprovider API slowness');
      return Response.json(
        {
          success: false,
          error: {
            code: 408,
            message: 'Request timeout - Openprovider API is responding slowly. Please try again.',
            retry_after: 30, // Suggest retry after 30 seconds
          },
        },
        { status: 408 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Invalid query parameters',
            details: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Handle Openprovider API errors
    if (error instanceof OpenproviderApiError) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.description,
          },
        },
        { status: error.code >= 400 && error.code < 500 ? error.code : 500 }
      );
    }

    // Handle unexpected errors
    return Response.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

// Optional: Add a POST method for more complex TLD queries
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedParams = TldRequestSchema.parse(body);

    // Authenticate using environment variables
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/openprovider/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useEnvCredentials: true }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return Response.json(
        {
          success: false,
          error: {
            code: 401,
            message: errorData.error?.message || 'Authentication failed',
          },
        },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const token = authData.data.token;

    // Create Openprovider client with extended timeout for TLD requests
    const client = createOpenproviderClient({
      ...DEFAULT_OPENPROVIDER_CONFIG,
      timeout: 90000, // 90 seconds for TLD requests
    });
    client.setToken(token);

    // Check cache first
    const cacheKey = getCacheKey(validatedParams);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return Response.json({
        success: true,
        data: cachedData,
        cached: true,
        cached_at: new Date().toISOString(),
      });
    }

    // Fetch TLDs from Openprovider
    const tldResponse = await client.getTlds(validatedParams);

    // Check if request was successful
    if (tldResponse.code !== 0) {
      return Response.json(
        {
          success: false,
          error: {
            code: tldResponse.code,
            message: tldResponse.desc,
          },
        },
        { status: 400 }
      );
    }

    // Cache the response
    setCachedData(cacheKey, tldResponse.data);

    // Return successful response
    return Response.json({
      success: true,
      data: tldResponse.data,
      cached: false,
      fetched_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Openprovider TLD retrieval error:', error);

    // Handle timeout errors specifically
    if (error instanceof OpenproviderApiError && 
        (error.description.includes('timeout') || error.originalError?.code === 'ECONNABORTED')) {
      console.warn('TLD request timed out, this may be due to Openprovider API slowness');
      return Response.json(
        {
          success: false,
          error: {
            code: 408,
            message: 'Request timeout - Openprovider API is responding slowly. Please try again.',
            retry_after: 30, // Suggest retry after 30 seconds
          },
        },
        { status: 408 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Invalid request data',
            details: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Handle Openprovider API errors
    if (error instanceof OpenproviderApiError) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.description,
          },
        },
        { status: error.code >= 400 && error.code < 500 ? error.code : 500 }
      );
    }

    // Handle unexpected errors
    return Response.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
