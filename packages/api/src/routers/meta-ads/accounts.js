import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { metaAdsAccount } from "@npanel/db/schema/meta-ads";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';
/**
 * Get user's Meta integration with valid tokens
 */
async function getUserIntegration() {
    const tokenData = await getStoredMetaAccessToken();
    if (!tokenData) {
        // Check if there's an expired integration that needs reconnection
        const expiredIntegration = await db.query.socialMediaIntegration.findFirst({
            where: and(eq(socialMediaIntegration.platform, 'META_FACEBOOK'), eq(socialMediaIntegration.status, 'EXPIRED')),
            orderBy: [desc(socialMediaIntegration.createdAt)],
        });
        if (expiredIntegration) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Your Facebook session has been invalidated. Please reconnect your account.',
                cause: {
                    requiresReconnect: true,
                },
            });
        }
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active Meta integration found. Please connect your account first.',
        });
    }
    return tokenData;
}
/**
 * Map Meta account status code to our enum
 */
function mapAccountStatus(statusCode) {
    // Meta account status codes:
    // 1 = ACTIVE
    // 2 = DISABLED
    // 3 = UNSETTLED
    // 7 = PENDING_REVIEW
    // 9 = IN_GRACE_PERIOD
    // 100 = PENDING_CLOSURE
    // 101 = CLOSED
    switch (statusCode) {
        case 1:
            return 'ACTIVE';
        case 2:
            return 'DISABLED';
        case 3:
            return 'UNSETTLED';
        case 7:
            return 'PENDING_REVIEW';
        case 9:
            return 'IN_GRACE_PERIOD';
        case 100:
            return 'PENDING_CLOSURE';
        case 101:
            return 'CLOSED';
        default:
            return 'ACTIVE';
    }
}
export const metaAdsAccountsRouter = router({
    /**
     * List all accessible Meta ad accounts
     * Uses Meta Marketing API to fetch accessible ad accounts
     */
    listAdAccounts: protectedProcedure
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
            const { accessToken, integrationId } = await getUserIntegration();
            // 1. Check local database first
            const existingDbAccounts = await db.query.metaAdsAccount.findMany({
                where: eq(metaAdsAccount.integrationId, integrationId),
            });
            // Freshness threshold: 30 minutes
            const FRESHNESS_THRESHOLD = 30 * 60 * 1000;
            const isDataFresh = existingDbAccounts.length > 0 && existingDbAccounts.some(acc => (new Date().getTime() - new Date(acc.updatedAt).getTime()) < FRESHNESS_THRESHOLD);
            // Return from DB if not forcing refresh and data is fresh enough
            if (existingDbAccounts.length > 0 && !input?.forceRefresh && isDataFresh) {
                return {
                    success: true,
                    data: existingDbAccounts.map(acc => ({
                        id: acc.id,
                        accountId: acc.accountId,
                        accountName: acc.accountName,
                        currency: acc.currency,
                        timezone: acc.timezone,
                        status: acc.status,
                        spendLimit: acc.spendLimit,
                        amountSpent: acc.amountSpent,
                        balance: acc.balance,
                        updatedAt: acc.updatedAt,
                    })),
                    meta: {
                        retrieved_at: existingDbAccounts[0].updatedAt.toISOString(),
                        total_accounts: existingDbAccounts.length,
                        source: 'database',
                    },
                };
            }
            // 2. Fetch from Meta API if needed
            const client = new MetaAdsClient({ accessToken });
            const response = await client.getAdAccounts();
            const now = new Date();
            const accountResults = [];
            // Normalize Map keys to ensure prefix consistency for lookup
            const dbAccountMap = new Map();
            existingDbAccounts.forEach((acc) => {
                let normalizedId = acc.accountId;
                if (!normalizedId.startsWith('act_')) {
                    normalizedId = `act_${normalizedId}`;
                }
                dbAccountMap.set(normalizedId, acc);
            });
            const newAccounts = [];
            const accountsToUpdate = [];
            for (const account of response.data) {
                let accountId = account.account_id;
                if (!accountId.startsWith('act_')) {
                    accountId = `act_${accountId}`;
                }
                const accountStatus = mapAccountStatus(account.account_status);
                const existingAccount = dbAccountMap.get(accountId);
                if (existingAccount) {
                    // Only update if something changed (simple check)
                    const hasChanged = existingAccount.accountName !== account.name ||
                        existingAccount.status !== accountStatus ||
                        existingAccount.amountSpent !== account.amount_spent ||
                        existingAccount.balance !== account.balance;
                    if (hasChanged || !existingAccount.accountId.startsWith('act_')) {
                        accountsToUpdate.push(db
                            .update(metaAdsAccount)
                            .set({
                            accountId: accountId,
                            accountName: account.name || existingAccount.accountName,
                            currency: account.currency || existingAccount.currency,
                            timezone: account.timezone_name || existingAccount.timezone,
                            status: accountStatus,
                            spendLimit: account.spend_cap || existingAccount.spendLimit,
                            amountSpent: account.amount_spent || existingAccount.amountSpent,
                            balance: account.balance || existingAccount.balance,
                            updatedAt: now,
                        })
                            .where(eq(metaAdsAccount.id, existingAccount.id)));
                    }
                    accountResults.push({
                        id: existingAccount.id,
                        accountId: accountId,
                        accountName: account.name || existingAccount.accountName,
                        currency: account.currency || existingAccount.currency,
                        timezone: account.timezone_name || existingAccount.timezone,
                        status: accountStatus,
                        spendLimit: account.spend_cap || existingAccount.spendLimit,
                        amountSpent: account.amount_spent || existingAccount.amountSpent,
                        balance: account.balance || existingAccount.balance,
                        updatedAt: now.toISOString(),
                    });
                }
                else {
                    // New account discovered - stable ID based on integration and account
                    const id = `meta_ads_account_${integrationId}_${accountId}`;
                    newAccounts.push({
                        id,
                        integrationId,
                        accountId,
                        accountName: account.name || null,
                        currency: account.currency || null,
                        timezone: account.timezone_name || null,
                        status: accountStatus,
                        spendLimit: account.spend_cap || null,
                        amountSpent: account.amount_spent || null,
                        balance: account.balance || null,
                        createdAt: now,
                        updatedAt: now,
                    });
                    accountResults.push({
                        id,
                        accountId,
                        accountName: account.name || null,
                        currency: account.currency || null,
                        timezone: account.timezone_name || null,
                        status: accountStatus,
                        spendLimit: account.spend_cap || null,
                        amountSpent: account.amount_spent || null,
                        balance: account.balance || null,
                        updatedAt: now.toISOString(),
                    });
                }
            }
            // Perform DB operations in parallel
            await Promise.all([
                accountsToUpdate.length > 0 ? Promise.all(accountsToUpdate) : Promise.resolve(),
                newAccounts.length > 0
                    ? db.insert(metaAdsAccount).values(newAccounts)
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
            console.error('Meta Ads API list ad accounts error:', error);
            // Handle OAuth token errors - delete credentials and require re-authentication
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError) {
                throw oauthError;
            }
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list ad accounts',
            });
        }
    }),
    /**
     * Get ad account details
     */
    getAccountDetails: protectedProcedure
        .input(z.object({
        accountId: z.string().min(1, 'Account ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const { accessToken } = await getUserIntegration();
            // Create Meta Ads client
            const client = new MetaAdsClient({ accessToken });
            // Normalize account ID to ensure it has 'act_' prefix
            let normalizedAccountId = input.accountId;
            if (!normalizedAccountId.startsWith('act_')) {
                normalizedAccountId = `act_${normalizedAccountId}`;
            }
            // Get account details directly from Meta API
            const accountDetails = await client.getAdAccountDetails(normalizedAccountId);
            // Return account details mapped for frontend consistency
            return {
                success: true,
                data: {
                    ...accountDetails,
                    status: mapAccountStatus(accountDetails.account_status),
                },
            };
        }
        catch (error) {
            console.error('Meta Ads API get account details error:', error);
            // Handle OAuth token errors - delete credentials and require re-authentication
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError) {
                throw oauthError;
            }
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get account details',
            });
        }
    }),
});
