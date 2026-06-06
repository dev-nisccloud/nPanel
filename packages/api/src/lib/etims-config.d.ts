import { type EtimsClientConfig, type EtimsOscuHeaders, getEtimsClient, type EtimsOscuClient } from "./etims-client";
export { getEtimsClient };
export interface EtimsContext {
    client: EtimsOscuClient;
    oscu: EtimsOscuHeaders;
    isSandbox: boolean;
}
/**
 * Build the KRA OSCU base URL for the given environment.
 * Uses env vars with sensible KRA defaults.
 */
export declare function buildBaseUrl(isSandbox: boolean): string;
/**
 * Build the KRA OAuth token URL for the given environment.
 */
export declare function buildTokenUrl(isSandbox: boolean): string;
/**
 * Build EtimsClientConfig from environment variables (no DB).
 * Used during device initialization before the DB record exists.
 */
export declare function buildClientConfigFromEnv(isSandbox: boolean): EtimsClientConfig;
/**
 * Load the eTIMS configuration from the DB and return a ready-to-use
 * { client, oscu } context object for all OSCU API calls.
 *
 * Throws PRECONDITION_FAILED if the device has not been initialized yet.
 */
export declare function getEtimsContext(): Promise<EtimsContext>;
