import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
// Validation schemas
const DnsZoneRequestSchema = z.object({
    domain: z.object({
        name: z.string().min(1, 'Domain name is required'),
        extension: z.string().min(1, 'Domain extension is required'),
    }),
    type: z.enum(['master', 'slave']),
    records: z.array(z.object({
        name: z.string().min(1, 'Record name is required'),
        type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS', 'TLSA', 'SSHFP', 'CAA']),
        value: z.string().min(1, 'Record value is required'),
        prio: z.number().optional(),
        ttl: z.number().min(900).max(86400).optional().default(3600),
    })).optional(),
    template_name: z.string().optional(),
    provider: z.enum(['sectigo']).optional(),
    secured: z.boolean().optional().default(false),
    master_ip: z.string().optional(),
});
const DnsZoneSearchRequestSchema = z.object({
    limit: z.number().min(1).max(1000).optional().default(100),
    offset: z.number().min(0).optional().default(0),
    name_pattern: z.string().optional(),
    type: z.enum(['master', 'slave']).optional(),
    with_records: z.boolean().optional().default(false),
    with_history: z.boolean().optional().default(false),
});
const DnsZoneUpdateRequestSchema = z.object({
    zoneName: z.string().min(1, 'Zone name is required'),
    records: z.object({
        add: z.array(z.object({
            name: z.string().min(1, 'Record name is required'),
            type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS', 'TLSA', 'SSHFP', 'CAA']),
            value: z.string().min(1, 'Record value is required'),
            prio: z.number().optional(),
            ttl: z.number().min(900).max(86400).optional().default(3600),
        })).optional(),
        update: z.array(z.object({
            name: z.string().min(1, 'Record name is required'),
            type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS', 'TLSA', 'SSHFP', 'CAA']),
            value: z.string().min(1, 'Record value is required'),
            prio: z.number().optional(),
            ttl: z.number().min(900).max(86400).optional().default(3600),
        })).optional(),
        remove: z.array(z.object({
            name: z.string().min(1, 'Record name is required'),
            type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS', 'TLSA', 'SSHFP', 'CAA']),
            value: z.string().min(1, 'Record value is required'),
            prio: z.number().optional(),
            ttl: z.number().min(900).max(86400).optional().default(3600),
        })).optional(),
    }).optional(),
    is_spamexperts_enabled: z.boolean().optional(),
});
const DnsRecordSchema = z.object({
    name: z.string().min(1, 'Record name is required'),
    type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS', 'TLSA', 'SSHFP', 'CAA']),
    value: z.string().min(1, 'Record value is required'),
    prio: z.number().optional(),
    ttl: z.number().min(900).max(86400).optional().default(3600),
});
export const openProviderDnsRouter = router({
    /**
     * Create a DNS zone
     */
    createZone: protectedProcedure
        .input(DnsZoneRequestSchema)
        .mutation(async ({ input }) => {
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
            const zoneRequest = {
                domain: input.domain,
                type: input.type,
                records: input.records,
                template_name: input.template_name,
                provider: input.provider,
                secured: input.secured,
                master_ip: input.master_ip,
            };
            const response = await client.createDnsZone(zoneRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    created_at: new Date().toISOString(),
                    zone: `${input.domain.name}${input.domain.extension}`,
                    type: input.type,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS zone creation error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Search DNS zones
     */
    searchZones: protectedProcedure
        .input(DnsZoneSearchRequestSchema)
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
            const searchRequest = {
                limit: input.limit,
                offset: input.offset,
                name_pattern: input.name_pattern,
                type: input.type,
                with_records: input.with_records,
                with_history: input.with_history,
            };
            const response = await client.listDnsZones(searchRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    searched_at: new Date().toISOString(),
                    total: response.data.total,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS zone search error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Get a specific DNS zone
     */
    getZone: protectedProcedure
        .input(z.object({
        zoneName: z.string().min(1, 'Zone name is required'),
        withRecords: z.boolean().optional().default(false),
        withHistory: z.boolean().optional().default(false),
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
            const response = await client.getDnsZone(input.zoneName, {
                with_records: input.withRecords,
                with_history: input.withHistory,
            });
            // According to OpenProvider API docs, code 0 means success
            if (response.code !== 0) {
                // Handle zone not found (872) as a valid state, not an error
                // This is expected when a domain doesn't have a DNS zone configured yet
                if (response.code === 872) {
                    return {
                        success: false,
                        zoneNotFound: true,
                        data: null,
                        message: 'DNS zone not found. The domain may not have a DNS zone configured yet.',
                        meta: {
                            retrieved_at: new Date().toISOString(),
                            zone_name: input.zoneName,
                            with_records: input.withRecords,
                            with_history: input.withHistory,
                            error_code: 872,
                        },
                    };
                }
                // For other errors, throw a proper error
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc || `OpenProvider API error: ${response.code}`,
                });
            }
            return {
                success: true,
                zoneNotFound: false,
                data: response.data,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                    with_records: input.withRecords,
                    with_history: input.withHistory,
                },
            };
        }
        catch (error) {
            // Zone not found (872) is a valid state per OpenProvider 8xx DNS module docs
            const code = error instanceof OpenProviderApiError ? error.code : error?.code;
            if (code === 872) {
                return {
                    success: false,
                    zoneNotFound: true,
                    data: null,
                    message: 'DNS zone not found. The domain may not have a DNS zone configured in OpenProvider yet.',
                    meta: {
                        retrieved_at: new Date().toISOString(),
                        zone_name: input.zoneName,
                        with_records: input.withRecords,
                        with_history: input.withHistory,
                        error_code: 872,
                    },
                };
            }
            console.error('OpenProvider DNS zone retrieval error:', error);
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Update a DNS zone
     */
    updateZone: protectedProcedure
        .input(DnsZoneUpdateRequestSchema)
        .mutation(async ({ input }) => {
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
            const updateRequest = {
                records: input.records,
                is_spamexperts_enabled: input.is_spamexperts_enabled,
            };
            const response = await client.updateDnsZone(input.zoneName, updateRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    updated_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS zone update error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Delete a DNS zone
     */
    deleteZone: protectedProcedure
        .input(z.object({
        zoneName: z.string().min(1, 'Zone name is required'),
    }))
        .mutation(async ({ input }) => {
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
            const response = await client.deleteDnsZone(input.zoneName);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response,
                meta: {
                    deleted_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS zone deletion error:', error);
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Add DNS records to a zone
     */
    addRecords: protectedProcedure
        .input(z.object({
        zoneName: z.string().min(1, 'Zone name is required'),
        records: z.array(DnsRecordSchema),
    }))
        .mutation(async ({ input }) => {
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
            const updateRequest = {
                records: {
                    add: input.records,
                },
            };
            const response = await client.updateDnsZone(input.zoneName, updateRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    updated_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                    records_added: input.records.length,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS records addition error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Update DNS records in a zone
     */
    updateRecords: protectedProcedure
        .input(z.object({
        zoneName: z.string().min(1, 'Zone name is required'),
        records: z.array(DnsRecordSchema),
    }))
        .mutation(async ({ input }) => {
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
            const updateRequest = {
                records: {
                    update: input.records,
                },
            };
            const response = await client.updateDnsZone(input.zoneName, updateRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    updated_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                    records_updated: input.records.length,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS records update error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Remove DNS records from a zone
     */
    removeRecords: protectedProcedure
        .input(z.object({
        zoneName: z.string().min(1, 'Zone name is required'),
        records: z.array(DnsRecordSchema),
    }))
        .mutation(async ({ input }) => {
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
            const updateRequest = {
                records: {
                    remove: input.records,
                },
            };
            const response = await client.updateDnsZone(input.zoneName, updateRequest);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    updated_at: new Date().toISOString(),
                    zone_name: input.zoneName,
                    records_removed: input.records.length,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS records removal error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
     * Get all DNS zones
     */
    getAllZones: protectedProcedure
        .input(z.object({
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
        withRecords: z.boolean().optional().default(false),
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
            const response = await client.listDnsZones({
                limit: input.limit,
                offset: input.offset,
                with_records: input.withRecords,
            });
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    total: response.data.total,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider DNS zones list error:', error);
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
            if (error instanceof OpenProviderApiError) {
                throw new TRPCError({
                    code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
                    message: error.description,
                });
            }
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
