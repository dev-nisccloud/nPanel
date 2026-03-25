import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import prisma from '@npanel/db';
import { randomUUID } from 'node:crypto';
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

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const GetAccountDetailsRequestSchema = z.object({
	customerId: z.string().min(1, 'Customer ID is required'),
});

/**
 * Get user's Google Ads integration with valid tokens
 */
async function getUserIntegration(userId: string) {
	const integration = await prisma.googleAdsIntegration.findFirst({
		where: {
			userId,
			status: 'ACTIVE',
		},
	});

	if (!integration) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'No active Google Ads integration found. Please connect your account first.',
		});
	}

	// Check if access token is expired and refresh if needed
	const isExpired =
		integration.accessTokenExpiresAt &&
		new Date(integration.accessTokenExpiresAt) < new Date();

	if (isExpired && integration.refreshToken) {
		const { refreshAccessToken } = await import('../../lib/google-ads-client');
		const clientId = getGoogleAdsClientId();
		const clientSecret = getGoogleAdsClientSecret();

		try {
			const tokenResponse = await refreshAccessToken(
				integration.refreshToken,
				clientId,
				clientSecret
			);

			const expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

			await prisma.googleAdsIntegration.update({
				where: { id: integration.id },
				data: {
					accessToken: tokenResponse.access_token,
					accessTokenExpiresAt: expiresAt,
					lastTokenRefreshAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Update integration object for return
			integration.accessToken = tokenResponse.access_token;
			integration.accessTokenExpiresAt = expiresAt;
		} catch (error) {
			const errorInfo = GoogleAdsErrorHandler.handleError(error);
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: `Failed to refresh access token: ${errorInfo.message}`,
			});
		}
	}

	return integration;
}

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

				const integration = await getUserIntegration(userId);

				// 1. Read-first: Try to get from database first
				const existingDbAccounts = await prisma.googleAdsAccount.findMany({
					where: { integrationId: integration.id },
					orderBy: { updatedAt: 'desc' }, // Logic fix: checking freshest record
				});

				// Freshness threshold: 30 minutes
				const FRESHNESS_THRESHOLD = 30 * 60 * 1000;
				const now = new Date();
				const isDataFresh = existingDbAccounts.length > 0 &&
					(now.getTime() - new Date(existingDbAccounts[0].updatedAt).getTime()) < FRESHNESS_THRESHOLD;

				// If not forcing refresh and data is fresh, return from DB immediately
				if (existingDbAccounts.length > 0 && !input?.forceRefresh && isDataFresh) {
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
							retrieved_at: existingDbAccounts[0].updatedAt.toISOString(),
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
								prisma.googleAdsAccount.update({
									where: { id: existingAccount.id },
									data: {
										accountName: accountName || existingAccount.accountName,
										currencyCode: currencyCode || existingAccount.currencyCode,
										timeZone: timeZone || existingAccount.timeZone,
										status: accountStatus,
										updatedAt: now,
									},
								})
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
					newAccounts.length > 0 ? prisma.googleAdsAccount.createMany({ data: newAccounts }) : Promise.resolve(),
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
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}

				const integration = await getUserIntegration(userId);

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
				// Use findFirst since Prisma might not recognize the composite unique constraint yet
				// The schema has @@unique([integrationId, customerId]) but needs regeneration
				const existingAccount = await prisma.googleAdsAccount.findFirst({
					where: {
						integrationId: integration.id,
						customerId: customerIdWithoutDashes,
					},
				});

				const now = new Date();
				let accountId: string;

				if (existingAccount) {
					await prisma.googleAdsAccount.update({
						where: { id: existingAccount.id },
						data: {
							accountName,
							currencyCode,
							timeZone,
							status: accountStatus,
							updatedAt: now,
						},
					});
					accountId = existingAccount.id;
				} else {
					const newAccount = await prisma.googleAdsAccount.create({
						data: {
							id: `google_ads_account_${integration.id}_${customerIdWithoutDashes}_${Date.now()}`,
							integrationId: integration.id,
							customerId: customerIdWithoutDashes,
							accountName,
							currencyCode,
							timeZone,
							status: accountStatus,
							createdAt: now,
							updatedAt: now,
						},
					});
					accountId = newAccount.id;

					// Log activity
					await prisma.googleAdsAccountActivityLog.create({
						data: {
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
							createdAt: now,
						},
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


