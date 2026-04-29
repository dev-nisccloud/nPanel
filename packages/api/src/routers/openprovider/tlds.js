import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
// Helper function to ensure client is authenticated
async function ensureAuthenticated(client) {
    // Only authenticate if not already authenticated
    if (!client.isAuthenticated()) {
        try {
            await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME,
                password: process.env.OPENPROVIDER_PASSWORD,
                ip: process.env.OPENPROVIDER_IP,
            });
        }
        catch (authError) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'OpenProvider service unavailable. Please check server configuration.',
            });
        }
    }
}
// Validation schema for TLD request parameters
const TldRequestSchema = z.object({
    limit: z.number().min(1).max(2500).optional(),
    offset: z.number().min(0).optional(),
    extensions: z.array(z.string().min(1)).optional(),
    status: z.enum(['ACT', 'INACT']).optional(),
    with_price: z.boolean().optional(),
    with_description: z.boolean().optional(),
    with_restrictions: z.boolean().optional(),
});
const TldQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(2500).optional(),
    offset: z.coerce.number().min(0).optional(),
    extensions: z.string().optional().transform((val) => val ? val.split(',').map(ext => ext.trim()) : undefined),
    status: z.enum(['ACT', 'INACT']).optional(),
    with_price: z.coerce.boolean().optional(),
    with_description: z.coerce.boolean().optional(),
    with_restrictions: z.coerce.boolean().optional(),
}).optional();
export const openProviderTldRouter = router({
    /**
     * Get TLDs with query parameters (GET-style)
     */
    getTlds: protectedProcedure
        .input(TldQuerySchema)
        .query(async ({ input }) => {
        try {
            // Get cached client instance
            const client = createOpenProviderClient();
            // Ensure client is authenticated (only if needed)
            await ensureAuthenticated(client);
            // Prepare TLD request with default values if no input provided
            const tldRequest = {
                limit: input?.limit || 100,
                offset: input?.offset || 0,
                extensions: input?.extensions,
                status: input?.status || 'ACT',
                with_price: input?.with_price ?? true,
                with_description: input?.with_description ?? true,
                with_restrictions: input?.with_restrictions ?? true,
            };
            // Fetch TLDs from OpenProvider
            const tldResponse = await client.getTlds(tldRequest);
            // Check if request was successful
            if (tldResponse.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tldResponse.desc,
                });
            }
            // Return successful response
            return {
                success: true,
                data: tldResponse.data,
                meta: {
                    cached: false,
                    fetched_at: new Date().toISOString(),
                    total: tldResponse.data.total,
                    limit: tldRequest.limit,
                    offset: tldRequest.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider TLD retrieval error:', error);
            // Handle timeout errors specifically
            if (error instanceof OpenProviderApiError &&
                (error.description.includes('timeout') || error.originalError?.code === 'ECONNABORTED')) {
                throw new TRPCError({
                    code: 'TIMEOUT',
                    message: 'Request timeout - OpenProvider API is responding slowly. Please try again.',
                });
            }
            // Handle validation errors
            if (error instanceof z.ZodError) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid query parameters',
                    cause: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            // Handle OpenProvider API errors
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
            // Handle tRPC errors
            if (error instanceof TRPCError) {
                throw error;
            }
            // Handle unexpected errors
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            });
        }
    }),
    /**
     * Get TLDs with request body (POST-style)
     */
    getTldsPost: protectedProcedure
        .input(TldRequestSchema)
        .mutation(async ({ input }) => {
        try {
            // Authenticate using environment variables
            const client = createOpenProviderClient();
            // Try to authenticate with environment credentials
            try {
                await client.authenticate({
                    username: process.env.OPENPROVIDER_USERNAME,
                    password: process.env.OPENPROVIDER_PASSWORD,
                    ip: process.env.OPENPROVIDER_IP,
                });
            }
            catch (authError) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'OpenProvider service unavailable. Please check server configuration.',
                });
            }
            // Fetch TLDs from OpenProvider
            const tldResponse = await client.getTlds(input);
            // Check if request was successful
            if (tldResponse.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tldResponse.desc,
                });
            }
            // Return successful response
            return {
                success: true,
                data: tldResponse.data,
                meta: {
                    cached: false,
                    fetched_at: new Date().toISOString(),
                    total: tldResponse.data.total,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider TLD retrieval error:', error);
            // Handle timeout errors specifically
            if (error instanceof OpenProviderApiError &&
                (error.description.includes('timeout') || error.originalError?.code === 'ECONNABORTED')) {
                throw new TRPCError({
                    code: 'TIMEOUT',
                    message: 'Request timeout - OpenProvider API is responding slowly. Please try again.',
                });
            }
            // Handle validation errors
            if (error instanceof z.ZodError) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid request data',
                    cause: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            // Handle OpenProvider API errors
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
            // Handle tRPC errors
            if (error instanceof TRPCError) {
                throw error;
            }
            // Handle unexpected errors
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            });
        }
    }),
    /**
     * Get popular TLD extensions
     */
    getPopularTlds: protectedProcedure
        .query(async () => {
        try {
            const client = createOpenProviderClient();
            // Try to authenticate with environment credentials
            try {
                await client.authenticate({
                    username: process.env.OPENPROVIDER_USERNAME,
                    password: process.env.OPENPROVIDER_PASSWORD,
                    ip: process.env.OPENPROVIDER_IP,
                });
            }
            catch (authError) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'OpenProvider service unavailable. Please check server configuration.',
                });
            }
            // Get popular TLD extensions
            const popularExtensions = ['.com', '.net', '.org', '.info', '.biz', '.co', '.io', '.me', '.tv', '.cc'];
            const tldResponse = await client.getTlds({
                extensions: popularExtensions,
                status: 'ACT',
                with_price: true,
                with_description: true,
                with_restrictions: true,
            });
            if (tldResponse.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tldResponse.desc,
                });
            }
            return {
                success: true,
                data: tldResponse.data,
                meta: {
                    cached: false,
                    fetched_at: new Date().toISOString(),
                    total: tldResponse.data.total,
                    popular_extensions: popularExtensions,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider popular TLD retrieval error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            });
        }
    }),
    /**
     * Get TLD by extension
     */
    getTldByExtension: protectedProcedure
        .input(z.object({
        extension: z.string().min(1, 'Extension is required'),
    }))
        .query(async ({ input }) => {
        try {
            const client = createOpenProviderClient();
            // Try to authenticate with environment credentials
            try {
                await client.authenticate({
                    username: process.env.OPENPROVIDER_USERNAME,
                    password: process.env.OPENPROVIDER_PASSWORD,
                    ip: process.env.OPENPROVIDER_IP,
                });
            }
            catch (authError) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'OpenProvider service unavailable. Please check server configuration.',
                });
            }
            // Get specific TLD
            const tldResponse = await client.getTlds({
                extensions: [input.extension],
                status: 'ACT',
                with_price: true,
                with_description: true,
                with_restrictions: true,
            });
            if (tldResponse.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tldResponse.desc,
                });
            }
            const extNorm = input.extension.startsWith('.') ? input.extension.slice(1) : input.extension;
            const tld = tldResponse.data.results.find((t) => {
                const name = t?.name ?? '';
                const nameNorm = name.startsWith('.') ? name.slice(1) : name;
                return nameNorm === extNorm || name === input.extension;
            });
            if (!tld) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `TLD ${input.extension} not found`,
                });
            }
            return {
                success: true,
                data: tld,
                meta: {
                    cached: false,
                    fetched_at: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            console.error('OpenProvider TLD by extension retrieval error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            });
        }
    }),
    /**
     * Search TLDs by name pattern
     */
    searchTlds: protectedProcedure
        .input(z.object({
        pattern: z.string().min(1, 'Search pattern is required'),
        limit: z.number().min(1).max(2500).optional(),
    }))
        .query(async ({ input }) => {
        try {
            const client = createOpenProviderClient();
            // Try to authenticate with environment credentials
            try {
                await client.authenticate({
                    username: process.env.OPENPROVIDER_USERNAME,
                    password: process.env.OPENPROVIDER_PASSWORD,
                    ip: process.env.OPENPROVIDER_IP,
                });
            }
            catch (authError) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'OpenProvider service unavailable. Please check server configuration.',
                });
            }
            // Get all TLDs and filter by pattern
            const tldResponse = await client.getTlds({
                status: 'ACT',
                with_price: true,
                with_description: true,
                with_restrictions: true,
            });
            if (tldResponse.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: tldResponse.desc,
                });
            }
            // Filter TLDs by pattern
            const filteredTlds = tldResponse.data.results.filter((tld) => tld.name.toLowerCase().includes(input.pattern.toLowerCase()) ||
                (tld.prices && JSON.stringify(tld.prices).toLowerCase().includes(input.pattern.toLowerCase())));
            // Apply limit
            const limitedTlds = input.limit ? filteredTlds.slice(0, input.limit) : filteredTlds;
            return {
                success: true,
                data: {
                    results: limitedTlds,
                    total: filteredTlds.length,
                },
                meta: {
                    cached: false,
                    fetched_at: new Date().toISOString(),
                    search_pattern: input.pattern,
                    filtered_count: filteredTlds.length,
                    returned_count: limitedTlds.length,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider TLD search error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
            });
        }
    }),
});
