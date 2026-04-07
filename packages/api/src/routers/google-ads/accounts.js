import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from '@npanel/db';
import { router, protectedProcedure } from '../../trpc';
import { db } from '@npanel/db';
import { googleAdsAccount, googleAdsAccountActivityLog, } from '@npanel/db/schema/google-ads';
import { createGoogleAdsClient, getAccessibleCustomers, getCustomerInstance, } from '../../lib/google-ads-client';
import { getGoogleAdsClientId, getGoogleAdsClientSecret, getGoogleAdsDeveloperToken, } from '../../lib/google-ads-credentials';
import { GoogleAdsErrorHandler } from '../../lib/google-ads-error-handler';
import { getUserGoogleAdsIntegration } from '../../lib/google-ads-user-integration';
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
const GetAccountDetailsRequestSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
});
export const googleAdsAccountsRouter = router({
    /**
     * List all accessible Google Ads accounts (customers)
     * Uses Google Ads API to fetch accessible customer accounts
     */
    listAccessibleAccounts: protectedProcedure
        .input(z.object({ forceRefresh: z.boolean().optional() }).optional())
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const integration = await getUserGoogleAdsIntegration(userId);
            // 1. Read-first: Try to get from database first
            const existingDbAccounts = await db
                .select()
                .from(googleAdsAccount)
                .where(eq(googleAdsAccount.integrationId, integration.id))
                .orderBy(desc(googleAdsAccount.updatedAt));
            // Freshness threshold: 30 minutes
            const FRESHNESS_THRESHOLD = 30 * 60 * 1000;
            const now = new Date();
            const newest = existingDbAccounts[0];
            const isDataFresh = existingDbAccounts.length > 0 &&
                newest != null &&
                (now.getTime() - new Date(newest.updatedAt).getTime()) < FRESHNESS_THRESHOLD;
            // If not forcing refresh and data is fresh, return from DB immediately
            if (existingDbAccounts.length > 0 && !input?.forceRefresh && isDataFresh && newest) {
                return {
                    success: true,
                    data: existingDbAccounts.map(acc => ({
                        customerId: acc.customerId,
                        accountName: acc.accountName,
                        currencyCode: acc.currencyCode,
                        timeZone: acc.timeZone,
                        status: acc.status,
                        resourceName: `customers/${acc.customerId}`,
                    })),
                    meta: {
                        retrieved_at: newest.updatedAt.toISOString(),
                        total_accounts: existingDbAccounts.length,
                        source: 'database',
                    },
                };
            }
            // 2. Fetch from Google Ads API if needed
            const client = createGoogleAdsClient({
                developerToken: getGoogleAdsDeveloperToken(),
                clientId: getGoogleAdsClientId(),
                clientSecret: getGoogleAdsClientSecret(),
                refreshToken: integration.refreshToken,
            });
            // Get accessible customers using the library's method
            const accessibleCustomers = await getAccessibleCustomers(client, integration.refreshToken);
            const accountResults = [];
            const dbAccountMap = new Map(existingDbAccounts.map(acc => [acc.customerId, acc]));
            const newAccounts = [];
            const accountsToUpdate = [];
            for (const customer of accessibleCustomers) {
                const customerIdWithoutDashes = customer.customerId.replace(/-/g, '');
                // Standardize customer ID for comparison
                const existingAccount = dbAccountMap.get(customerIdWithoutDashes);
                // Fetch account details from Google Ads API
                let accountName = null;
                let currencyCode = null;
                let timeZone = null;
                let accountStatus = 'ACTIVE';
                try {
                    const customerInstance = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
                    const query = `
						SELECT
							customer.id,
							customer.descriptive_name,
							customer.currency_code,
							customer.time_zone,
							customer.status
						FROM customer
						WHERE customer.id = ${customerIdWithoutDashes}
					`;
                    const results = await customerInstance.query(query);
                    if (results && results.length > 0) {
                        const customerData = results[0].customer;
                        if (customerData) {
                            accountName = customerData.descriptive_name || null;
                            currencyCode = customerData.currency_code || null;
                            timeZone = customerData.time_zone || null;
                            const status = customerData.status || 'ACTIVE';
                            if (status === 'SUSPENDED') {
                                accountStatus = 'PAUSED';
                            }
                            else if (status === 'CANCELED') {
                                accountStatus = 'REMOVED';
                            }
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to fetch details for customer ${customer.customerId}:`, error);
                }
                if (existingAccount) {
                    // Check if update is needed
                    const hasChanged = existingAccount.accountName !== accountName ||
                        existingAccount.currencyCode !== currencyCode ||
                        existingAccount.timeZone !== timeZone ||
                        existingAccount.status !== accountStatus;
                    if (hasChanged || input?.forceRefresh) {
                        accountsToUpdate.push(db
                            .update(googleAdsAccount)
                            .set({
                            accountName: accountName ?? existingAccount.accountName,
                            currencyCode: currencyCode ?? existingAccount.currencyCode,
                            timeZone: timeZone ?? existingAccount.timeZone,
                            status: accountStatus,
                            updatedAt: now,
                        })
                            .where(eq(googleAdsAccount.id, existingAccount.id)));
                    }
                    accountResults.push({
                        customerId: customer.customerId,
                        resourceName: customer.resourceName,
                        accountName: accountName || existingAccount.accountName,
                        currencyCode: currencyCode || existingAccount.currencyCode,
                        timeZone: timeZone || existingAccount.timeZone,
                        status: accountStatus,
                    });
                }
                else {
                    // Create new account entry
                    const id = `google_ads_account_${integration.id}_${customerIdWithoutDashes}`;
                    newAccounts.push({
                        id,
                        integrationId: integration.id,
                        customerId: customerIdWithoutDashes,
                        accountName,
                        currencyCode,
                        timeZone,
                        status: accountStatus,
                        teamId: null,
                        createdAt: now,
                        updatedAt: now,
                    });
                    accountResults.push({
                        customerId: customer.customerId,
                        resourceName: customer.resourceName,
                        accountName,
                        currencyCode,
                        timeZone,
                        status: accountStatus,
                    });
                }
            }
            // Perform DB operations in parallel
            await Promise.all([
                ...accountsToUpdate,
                newAccounts.length > 0
                    ? db.insert(googleAdsAccount).values(newAccounts)
                    : Promise.resolve(),
            ]);
            return {
                success: true,
                data: accountResults,
                meta: {
                    retrieved_at: now.toISOString(),
                    total_accounts: accountResults.length,
                    source: 'api',
                },
            };
        }
        catch (error) {
            console.error('Google Ads API list accessible accounts error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission' ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message,
            });
        }
    }),
    /**
     * Get account details for a specific Google Ads customer
     * Fetches account metadata from API and stores/updates in database
     */
    getAccountDetails: protectedProcedure
        .input(GetAccountDetailsRequestSchema)
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const integration = await getUserGoogleAdsIntegration(userId);
            // Remove dashes from customer ID for API call
            const customerIdWithoutDashes = input.customerId.replace(/-/g, '');
            // Create Google Ads client
            const client = createGoogleAdsClient({
                developerToken: getGoogleAdsDeveloperToken(),
                clientId: getGoogleAdsClientId(),
                clientSecret: getGoogleAdsClientSecret(),
                refreshToken: integration.refreshToken,
            });
            // Get customer instance
            const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
            // Query account details
            const query = `
					SELECT
						customer.id,
						customer.descriptive_name,
						customer.currency_code,
						customer.time_zone,
						customer.status
					FROM customer
					WHERE customer.id = ${customerIdWithoutDashes}
				`;
            const results = await customer.query(query);
            if (!results || results.length === 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Google Ads account ${input.customerId} not found or not accessible`,
                });
            }
            const accountData = results[0];
            if (!accountData.customer) {
                throw new Error('Customer data not found in account response');
            }
            const accountName = accountData.customer.descriptive_name || null;
            const currencyCode = accountData.customer.currency_code || null;
            const timeZone = accountData.customer.time_zone || null;
            const status = accountData.customer.status || 'ACTIVE';
            // Map Google Ads status to our enum
            let accountStatus = 'ACTIVE';
            // Note: Google Ads API doesn't use 'PAUSED' or 'REMOVED' status values
            // These checks are kept for backward compatibility but won't match
            if (status === 'SUSPENDED') {
                accountStatus = 'PAUSED';
            }
            else if (status === 'CANCELED') {
                accountStatus = 'REMOVED';
            }
            // Store/update account in database
            const [existingAccount] = await db
                .select()
                .from(googleAdsAccount)
                .where(and(eq(googleAdsAccount.integrationId, integration.id), eq(googleAdsAccount.customerId, customerIdWithoutDashes)))
                .limit(1);
            const now = new Date();
            let accountId;
            if (existingAccount) {
                await db
                    .update(googleAdsAccount)
                    .set({
                    accountName,
                    currencyCode,
                    timeZone,
                    status: accountStatus,
                    updatedAt: now,
                })
                    .where(eq(googleAdsAccount.id, existingAccount.id));
                accountId = existingAccount.id;
            }
            else {
                accountId = `google_ads_account_${integration.id}_${customerIdWithoutDashes}_${Date.now()}`;
                await db.insert(googleAdsAccount).values({
                    id: accountId,
                    integrationId: integration.id,
                    customerId: customerIdWithoutDashes,
                    accountName,
                    currencyCode,
                    timeZone,
                    status: accountStatus,
                    teamId: null,
                    createdAt: now,
                    updatedAt: now,
                });
                // Log activity
                await db.insert(googleAdsAccountActivityLog).values({
                    id: randomUUID(),
                    accountId,
                    userId,
                    action: 'CREATE',
                    description: `Google Ads account ${input.customerId} details fetched and stored`,
                    metadata: {
                        customerId: input.customerId,
                        accountName,
                        currencyCode,
                        timeZone,
                        status: accountStatus,
                    },
                    ipAddress: null,
                    userAgent: null,
                    createdAt: now,
                });
            }
            return {
                success: true,
                data: {
                    customerId: input.customerId,
                    accountName,
                    currencyCode,
                    timeZone,
                    status: accountStatus,
                },
                meta: {
                    retrieved_at: new Date().toISOString(),
                    account_id: accountId,
                },
            };
        }
        catch (error) {
            console.error('Google Ads API get account details error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission' ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message,
            });
        }
    }),
});
