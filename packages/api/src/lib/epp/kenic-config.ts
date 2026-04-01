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
	const normalizedHost = host.trim().toLowerCase();
	const isDefaultKenicHost = normalizedHost === "registry.kenic.or.ke";
	const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(normalizedHost);
	const explicitTlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim();
	const tlsServername =
		explicitTlsServername ||
		// KENIC often presents a cert issued for the CoCCA endpoint.
		// In production some setups use an IP for KENIC_EPP_HOST; TLS still
		// needs a DNS servername for certificate validation.
		(isDefaultKenicHost || isIpHost ? "epp.coccaregistry.org" : undefined);
	const allowLegacyCommonNameFallback =
		(process.env.KENIC_EPP_ALLOW_LEGACY_CN_FALLBACK ??
			// Default to safe compatibility for KENIC unless explicitly disabled.
			(isDefaultKenicHost ? "true" : "false")
		).toLowerCase() === "true";
	const username = process.env.KENIC_EPP_USERNAME ?? "";
	const password = process.env.KENIC_EPP_PASSWORD ?? "";

	if (Number.isNaN(port) || port < 1 || port > 65535) {
		throw new Error("Invalid KENIC_EPP_PORT (must be 1-65535)");
	}
	if (requireAuth && (!username || !password)) {
		throw new Error("KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required for this operation");
	}

	if (process.env.NODE_ENV !== "production") {
		console.log("[KENIC EPP] TLS config:", {
			host,
			port,
			tlsServername: tlsServername ?? host,
			allowLegacyCommonNameFallback,
		});
	}
	if (process.env.NODE_ENV === "production" && isIpHost && !explicitTlsServername) {
		console.warn(
			"[KENIC EPP] KENIC_EPP_HOST is an IP and KENIC_EPP_TLS_SERVERNAME is not set. " +
				`Using fallback TLS servername '${tlsServername}'. ` +
				"Set KENIC_EPP_TLS_SERVERNAME explicitly to match the registry certificate."
		);
	}

	return {
		host,
		port,
		timeoutMs: Number.isNaN(timeoutMs) ? 30_000 : timeoutMs,
		tlsServername,
		allowLegacyCommonNameFallback,
		username,
		password,
	};
}
