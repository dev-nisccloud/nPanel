import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
// Validation schemas
const GetResellerRequestSchema = z.object({
    with_statistics: z.boolean().optional().default(false),
    with_settings: z.boolean().optional().default(false),
    with_contacts: z.boolean().optional().default(false),
});
export const openProviderResellerRouter = router({
    /**
     * Get reseller information including balance
     */
    getInfo: protectedProcedure
        .input(GetResellerRequestSchema)
        .query(async ({ input }) => {
        try {
            const client = createOpenProviderClient();
            // Authenticate using environment credentials
            await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME,
                password: process.env.OPENPROVIDER_PASSWORD,
                ip: process.env.OPENPROVIDER_IP,
            });
            // Get reseller information
            const response = await client.getResellerInfo(input);
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc || 'Failed to get reseller information',
                });
            }
            return {
                success: true,
                data: response.data,
            };
        }
        catch (error) {
            console.error('OpenProvider reseller info error:', error);
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
                message: 'Failed to retrieve reseller information',
            });
        }
    }),
    /**
     * Get reseller balance only (lightweight)
     */
    getBalance: protectedProcedure
        .query(async () => {
        try {
            const client = createOpenProviderClient();
            // Authenticate using environment credentials
            await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME,
                password: process.env.OPENPROVIDER_PASSWORD,
                ip: process.env.OPENPROVIDER_IP,
            });
            // Get reseller information
            const response = await client.getResellerInfo();
            if (response.code !== 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: response.desc || 'Failed to get reseller balance',
                });
            }
            // According to OpenProvider API docs: balance is the available balance
            const balance = response.data?.balance || 0;
            return {
                success: true,
                balance: balance,
                currency: 'USD', // OpenProvider uses USD
            };
        }
        catch (error) {
            console.error('OpenProvider reseller balance error:', error);
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
                message: 'Failed to retrieve reseller balance',
            });
        }
    }),
});
