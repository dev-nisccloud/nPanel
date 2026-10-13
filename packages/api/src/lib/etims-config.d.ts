import { type EtimsClientConfig, type EtimsOscuHeaders, getEtimsClient, type EtimsOscuClient } from "./etims-client";
export { getEtimsClient };
export interface EtimsContext {
    client: EtimsOscuClient;
    oscu: EtimsOscuHeaders;
    isSandbox: boolean;
}
/**
 * Build the KRA OSCU base URL for the given environment.
 * Prefers env-specific vars, then legacy ETIMS_BASE_URL, then KRA defaults.
 */
export declare function buildBaseUrl(isSandbox: boolean): string;
/**
 * Build the KRA OAuth token URL for the given environment.
 */
export declare function buildTokenUrl(isSandbox: boolean): string;
/**
 * Build EtimsClientConfig from the live process env (apps/server/.env).
 * Certification/test OAuth lives in .env.etims-certification and is not read here.
 */
export declare function buildClientConfigFromEnv(isSandbox: boolean): EtimsClientConfig;
/**
 * Load the eTIMS configuration from the DB and return a ready-to-use
 * { client, oscu } context object for all OSCU API calls.
 *
 * Throws PRECONDITION_FAILED if the device has not been initialized yet.
 */
export declare function getEtimsContext(): Promise<EtimsContext>;
export declare function isClassicOscuFallbackError(message: string): boolean;
export declare function createClassicOscuClient(isSandbox: boolean): EtimsOscuClient;
export declare function withClassicOscuFallback<T>(
    client: EtimsOscuClient,
    isSandbox: boolean,
    action: (c: EtimsOscuClient) => Promise<T>,
    label: string,
): Promise<T>;
export declare function saveTrnsSalesOnKra(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    transaction: Record<string, unknown>,
): Promise<unknown>;
export declare function insertTrnsPurchaseOnKra(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    purchase: Record<string, unknown>,
): Promise<unknown>;
