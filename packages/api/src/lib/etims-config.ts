import { TRPCError } from "@trpc/server";
import { db, eq } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { EtimsApiError, type EtimsClientConfig, type EtimsOscuHeaders, getEtimsClient, createEtimsClient, type EtimsOscuClient } from "./etims-client";
import { extractSdcIdFromKraBody } from "./etims-scu-print";
export { getEtimsClient };

export interface EtimsContext {
    client: EtimsOscuClient;
    oscu: EtimsOscuHeaders;
    isSandbox: boolean;
    /** Device CU ID from initialize. Same for every receipt from this OSCU. */
    sdcId: string | null;
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

    const sdcId = await loadDeviceSdcId(config);

    return { client, oscu, isSandbox: config.isSandbox, sdcId };
}

let sdcIdBackfill: Promise<string | null> | null = null;
let cachedDeviceSdcId: string | null | undefined;

/** Last loaded device CU ID. Sync fallback for invoice mapping. */
export function peekDeviceSdcId(): string | null {
    return cachedDeviceSdcId ?? null;
}

/**
 * CU ID (`sdcId`) is assigned once at device initialize and does not change.
 * Read it from `etims_configuration`. If an older install never stored it,
 * persist it once from initialize, then reuse the saved value.
 */
export async function loadDeviceSdcId(
    config?: typeof eTimsConfiguration.$inferSelect | null,
): Promise<string | null> {
    if (!config && cachedDeviceSdcId) return cachedDeviceSdcId;
    try {
        const row =
            config ??
            (await db.select().from(eTimsConfiguration).limit(1))[0];
        if (!row) {
            cachedDeviceSdcId = cachedDeviceSdcId ?? null;
            return null;
        }
        const stored = row.sdcId?.trim() || null;
        if (stored) {
            cachedDeviceSdcId = stored;
            return stored;
        }
        if (!row.isInitialized) return cachedDeviceSdcId ?? null;
        if (!sdcIdBackfill) {
            sdcIdBackfill = persistSdcIdFromInit(row)
                .then((id) => {
                    cachedDeviceSdcId = id;
                    return id;
                })
                .catch((error) => {
                    console.warn("[eTIMS] could not persist sdcId from initialize", error);
                    sdcIdBackfill = null;
                    return cachedDeviceSdcId ?? null;
                });
        }
        return sdcIdBackfill;
    } catch (error) {
        console.warn("[eTIMS] could not load device sdcId; continuing without it", error);
        if (cachedDeviceSdcId === undefined) cachedDeviceSdcId = null;
        return cachedDeviceSdcId;
    }
}

async function persistSdcIdFromInit(
    config: typeof eTimsConfiguration.$inferSelect,
): Promise<string | null> {
    const payload = {
        tin: config.kraPin,
        bhfId: config.branchId,
        dvcSrlNo: config.deviceSerialNumber,
    };
    const clients = [
        getEtimsClient(buildClientConfigFromEnv(config.isSandbox)),
        createClassicOscuClient(config.isSandbox),
    ];
    let fetched: string | null = null;
    for (const client of clients) {
        try {
            fetched = extractSdcIdFromKraBody(await client.selectInitOsdcInfo(payload));
        } catch (error) {
            if (error instanceof EtimsApiError) {
                fetched = extractSdcIdFromKraBody(error.response);
            }
        }
        if (fetched) break;
    }
    if (!fetched) return null;
    await db
        .update(eTimsConfiguration)
        .set({ sdcId: fetched, updatedAt: new Date() })
        .where(eq(eTimsConfiguration.id, config.id));
    return fetched;
}

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";

/** Gava item catalog is separate from classic OSCU. `saveItem` often lands on classic. */
export function isClassicOscuFallbackError(message: string) {
    return /does not exist in your inventory/i.test(message)
        || /Item itemCd provided/i.test(message)
        || /item management package/i.test(message)
        || /Expected a value but found null/i.test(message)
        || /getTestSessionApiLog/i.test(message)
        || /TestSessionApiLog/i.test(message)
        || /getApiNo\(\)/i.test(message)
        || /HTTP 400:\s*Error:?\s*$/i.test(message)
        || /HTTP 400:\s*Error:\s*—/i.test(message);
}

export function createClassicOscuClient(isSandbox: boolean) {
    return createEtimsClient({
        ...buildClientConfigFromEnv(isSandbox),
        baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
        memoryTokenOnly: true,
    });
}

export async function withClassicOscuFallback<T>(
    client: EtimsOscuClient,
    isSandbox: boolean,
    action: (c: EtimsOscuClient) => Promise<T>,
    label: string,
): Promise<T> {
    try {
        return await action(client);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isClassicOscuFallbackError(message)) throw error;
        const classic = createClassicOscuClient(isSandbox);
        console.warn(`[eTIMS] ${label} Gava failed, retrying classic OSCU`);
        return await action(classic);
    }
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
    return withClassicOscuFallback(
        client,
        isSandbox,
        (c) => c.saveTrnsSalesOsdc(oscu, transaction),
        "saveTrnsSalesOsdc",
    );
}

/** Gava `/sendPurchaseTransactionInfo` often 400s with a null TestSessionApiLog. */
export async function insertTrnsPurchaseOnKra(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    purchase: Record<string, unknown>,
) {
    return withClassicOscuFallback(
        client,
        isSandbox,
        (c) => c.insertTrnsPurchase(oscu, purchase),
        "insertTrnsPurchase",
    );
}
