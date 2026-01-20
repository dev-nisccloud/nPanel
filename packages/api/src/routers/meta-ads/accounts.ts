import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import prisma from '@nPanel/db';
import { randomUUID } from 'node:crypto';
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
		const expiredIntegration = await prisma.socialMediaIntegration.findFirst({
			where: {
				platform: 'META_FACEBOOK' as const,
				status: 'EXPIRED' as const,
			},
			orderBy: {
				createdAt: 'desc',
			},
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
function mapAccountStatus(statusCode?: number): 'ACTIVE' | 'DISABLED' | 'UNSETTLED' | 'PENDING_REVIEW' | 'IN_GRACE_PERIOD' | 'PENDING_CLOSURE' | 'CLOSED' {
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
	listAdAccounts: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User session not found',
				});
			}

			const { accessToken, integrationId } = await getUserIntegration();

			// Create Meta Ads client
			const client = new MetaAdsClient({ accessToken });

			// Get accessible ad accounts
			const response = await client.getAdAccounts();

			// Store/update accounts in database
			const now = new Date();
			const accountResults = [];

			for (const account of response.data) {
				// Meta API returns account_id which may or may not have 'act_' prefix
				// Normalize it to always include the prefix for consistency
				let accountId = account.account_id;
				if (!accountId.startsWith('act_')) {
					accountId = `act_${accountId}`;
				}
				const accountStatus = mapAccountStatus(account.account_status);

				const existingAccount = await prisma.metaAdsAccount.findFirst({
					where: {
						integrationId,
						accountId,
					},
				});

				if (existingAccount) {
					// Update existing account
					await prisma.metaAdsAccount.update({
						where: { id: existingAccount.id },
						data: {
							accountName: account.name || existingAccount.accountName,
							currency: account.currency || existingAccount.currency,
							timezone: account.timezone_name || existingAccount.timezone,
							status: accountStatus,
							spendLimit: account.spend_cap || existingAccount.spendLimit,
							amountSpent: account.amount_spent || existingAccount.amountSpent,
							balance: account.balance || existingAccount.balance,
							updatedAt: now,
						},
					});
					accountResults.push({
						id: existingAccount.id,
						accountId: existingAccount.accountId,
						accountName: account.name || existingAccount.accountName,
						currency: account.currency || existingAccount.currency,
						timezone: account.timezone_name || existingAccount.timezone,
						status: accountStatus,
						spendLimit: account.spend_cap || existingAccount.spendLimit,
						amountSpent: account.amount_spent || existingAccount.amountSpent,
						balance: account.balance || existingAccount.balance,
					});
				} else {
					// Create new account
					const newAccount = await prisma.metaAdsAccount.create({
						data: {
							id: `meta_ads_account_${integrationId}_${accountId}_${Date.now()}`,
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
						},
					});

					// Log activity
					await prisma.metaAdsAccountActivityLog.create({
						data: {
							id: randomUUID(),
							accountId: newAccount.id,
							userId,
							action: 'CREATE',
							description: `Meta ad account ${accountId} discovered and added`,
							metadata: {
								accountId,
								accountName: account.name,
								currency: account.currency,
							},
							createdAt: now,
						},
					});

					accountResults.push({
						id: newAccount.id,
						accountId: newAccount.accountId,
						accountName: newAccount.accountName,
						currency: newAccount.currency,
						timezone: newAccount.timezone,
						status: newAccount.status,
						spendLimit: newAccount.spendLimit,
						amountSpent: newAccount.amountSpent,
						balance: newAccount.balance,
					});
				}
			}

			return {
				success: true,
				data: accountResults,
				meta: {
					retrieved_at: new Date().toISOString(),
					total_accounts: accountResults.length,
				},
			};
		} catch (error) {
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
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
			})
		)
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

				// Return account details exactly as returned from Meta API
				return {
					success: true,
					data: {
						// Include all fields from Meta API response exactly as returned
						...accountDetails,
					},
				};
			} catch (error) {
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


