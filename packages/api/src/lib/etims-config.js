import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { getEtimsClient } from "./etims-client";
export { getEtimsClient };
function trimUrl(value, fallback) {
    const raw = (value && value.trim()) || fallback;
    return raw.replace(/\/+$/, '');
}
/**
 * Build the KRA OSCU base URL for the given environment.
 * Prefers env-specific vars, then legacy ETIMS_BASE_URL, then KRA defaults.
 */
export function buildBaseUrl(isSandbox) {
    if (isSandbox) {
        return trimUrl(process.env.ETIMS_SANDBOX_BASE_URL ?? process.env.ETIMS_BASE_URL, 
        // Classic OSCU sandbox (worked pre-2ffc841e). Dev Platform: sbx.kra.go.ke/etims-oscu/api/v1
        'https://etims-api-sbx.kra.go.ke/etims-api');
    }
    return trimUrl(process.env.ETIMS_PROD_BASE_URL ?? process.env.ETIMS_BASE_URL, 'https://etims-api.kra.go.ke/etims-api');
}
/**
 * Build the KRA OAuth token URL for the given environment.
 */
export function buildTokenUrl(isSandbox) {
    if (isSandbox) {
        return trimUrl(process.env.ETIMS_SANDBOX_TOKEN_URL ?? process.env.ETIMS_TOKEN_URL, 'https://sbx.kra.go.ke/v1/token/generate');
    }
    return trimUrl(process.env.ETIMS_PROD_TOKEN_URL ?? process.env.ETIMS_TOKEN_URL, 'https://api.kra.go.ke/v1/token/generate');
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
    // Prefer explicit APigee app id when KRA issued one separately from the consumer key.
    // Falls back to consumer key (matches Postman / developer.go.ke docs).
    const apigeeAppId = ((isSandbox
        ? process.env.ETIMS_APIGEE_APP_ID
        : (process.env.ETIMS_PROD_APIGEE_APP_ID ?? process.env.ETIMS_APIGEE_APP_ID))
        ?? consumerKey).trim();
    return {
        baseUrl: buildBaseUrl(isSandbox),
        tokenUrl: buildTokenUrl(isSandbox),
        consumerKey,
        consumerSecret,
        apigeeAppId,
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
