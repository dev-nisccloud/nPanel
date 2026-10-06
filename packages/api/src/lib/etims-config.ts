import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { type EtimsClientConfig, type EtimsOscuHeaders, getEtimsClient, createEtimsClient, type EtimsOscuClient } from "./etims-client";
export { getEtimsClient };

export interface EtimsContext {
    client: EtimsOscuClient;
    oscu: EtimsOscuHeaders;
    isSandbox: boolean;
}

function trimUrl(value: string | undefined, fallback: string): string {
    const raw = (value && value.trim()) || fallback;
    return raw.replace(/\/+$/, '');
}

/**
 * Build the KRA OSCU base URL for the given environment.
 * Prefers env-specific vars, then legacy ETIMS_BASE_URL, then KRA defaults.
 */
export function buildBaseUrl(isSandbox: boolean): string {
    if (isSandbox) {
        return trimUrl(
            process.env.ETIMS_SANDBOX_BASE_URL ?? process.env.ETIMS_BASE_URL,
            'https://sbx.kra.go.ke/etims-oscu/api/v1',
        );
    }
    return trimUrl(
        process.env.ETIMS_PROD_BASE_URL ?? process.env.ETIMS_BASE_URL,
        'https://etims-api.kra.go.ke/etims-api',
    );
}

/**
 * Build the KRA OAuth token URL for the given environment.
 */
export function buildTokenUrl(isSandbox: boolean): string {
    if (isSandbox) {
        return trimUrl(
            process.env.ETIMS_SANDBOX_TOKEN_URL ?? process.env.ETIMS_TOKEN_URL,
            'https://sbx.kra.go.ke/v1/token/generate',
        );
    }
    return trimUrl(
        process.env.ETIMS_PROD_TOKEN_URL ?? process.env.ETIMS_TOKEN_URL,
        'https://api.kra.go.ke/v1/token/generate',
    );
}

/**
 * Build EtimsClientConfig from the live process env (apps/server/.env).
 * Certification/test OAuth lives in .env.etims-certification and is not read here.
 */
export function buildClientConfigFromEnv(isSandbox: boolean): EtimsClientConfig {
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
    const apigeeAppId = (
        (isSandbox
            ? process.env.ETIMS_APIGEE_APP_ID
            : (process.env.ETIMS_PROD_APIGEE_APP_ID ?? process.env.ETIMS_APIGEE_APP_ID))
        ?? consumerKey
    ).trim();

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
export async function getEtimsContext(): Promise<EtimsContext> {
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

    const oscu: EtimsOscuHeaders = {
        tin: config.kraPin,
        bhfId: config.branchId,
        cmcKey: config.cmcKey,
    };

    return { client, oscu, isSandbox: config.isSandbox };
}

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";

function isGavaSalesInventoryMiss(message: string) {
    return /does not exist in your inventory/i.test(message)
        || /Item itemCd provided/i.test(message)
        || /item management package/i.test(message);
}

/**
 * Gava `/sendSalesTransaction` checks its own item catalog. Service items are often
 * saved on classic OSCU (`saveItem` fallback), so retry the sale there. Services have
 * no stock — this is an item-list lookup, not stock I/O.
 */
export async function saveTrnsSalesOnKra(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    transaction: Record<string, unknown>,
) {
    try {
        return await client.saveTrnsSalesOsdc(oscu, transaction);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isGavaSalesInventoryMiss(message)) throw error;

        const classic = createEtimsClient({
            ...buildClientConfigFromEnv(isSandbox),
            baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
            memoryTokenOnly: true,
        });
        console.warn("[eTIMS] saveTrnsSalesOsdc Gava item catalog miss, retrying classic OSCU");
        return await classic.saveTrnsSalesOsdc(oscu, transaction);
    }
}
