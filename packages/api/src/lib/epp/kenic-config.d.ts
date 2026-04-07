/**
 * KENIC EPP config from environment.
 * Used by KENIC tRPC procedures.
 */
import type { EppClientConfig } from "./epp-client";
export interface KenicEppEnvConfig extends EppClientConfig {
    username: string;
    password: string;
}
/**
 * Read KENIC EPP config from environment.
 * Throws if required credentials are missing (for login/command flows).
 */
export declare function getKenicEppConfig(requireAuth: boolean): KenicEppEnvConfig;
