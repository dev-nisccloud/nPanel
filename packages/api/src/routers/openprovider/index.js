import { router, protectedProcedure, publicProcedure } from '../../trpc';
import { openProviderAuthRouter } from './auth';
import { openProviderTldRouter } from './tlds';
import { openProviderDomainsRouter } from './domains';
import { openProviderCustomersRouter } from './customers';
import { openProviderDnsRouter } from './dns';
export const openProviderRouter = router({
    /**
     * Authentication endpoints
     */
    auth: openProviderAuthRouter,
    /**
     * TLD (Top Level Domain) endpoints
     */
    tlds: openProviderTldRouter,
    /**
     * Domain management endpoints
     */
    domains: openProviderDomainsRouter,
    /**
     * Customer/Handle management endpoints
     */
    customers: openProviderCustomersRouter,
    /**
     * DNS zone management endpoints
     */
    dns: openProviderDnsRouter,
    /**
     * Health check for OpenProvider integration
     */
    healthCheck: publicProcedure
        .query(async () => {
        try {
            // Try to authenticate to check if the service is working
            const { createOpenProviderClient } = await import('../../lib/openprovider-client');
            const client = createOpenProviderClient();
            // Check if environment variables are set
            const hasCredentials = !!(process.env.OPENPROVIDER_USERNAME &&
                process.env.OPENPROVIDER_PASSWORD);
            if (!hasCredentials) {
                return {
                    status: 'error',
                    message: 'OpenProvider credentials not configured',
                    details: {
                        has_username: !!process.env.OPENPROVIDER_USERNAME,
                        has_password: !!process.env.OPENPROVIDER_PASSWORD,
                    },
                };
            }
            // Try to authenticate
            try {
                await client.authenticate({
                    username: process.env.OPENPROVIDER_USERNAME,
                    password: process.env.OPENPROVIDER_PASSWORD,
                    ip: process.env.OPENPROVIDER_IP,
                });
                return {
                    status: 'healthy',
                    message: 'OpenProvider integration is working correctly',
                    details: {
                        authenticated: true,
                        base_url: 'https://api.openprovider.eu',
                        api_version: 'v1beta',
                    },
                };
            }
            catch (authError) {
                return {
                    status: 'error',
                    message: 'OpenProvider authentication failed',
                    details: {
                        authenticated: false,
                        error: authError instanceof Error ? authError.message : 'Unknown error',
                    },
                };
            }
        }
        catch (error) {
            return {
                status: 'error',
                message: 'OpenProvider integration check failed',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }),
});
