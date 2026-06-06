import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { getEtimsClient } from "./etims-client";
export { getEtimsClient };
/**
 * Build the KRA OSCU base URL for the given environment.
 * Uses env vars with sensible KRA defaults.
 */
export function buildBaseUrl(isSandbox) {
    if (isSandbox) {
        return (process.env.ETIMS_SANDBOX_BASE_URL ?? 'https://etims-api-sbx.kra.go.ke/etims-api').trim().replace(/\/+$/, '');
    }
    return (process.env.ETIMS_PROD_BASE_URL ?? 'https://etims-api.kra.go.ke/etims-api').trim().replace(/\/+$/, '');
}
/**
 * Build the KRA OAuth token URL for the given environment.
 */
export function buildTokenUrl(isSandbox) {
    if (isSandbox) {
        return (process.env.ETIMS_SANDBOX_TOKEN_URL ?? 'https://sbx.kra.go.ke/v1/token/generate').trim().replace(/\/+$/, '');
    }
    return (process.env.ETIMS_PROD_TOKEN_URL ?? 'https://api.kra.go.ke/v1/token/generate').trim().replace(/\/+$/, '');
}
/**
 * Build EtimsClientConfig from environment variables (no DB).
 * Used during device initialization before the DB record exists.
 */
export function buildClientConfigFromEnv(isSandbox) {
    const consumerKey = process.env.ETIMS_CONSUMER_KEY ?? '';
    const consumerSecret = process.env.ETIMS_CONSUMER_SECRET ?? '';
    if (!consumerKey || !consumerSecret) {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'eTIMS Consumer Key and Secret are not configured in environment variables.',
        });
    }
    return {
        baseUrl: buildBaseUrl(isSandbox),
        tokenUrl: buildTokenUrl(isSandbox),
        consumerKey,
        consumerSecret,
    };
}
/**
 * Load the eTIMS configuration from the DB and return a ready-to-use
 * { client, oscu } context object for all OSCU API calls.
 *
 * Throws PRECONDITION_FAILED if the device has not been initialized yet.
 */
export async function getEtimsContext() {
    const [config] = await db
        .select()
        .from(eTimsConfiguration)
        .limit(1);
    if (!config) {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'eTIMS has not been configured. Please initialize the device first.',
        });
    }
    if (!config.isInitialized || !config.cmcKey) {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'eTIMS device is not initialized. Please complete device initialization in Settings.',
        });
    }
    const clientConfig = buildClientConfigFromEnv(config.isSandbox);
    const client = getEtimsClient(clientConfig);
    const oscu = {
        tin: config.kraPin,
        bhfId: config.branchId,
        cmcKey: config.cmcKey,
    };
    return { client, oscu, isSandbox: config.isSandbox };
}
