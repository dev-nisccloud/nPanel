import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
// Validation schemas
const CustomerRequestSchema = z.object({
    name: z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
    }),
    address: z.object({
        street: z.string().min(1, 'Street is required'),
        number: z.string().min(1, 'Number is required'),
        zipcode: z.string().min(1, 'Zipcode is required'),
        city: z.string().min(1, 'City is required'),
        country: z.string().min(1, 'Country is required'),
        state: z.string().optional(),
    }),
    phone: z.object({
        country_code: z.string().min(1, 'Country code is required'),
        area_code: z.string().min(1, 'Area code is required'),
        subscriber_number: z.string().min(1, 'Subscriber number is required'),
    }),
    email: z.string().email('Valid email is required'),
    company_name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    additional_data: z.record(z.string(), z.any()).optional(),
});
const CustomerSearchRequestSchema = z.object({
    handle_pattern: z.string().optional(),
    email_pattern: z.string().optional(),
    first_name_pattern: z.string().optional(),
    last_name_pattern: z.string().optional(),
    company_name_pattern: z.string().optional(),
    comment_pattern: z.string().optional(),
    with_additional_data: z.boolean().optional().default(false),
    limit: z.number().min(1).max(1000).optional().default(100),
    offset: z.number().min(0).optional().default(0),
});
const EmailVerificationStartSchema = z.object({
    email: z.string().email('Valid email is required'),
    handle: z.string().min(1, 'Customer handle is required'),
    language: z.string().optional().default('en'),
});
const EmailVerificationStatusSchema = z.object({
    domain: z.string().optional(),
    handle: z.string().optional(),
    email: z.string().optional(),
    status: z.string().optional(),
    is_suspended: z.boolean().optional(),
    limit: z.number().min(1).max(1000).optional().default(100),
    offset: z.number().min(0).optional().default(0),
});
const CustomerUpdateRequestSchema = z.object({
    handle: z.string().min(1, 'Handle is required'),
    name: z.object({
        first_name: z.string().min(1, 'First name is required').optional(),
        last_name: z.string().min(1, 'Last name is required').optional(),
    }).optional(),
    address: z.object({
        street: z.string().min(1, 'Street is required').optional(),
        number: z.string().min(1, 'Number is required').optional(),
        zipcode: z.string().min(1, 'Zipcode is required').optional(),
        city: z.string().min(1, 'City is required').optional(),
        country: z.string().min(1, 'Country is required').optional(),
        state: z.string().optional(),
    }).optional(),
    phone: z.object({
        country_code: z.string().min(1, 'Country code is required').optional(),
        area_code: z.string().min(1, 'Area code is required').optional(),
        subscriber_number: z.string().min(1, 'Subscriber number is required').optional(),
    }).optional(),
    email: z.string().email('Valid email is required').optional(),
    company_name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    additional_data: z.record(z.string(), z.any()).optional(),
});
export const openProviderCustomersRouter = router({
    /**
     * Create a new customer handle
     */
    create: publicProcedure
        .input(CustomerRequestSchema)
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
            const customerRequest = {
                name: input.name,
                address: input.address,
                phone: input.phone,
                email: input.email,
                company_name: input.company_name,
                tags: input.tags,
                additional_data: input.additional_data,
            };
            const response = await client.createCustomer(customerRequest);
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
                    customer_email: input.email,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider customer creation error:', error);
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
     * Search existing customer handles
     */
    search: publicProcedure
        .input(CustomerSearchRequestSchema)
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
                handle_pattern: input.handle_pattern,
                email_pattern: input.email_pattern,
                first_name_pattern: input.first_name_pattern,
                last_name_pattern: input.last_name_pattern,
                company_name_pattern: input.company_name_pattern,
                comment_pattern: input.comment_pattern,
                with_additional_data: input.with_additional_data,
                limit: input.limit,
                offset: input.offset,
            };
            const response = await client.searchCustomers(searchRequest);
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
            console.error('OpenProvider customer search error:', error);
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
     * Update an existing customer handle
     */
    update: publicProcedure
        .input(CustomerUpdateRequestSchema)
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
            const updateData = {};
            if (input.name)
                updateData.name = input.name;
            if (input.address)
                updateData.address = input.address;
            if (input.phone)
                updateData.phone = input.phone;
            if (input.email)
                updateData.email = input.email;
            if (input.company_name !== undefined)
                updateData.company_name = input.company_name;
            if (input.tags)
                updateData.tags = input.tags;
            if (input.additional_data)
                updateData.additional_data = input.additional_data;
            const response = await client.updateCustomer(input.handle, updateData);
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
                    customer_handle: input.handle,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider customer update error:', error);
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
     * Get customer by handle
     */
    getByHandle: publicProcedure
        .input(z.object({
        handle: z.string().min(1, 'Handle is required'),
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
            // Search for the specific handle
            const response = await client.searchCustomers({
                handle_pattern: input.handle,
                limit: 1,
                with_additional_data: true,
            });
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc,
                });
            }
            const customer = response.data.results.find((c) => c.handle === input.handle);
            if (!customer) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Customer with handle ${input.handle} not found`,
                });
            }
            return {
                success: true,
                data: customer,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    customer_handle: input.handle,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider customer retrieval error:', error);
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
     * Search customers by email
     */
    searchByEmail: publicProcedure
        .input(z.object({
        email: z.string().email('Valid email is required'),
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
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
            const response = await client.searchCustomers({
                email_pattern: input.email,
                limit: input.limit,
                offset: input.offset,
                with_additional_data: true,
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
                    searched_at: new Date().toISOString(),
                    search_email: input.email,
                    total: response.data.total,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider customer email search error:', error);
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
     * Search customers by company name
     */
    searchByCompany: publicProcedure
        .input(z.object({
        company_name: z.string().min(1, 'Company name is required'),
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
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
            const response = await client.searchCustomers({
                company_name_pattern: input.company_name,
                limit: input.limit,
                offset: input.offset,
                with_additional_data: true,
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
                    searched_at: new Date().toISOString(),
                    search_company: input.company_name,
                    total: response.data.total,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider customer company search error:', error);
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
     * Get all customers with pagination
     */
    getAll: publicProcedure
        .input(z.object({
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
        with_additional_data: z.boolean().optional().default(false),
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
            const response = await client.searchCustomers({
                limit: input.limit,
                offset: input.offset,
                with_additional_data: input.with_additional_data,
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
            console.error('OpenProvider customer list error:', error);
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
     * Start email verification for gTLD
     */
    startEmailVerification: publicProcedure
        .input(EmailVerificationStartSchema)
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
            const response = await client.startEmailVerification({
                email: input.email,
                handle: input.handle,
                language: input.language,
            });
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc || 'Failed to start email verification',
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    started_at: new Date().toISOString(),
                    email: input.email,
                    handle: input.handle,
                    language: input.language,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider email verification start error:', error);
            if (error instanceof z.ZodError) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid request data',
                    cause: error.issues.map((err) => ({
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
     * Check email verification status
     */
    checkEmailVerificationStatus: publicProcedure
        .input(EmailVerificationStatusSchema)
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
            const response = await client.checkEmailVerificationStatus({
                domain: input.domain,
                handle: input.handle,
                email: input.email,
                status: input.status,
                is_suspended: input.is_suspended,
                limit: input.limit,
                offset: input.offset,
            });
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc || 'Failed to check email verification status',
                });
            }
            return {
                success: true,
                data: response.data,
                meta: {
                    checked_at: new Date().toISOString(),
                    total: response.data?.results?.length || 0,
                    limit: input.limit,
                    offset: input.offset,
                },
            };
        }
        catch (error) {
            console.error('OpenProvider email verification status check error:', error);
            if (error instanceof z.ZodError) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid request data',
                    cause: error.issues.map((err) => ({
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
