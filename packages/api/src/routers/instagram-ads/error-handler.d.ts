import { TRPCError } from '@trpc/server';
/**
 * Handle Instagram Ads API OAuth errors
 * Detects OAuth token invalidation errors and marks stored credentials as EXPIRED
 * Returns a TRPCError with requiresReconnect flag if credentials were invalidated
 */
export declare function handleInstagramAdsOAuthError(error: unknown): Promise<TRPCError | null>;
