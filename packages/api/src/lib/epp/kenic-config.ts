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
export function getKenicEppConfig(requireAuth: boolean): KenicEppEnvConfig {
	const host = process.env.KENIC_EPP_HOST ?? "registry.kenic.or.ke";
	const port = Number(process.env.KENIC_EPP_PORT ?? "700");
	const timeoutMs = Number(process.env.KENIC_EPP_TIMEOUT_MS ?? "30000");
	const tlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim() || undefined;
	const username = process.env.KENIC_EPP_USERNAME ?? "";
	const password = process.env.KENIC_EPP_PASSWORD ?? "";

	if (Number.isNaN(port) || port < 1 || port > 65535) {
		throw new Error("Invalid KENIC_EPP_PORT (must be 1-65535)");
	}
	if (requireAuth && (!username || !password)) {
		throw new Error("KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required for this operation");
	}

	return {
		host,
		port,
		timeoutMs: Number.isNaN(timeoutMs) ? 30_000 : timeoutMs,
		tlsServername,
		username,
		password,
	};
}
