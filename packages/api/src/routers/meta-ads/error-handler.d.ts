import { TRPCError } from '@trpc/server';
/**
 * Handle Meta Ads API OAuth errors
 * Detects OAuth token invalidation errors and deletes stored credentials
 * Returns a TRPCError with requiresReconnect flag if credentials were deleted
 */
export declare function handleMetaAdsOAuthError(error: unknown): Promise<TRPCError | null>;
