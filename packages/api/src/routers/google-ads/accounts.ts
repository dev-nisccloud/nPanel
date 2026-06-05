import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, inArray, or, sql } from '@npanel/db';
import { router, protectedProcedure } from '../../trpc';
import { db } from '@npanel/db';
import {
	googleAdsAccount,
	googleAdsAccountActivityLog,
} from '@npanel/db/schema/google-ads';
import { niscClientSubscription, niscProduct } from '@npanel/db/schema/products';
import { NISC_MEDIA_BUYING_PRODUCT_ID } from '../../lib/media-buying-billing';
import { team, teamMember } from '@npanel/db/schema/teams';
import {
	createGoogleAdsClient,
	getAccessibleCustomers,
	getCustomerInstance,
} from '../../lib/google-ads-client';
import {
	getGoogleAdsClientId,
	getGoogleAdsClientSecret,
	getGoogleAdsDeveloperToken,
} from '../../lib/google-ads-credentials';
import { GoogleAdsErrorHandler } from '../../lib/google-ads-error-handler';
import { getGoogleAdsIntegrationForSession } from '../../lib/google-ads-user-integration';
import { getGoogleAdsExecutionContext } from './access';

const isAgencyUserRole = (role: string | null | undefined) =>
	['AGENCY_USER', 'AGENCY_ADMIN', 'AGENCY_SUPER_ADMIN'].includes(role ?? '');

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

function formatGoogleCustomerIdDashed(customerId: string): string {
	const raw = customerId.replace(/-/g, '');
	return raw.length === 10
		? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
		: customerId;
}

