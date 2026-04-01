import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessTokenForUser } from '../../lib/linkedin-credentials';

/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration(userId: string) {
	const tokenData = await getStoredLinkedInAccessTokenForUser(userId);

	if (!tokenData) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'No active LinkedIn integration found. Please connect your account first.',
		});
	}

	return tokenData;
}

function normalizeStatusLabel(status: string | null | undefined): string | null {
	if (!status) return null;
	return status;
}

function normalizeStatusArray(statuses: unknown): string[] {
	if (!Array.isArray(statuses)) return [];
	return statuses
		.map((status) => (typeof status === 'string' ? status : null))
		.filter((status): status is string => Boolean(status));
}

export const linkedInAdsAccountsRouter = router({
	/**
	 * List all accessible LinkedIn ad accounts
	 * Uses LinkedIn Marketing API to fetch accessible ad accounts
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

			const { accessToken, integrationId } = await getUserIntegration(userId);
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
					elementsCount: Array.isArray((response as any)?.elements) ? (response as any).elements.length : 0,
					hasPaging: !!(response as any)?.paging,
					responseKeys: Object.keys((response as any) || {}),
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
		} catch (error: any) {
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

				const { accessToken } = await getUserIntegration(userId);

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
			} catch (error) {

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

