import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import prisma from '@nPanel/db';
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
	listAccessibleAccounts: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User session not found',
				});
			}

			const integration = await getUserIntegration(userId);

			// Create Google Ads client
			const client = createGoogleAdsClient({
				developerToken: getGoogleAdsDeveloperToken(),
				clientId: getGoogleAdsClientId(),
				clientSecret: getGoogleAdsClientSecret(),
				refreshToken: integration.refreshToken,
			});

			// Get accessible customers using the library's method
			const accessibleCustomers = await getAccessibleCustomers(client, integration.refreshToken);

			// Fetch account details for each customer and store/update in database
			const now = new Date();
			const accountResults = [];

			for (const customer of accessibleCustomers) {
				// Remove dashes from customer ID for storage (format: XXX-XXX-XXXX -> XXXXXXXXXX)
				const customerIdWithoutDashes = customer.customerId.replace(/-/g, '');

				// Fetch account details from Google Ads API
				let accountName: string | null = null;
				let currencyCode: string | null = null;
				let timeZone: string | null = null;
				let accountStatus: 'ACTIVE' | 'PAUSED' | 'REMOVED' = 'ACTIVE';

				try {
					// Get customer instance for this specific customer
					const customerInstance = getCustomerInstance(
						client,
						customerIdWithoutDashes,
						integration.refreshToken
					);

					// Query customer details using GAQL
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
						
						// Map Google Ads status to our enum
						const status = customerData.status || 'ACTIVE';
						// Note: Google Ads API doesn't use 'PAUSED' or 'REMOVED' status values
						// These checks are kept for backward compatibility but won't match
						if (status === 'SUSPENDED') {
							accountStatus = 'PAUSED';
						} else if (status === 'CANCELED') {
							accountStatus = 'REMOVED';
						}
					}
				}
				} catch (error) {
					console.warn(`Failed to fetch details for customer ${customer.customerId}:`, error);
					// Continue with basic info if details fetch fails
				}

				// Use findFirst since Prisma might not recognize the composite unique constraint yet
				// The schema has @@unique([integrationId, customerId]) but needs regeneration
				const existingAccount = await prisma.googleAdsAccount.findFirst({
					where: {
						integrationId: integration.id,
						customerId: customerIdWithoutDashes,
					},
				});

				if (existingAccount) {
					// Update existing account
					await prisma.googleAdsAccount.update({
						where: { id: existingAccount.id },
						data: {
							accountName: accountName || existingAccount.accountName,
							currencyCode: currencyCode || existingAccount.currencyCode,
							timeZone: timeZone || existingAccount.timeZone,
							status: accountStatus,
							updatedAt: now,
						},
					});
					accountResults.push({
						customerId: customer.customerId,
						resourceName: customer.resourceName,
						accountName: accountName || existingAccount.accountName,
						currencyCode: currencyCode || existingAccount.currencyCode,
						timeZone: timeZone || existingAccount.timeZone,
						status: accountStatus,
					});
				} else {
					// Create new account
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

					// Log activity
					await prisma.googleAdsAccountActivityLog.create({
						data: {
							id: randomUUID(),
							accountId: newAccount.id,
							userId,
							action: 'CREATE',
							description: `Google Ads account ${customer.customerId} discovered and added`,
							metadata: {
								customerId: customer.customerId,
								accountName,
								currencyCode,
								timeZone,
								status: accountStatus,
							},
							createdAt: now,
						},
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

			return {
				success: true,
				data: accountResults,
				meta: {
					retrieved_at: new Date().toISOString(),
					total_accounts: accountResults.length,
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


