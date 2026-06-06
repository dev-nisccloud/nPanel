import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, inArray, or, sql } from '@npanel/db';
import { db } from '@npanel/db';
import { niscClientSubscription, niscProduct } from '@npanel/db/schema/products';
import { NISC_MEDIA_BUYING_PRODUCT_ID } from '../../lib/media-buying-billing';
import { team, teamMember } from '@npanel/db/schema/teams';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessToken, getStoredLinkedInAccessTokenForSession } from '../../lib/linkedin-credentials';
/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration(userId, role) {
    const tokenData = (await getStoredLinkedInAccessTokenForSession({ userId, role })) ??
        (await getStoredLinkedInAccessToken());
    if (!tokenData) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active LinkedIn integration found. Please connect your account first.',
        });
    }
    return tokenData;
}
function normalizeStatusLabel(status) {
    if (!status)
        return null;
    return status;
}
function normalizeStatusArray(statuses) {
    if (!Array.isArray(statuses))
        return [];
    return statuses
        .map((status) => (typeof status === 'string' ? status : null))
        .filter((status) => Boolean(status));
}
const isAgencyUserRole = (role) => ['AGENCY_USER', 'AGENCY_ADMIN', 'AGENCY_SUPER_ADMIN'].includes(role ?? '');
async function getAccessibleTeamIds(userId) {
    const [memberships, ownedTeams] = await Promise.all([
        db.query.teamMember.findMany({
            where: eq(teamMember.userId, userId),
            columns: { teamId: true },
        }),
        db.query.team.findMany({
            where: eq(team.createdById, userId),
            columns: { id: true },
        }),
    ]);
    return [...new Set([...memberships.map((m) => m.teamId), ...ownedTeams.map((t) => t.id)])];
}
function normalizeLinkedInAccountUrn(value) {
    if (value.startsWith('urn:li:sponsoredAccount:'))
        return value;
    const numeric = value.replace(/[^0-9]/g, '');
    return numeric.length > 0 ? `urn:li:sponsoredAccount:${numeric}` : value;
}
async function hasLinkedInSubscriptionAccess(teamIds, accountId) {
    if (teamIds.length === 0)
        return false;
    const urn = normalizeLinkedInAccountUrn(accountId);
    const numeric = accountId.replace(/[^0-9]/g, '');
    const [linked] = await db
        .select({ id: niscClientSubscription.id })
        .from(niscClientSubscription)
        .innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
        .where(and(inArray(niscClientSubscription.teamId, teamIds), or(eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID), ilike(niscProduct.name, "%media buying%")), sql `(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${"LINKEDIN_ADS"}`, sql `((${niscClientSubscription.serviceRefs}->>'adAccountId') = ${accountId} OR (${niscClientSubscription.serviceRefs}->>'adAccountId') = ${urn} OR (${niscClientSubscription.serviceRefs}->>'adAccountId') = ${numeric})`))
        .limit(1);
    return !!linked;
}
async function getLinkedInLinkedAccountsFromSubscriptions(teamIds) {
    if (teamIds.length === 0)
        return [];
    const rows = await db
        .select({
        serviceRefs: niscClientSubscription.serviceRefs,
        name: niscClientSubscription.name,
    })
        .from(niscClientSubscription)
        .innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
        .where(and(inArray(niscClientSubscription.teamId, teamIds), or(eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID), ilike(niscProduct.name, "%media buying%")), sql `(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${"LINKEDIN_ADS"}`));
    const byId = new Map();
    for (const row of rows) {
        const refs = row.serviceRefs;
        const accountIdRaw = typeof refs?.adAccountId === 'string' ? refs.adAccountId.trim() : '';
        if (!accountIdRaw)
            continue;
        const accountId = normalizeLinkedInAccountUrn(accountIdRaw);
        const accountNameRaw = typeof refs?.adAccountName === 'string' ? refs.adAccountName.trim() : '';
        const accountName = accountNameRaw || row.name || null;
        if (!byId.has(accountId)) {
            byId.set(accountId, { id: accountId, name: accountName });
        }
    }
    return [...byId.values()].map((acc) => ({
        id: acc.id,
        name: acc.name,
        currency: null,
        timezone: null,
        status: null,
        servingStatuses: [],
        reference: null,
        type: null,
    }));
}
export const linkedInAdsAccountsRouter = router({
    /**
     * List all accessible LinkedIn ad accounts
     * Uses LinkedIn Marketing API to fetch accessible ad accounts
     */
    listAdAccounts: protectedProcedure.query(async ({ ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            const role = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            if (!isAgencyUserRole(role)) {
                const teamIds = await getAccessibleTeamIds(userId);
                const linkedAccounts = await getLinkedInLinkedAccountsFromSubscriptions(teamIds);
                return {
                    success: true,
                    data: linkedAccounts,
                    meta: {
                        retrieved_at: new Date().toISOString(),
                        total_accounts: linkedAccounts.length,
                        source: 'team_scoped_subscription_link',
                    },
                };
            }
            const { accessToken, integrationId } = await getUserIntegration(userId, ctx.session?.user?.role);
            const debugEnabled = process.env.LINKEDIN_ADS_DEBUG === 'true';
            if (debugEnabled) {
                console.log('[LinkedInAds Accounts Debug] integration-loaded', {
                    userId,
                    integrationId,
                });
            }
            // Create LinkedIn Ads client
            const client = new LinkedInAdsClient({ accessToken });
            // Get accessible ad accounts
            const response = await client.getAdAccounts();
            if (debugEnabled) {
                console.log('[LinkedInAds Accounts Debug] raw-response', {
                    userId,
                    integrationId,
                    elementsCount: Array.isArray(response?.elements) ? response.elements.length : 0,
                    hasPaging: !!response?.paging,
                    responseKeys: Object.keys(response || {}),
                });
            }
            // Format accounts for response
            const accountResults = (response.elements || []).map((account) => ({
                id: String(account.id),
                name: account.name || null,
                currency: account.currency || null,
                timezone: account.timezone || null,
                status: normalizeStatusLabel(account.status || account.accountStatus || null),
                servingStatuses: normalizeStatusArray(account.servingStatuses),
                reference: account.reference || null,
                type: account.type || null,
            }));
            return {
                success: true,
                data: accountResults,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    total_accounts: accountResults.length,
                    paging: response.paging,
                },
            };
        }
        catch (error) {
            if (process.env.LINKEDIN_ADS_DEBUG === 'true') {
                console.log('[LinkedInAds Accounts Debug] listAdAccounts-error', {
                    status: error?.status,
                    message: error?.message,
                    serviceErrorCode: error?.serviceErrorCode,
                    errorType: error?.errorType,
                    userMessage: error?.userMessage,
                });
            }
            // Handle 404 - user might not have any ad accounts or endpoint doesn't exist
            if (error?.status === 404 || error?.message?.includes('No virtual resource found')) {
                // Return empty array if no accounts found (user might not have access)
                return {
                    success: true,
                    data: [],
                    meta: {
                        retrieved_at: new Date().toISOString(),
                        total_accounts: 0,
                    },
                };
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
            const role = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            if (!isAgencyUserRole(role)) {
                const teamIds = await getAccessibleTeamIds(userId);
                if (teamIds.length === 0) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have access to this LinkedIn ad account',
                    });
                }
                const hasSubscriptionAccess = await hasLinkedInSubscriptionAccess(teamIds, input.accountId);
                if (!hasSubscriptionAccess) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have access to this LinkedIn ad account',
                    });
                }
            }
            const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);
            // Create LinkedIn Ads client
            const client = new LinkedInAdsClient({ accessToken });
            // Get account details directly from LinkedIn API
            const accountDetails = await client.getAdAccountDetails(input.accountId);
            // Return account details
            return {
                success: true,
                data: {
                    id: String(accountDetails.id),
                    name: accountDetails.name || null,
                    currency: accountDetails.currency || null,
                    timezone: accountDetails.timezone || null,
                    status: normalizeStatusLabel(accountDetails.status || accountDetails.accountStatus || null),
                    servingStatuses: normalizeStatusArray(accountDetails.servingStatuses),
                    reference: accountDetails.reference || null,
                    type: accountDetails.type || null,
                },
            };
        }
        catch (error) {
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
