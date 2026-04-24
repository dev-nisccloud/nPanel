import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, sql, type InferSelectModel } from "@npanel/db";
import { db } from "@npanel/db";
import { metaAdsAccount } from "@npanel/db/schema/meta-ads";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { team, teamMember } from "@npanel/db/schema/teams";
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';

type MetaAdsAccountRow = InferSelectModel<typeof metaAdsAccount>;

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

async function getAccessibleTeamIds(userId: string): Promise<string[]> {
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

/**
 * Get user's Meta integration with valid tokens
 */
async function getUserIntegration() {
	const tokenData = await getStoredMetaAccessToken();

	if (!tokenData) {
		// Check if there's an expired integration that needs reconnection
		const expiredIntegration = await db.query.socialMediaIntegration.findFirst({
			where: and(
				eq(socialMediaIntegration.platform, 'META_FACEBOOK'),
				eq(socialMediaIntegration.status, 'EXPIRED'),
			),
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
	listAdAccounts: protectedProcedure
		.input(z.object({ forceRefresh: z.boolean().optional() }).optional())
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
				const isAgency = isAgencyUserRole(role);
				const teamIds = isAgency ? [] : await getAccessibleTeamIds(userId);
				if (!isAgency && teamIds.length === 0) {
					return {
						success: true,
						data: [],
						meta: {
							retrieved_at: new Date().toISOString(),
							total_accounts: 0,
							source: 'team_scoped_cache',
						},
					};
				}

				const { accessToken, integrationId } = await getUserIntegration();

				// 1. Check local database first
				const existingDbAccounts: MetaAdsAccountRow[] =
					await db.query.metaAdsAccount.findMany({
						where: and(
							eq(metaAdsAccount.integrationId, integrationId),
							isAgency ? undefined : inArray(metaAdsAccount.teamId, teamIds),
						),
					});

				// Freshness threshold: 30 minutes
				const FRESHNESS_THRESHOLD = 30 * 60 * 1000;
				const isDataFresh = existingDbAccounts.length > 0 && existingDbAccounts.some(acc =>
					(new Date().getTime() - new Date(acc.updatedAt).getTime()) < FRESHNESS_THRESHOLD
				);

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
							instagramUserId: null, // Not stored in DB cache; refetch to get live value
							updatedAt: acc.updatedAt,
						})),
						meta: {
							retrieved_at: existingDbAccounts[0]!.updatedAt.toISOString(),
							total_accounts: existingDbAccounts.length,
							source: 'database',
						},
					};
				}

				// 2. Fetch from Meta API if needed
				const client = new MetaAdsClient({ accessToken });
				const response = await client.getAdAccounts();
				const now = new Date();

				const accountsToSync = response.data.map((account: any) => {
					let accountId = account.account_id;
					if (!accountId.startsWith('act_')) {
						accountId = `act_${accountId}`;
					}
					const accountStatus = mapAccountStatus(account.account_status);
					const id = `meta_ads_account_${integrationId}_${accountId}`;

					return {
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
						instagramUserId: account.instagram_user_id || null,
						createdAt: now,
						updatedAt: now,
					};
				});

				if (accountsToSync.length > 0) {
					// Use UPSERT logic to handle existing accounts and tie them to the latest integration
					await db.insert(metaAdsAccount)
						.values(accountsToSync)
						.onConflictDoUpdate({
							target: metaAdsAccount.accountId,
							set: {
								integrationId: sql`EXCLUDED.integration_id`,
								accountName: sql`EXCLUDED.account_name`,
								currency: sql`EXCLUDED.currency`,
								timezone: sql`EXCLUDED.timezone`,
								status: sql`EXCLUDED.status`,
								spendLimit: sql`EXCLUDED.spend_limit`,
								amountSpent: sql`EXCLUDED.amount_spent`,
								balance: sql`EXCLUDED.balance`,
								instagramUserId: sql`EXCLUDED.instagram_user_id`,
								updatedAt: now,
							},
						});
				}

				const scopedResults = isAgency
					? accountsToSync
					: accountsToSync.filter((acc) => acc.teamId && teamIds.includes(acc.teamId));

				return {
					success: true,
					data: scopedResults.map(acc => ({
						...acc,
						updatedAt: acc.updatedAt.toISOString(),
					})),
					meta: {
						retrieved_at: now.toISOString(),
						total_accounts: scopedResults.length,
						source: 'api',
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
							message: 'You do not have access to this Meta ad account',
						});
					}
					const normalizedAccountId = input.accountId.startsWith('act_')
						? input.accountId
						: `act_${input.accountId}`;
					const linkedAccount = await db.query.metaAdsAccount.findFirst({
						where: and(
							eq(metaAdsAccount.accountId, normalizedAccountId),
							inArray(metaAdsAccount.teamId, teamIds),
						),
						columns: { id: true },
					});
					if (!linkedAccount) {
						throw new TRPCError({
							code: 'FORBIDDEN',
							message: 'You do not have access to this Meta ad account',
						});
					}
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
	/**
	 * Get Instagram accounts connected/authorized for use with a specific ad account
	 * Calls GET /{act_id}/connected_instagram_accounts
	 * Requires ads_read scope on the stored token.
	 */
	getConnectedInstagramAccounts: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				const role = ctx.session?.user?.role;
				if (!userId) {
					throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });
				}
				if (!isAgencyUserRole(role)) {
					const teamIds = await getAccessibleTeamIds(userId);
					if (teamIds.length === 0) {
						throw new TRPCError({
							code: 'FORBIDDEN',
							message: 'You do not have access to this Meta ad account',
						});
					}
					const normalizedId = input.accountId.startsWith('act_')
						? input.accountId
						: `act_${input.accountId}`;
					const linkedAccount = await db.query.metaAdsAccount.findFirst({
						where: and(
							eq(metaAdsAccount.accountId, normalizedId),
							inArray(metaAdsAccount.teamId, teamIds),
						),
						columns: { id: true },
					});
					if (!linkedAccount) {
						throw new TRPCError({
							code: 'FORBIDDEN',
							message: 'You do not have access to this Meta ad account',
						});
					}
				}
				const { accessToken } = await getUserIntegration();
				const client = new MetaAdsClient({ accessToken });

				const normalizedId = input.accountId.startsWith('act_')
					? input.accountId
					: `act_${input.accountId}`;

				const result = await client.getConnectedInstagramAccounts(normalizedId);
				return {
					success: true,
					data: result.data ?? [],
				};
			} catch (error) {
				console.error('Meta Ads API get connected Instagram accounts error:', error);

				const oauthError = await handleMetaAdsOAuthError(error);
				if (oauthError) throw oauthError;

				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to fetch connected Instagram accounts',
				});
			}
		}),
});