async function hasGoogleSubscriptionAccess(teamIds: string[], customerId: string): Promise<boolean> {
	if (teamIds.length === 0) return false;
	const raw = customerId.replace(/-/g, '');
	const dashed = formatGoogleCustomerIdDashed(raw);
	const [linked] = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(
			and(
				inArray(niscClientSubscription.teamId, teamIds),
				or(
					eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID),
					ilike(niscProduct.name, "%media buying%"),
				),
				sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${"GOOGLE_ADS"}`,
				sql`((${niscClientSubscription.serviceRefs}->>'adAccountId') = ${raw} OR (${niscClientSubscription.serviceRefs}->>'adAccountId') = ${dashed})`,
			),
		)
		.limit(1);
	return !!linked;
}

async function getGoogleLinkedAccountsFromSubscriptions(teamIds: string[]) {
	if (teamIds.length === 0) return [];
	const rows = await db
		.select({
			serviceRefs: niscClientSubscription.serviceRefs,
			name: niscClientSubscription.name,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
		.where(
			and(
				inArray(niscClientSubscription.teamId, teamIds),
				or(
					eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID),
					ilike(niscProduct.name, "%media buying%"),
				),
				sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${"GOOGLE_ADS"}`,
			),
		);

	const byId = new Map<string, { customerId: string; accountName: string | null }>();
	for (const row of rows) {
		const refs = row.serviceRefs as Record<string, unknown> | null;
		const accountId = typeof refs?.adAccountId === 'string' ? refs.adAccountId.replace(/-/g, '').trim() : '';
		if (!accountId) continue;
		const accountNameRaw = typeof refs?.adAccountName === 'string' ? refs.adAccountName.trim() : '';
		const accountName = accountNameRaw || row.name || null;
		if (!byId.has(accountId)) {
			byId.set(accountId, { customerId: accountId, accountName });
		}
	}

	return [...byId.values()].map((acc) => ({
		customerId: acc.customerId,
		accountName: acc.accountName,
		currencyCode: null,
		timeZone: null,
		status: 'ACTIVE' as const,
		resourceName: `customers/${acc.customerId}`,
	}));
}

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
				const role = ctx.session?.user?.role;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}
				const isAgencyUser = isAgencyUserRole(role);
				const accessibleTeamIds = isAgencyUser ? [] : await getAccessibleTeamIds(userId);
				if (!isAgencyUser && accessibleTeamIds.length === 0) {
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
				if (!isAgencyUser) {
					const linkedAccounts = await getGoogleLinkedAccountsFromSubscriptions(accessibleTeamIds);
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

				const integration = await getGoogleAdsIntegrationForSession({
					userId,
					role,
				});

				// 1. Read-first: Try to get from database first
				const existingDbAccounts = await db
					.select()
					.from(googleAdsAccount)
					.where(
						and(
							eq(googleAdsAccount.integrationId, integration.id),
							isAgencyUser ? undefined : inArray(googleAdsAccount.teamId, accessibleTeamIds),
						),
					)
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

				const newAccounts: (typeof googleAdsAccount.$inferInsert)[] = [];
				const accountsToUpdate: Promise<unknown>[] = [];

				for (const customer of accessibleCustomers) {
					const customerIdWithoutDashes = customer.customerId.replace(/-/g, '');

					// Standardize customer ID for comparison
					const existingAccount = dbAccountMap.get(customerIdWithoutDashes);

					// Fetch account details from Google Ads API
					let accountName: string | null = null;
					let currencyCode: string | null = null;
					let timeZone: string | null = null;
					let accountStatus: 'ACTIVE' | 'PAUSED' | 'REMOVED' = 'ACTIVE';

					try {
						const customerInstance = getCustomerInstance(
							client,
							customerIdWithoutDashes,
							integration.refreshToken
						);

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
							const customerData = (results[0] as any).customer;
							if (customerData) {
								accountName = customerData.descriptive_name || null;
								currencyCode = customerData.currency_code || null;
								timeZone = customerData.time_zone || null;

								const status = customerData.status || 'ACTIVE';
								if (status === 'SUSPENDED') {
									accountStatus = 'PAUSED';
								} else if (status === 'CANCELED') {
									accountStatus = 'REMOVED';
								}
							}
						}
					} catch (error) {
						console.warn(`Failed to fetch details for customer ${customer.customerId}:`, error);
					}

					if (existingAccount) {
						// Check if update is needed
						const hasChanged =
							existingAccount.accountName !== accountName ||
							existingAccount.currencyCode !== currencyCode ||
							existingAccount.timeZone !== timeZone ||
							existingAccount.status !== accountStatus;

						if (hasChanged || input?.forceRefresh) {
							accountsToUpdate.push(
								db
									.update(googleAdsAccount)
									.set({
										accountName: accountName ?? existingAccount.accountName,
										currencyCode: currencyCode ?? existingAccount.currencyCode,
										timeZone: timeZone ?? existingAccount.timeZone,
										status: accountStatus,
										updatedAt: now,
									})
									.where(eq(googleAdsAccount.id, existingAccount.id)),
							);
						}

						accountResults.push({
							customerId: customer.customerId,
							resourceName: customer.resourceName,
							accountName: accountName || existingAccount.accountName,
							currencyCode: currencyCode || existingAccount.currencyCode,
							timeZone: timeZone || existingAccount.timeZone,
							status: accountStatus,
						});
					} else {
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
			} catch (error) {
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
				const { integration, customerIdWithoutDashes } = await getGoogleAdsExecutionContext(
					ctx,
					input.customerId,
				);

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

				if (!results || (results as any[]).length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: `Google Ads account ${input.customerId} not found or not accessible`,
					});
				}

				const accountData = results[0] as any;
				if (!accountData.customer) {
					throw new Error('Customer data not found in account response');
				}
				const accountName = accountData.customer.descriptive_name || null;
				const currencyCode = accountData.customer.currency_code || null;
				const timeZone = accountData.customer.time_zone || null;
				const status = accountData.customer.status || 'ACTIVE';

				// Map Google Ads status to our enum
				let accountStatus: 'ACTIVE' | 'PAUSED' | 'REMOVED' = 'ACTIVE';
				// Note: Google Ads API doesn't use 'PAUSED' or 'REMOVED' status values
				// These checks are kept for backward compatibility but won't match
				if (status === 'SUSPENDED') {
					accountStatus = 'PAUSED';
				} else if (status === 'CANCELED') {
					accountStatus = 'REMOVED';
				}

				// Store/update account in database
				const [existingAccount] = await db
					.select()
					.from(googleAdsAccount)
					.where(
						and(
							eq(googleAdsAccount.integrationId, integration.id),
							eq(googleAdsAccount.customerId, customerIdWithoutDashes),
						),
					)
					.limit(1);

				const now = new Date();
				let accountId: string;

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
				} else {
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
			} catch (error) {
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


