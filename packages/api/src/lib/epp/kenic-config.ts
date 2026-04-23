/**
 * KENIC EPP config from environment.
 * Used by KENIC tRPC procedures.
 */

import type { EppClientConfig } from "./epp-client";

export interface KenicEppEnvConfig extends EppClientConfig {
	username: string;
	password: string;
}

let hasLoggedProdTlsResolution = false;

function isIpv4Host(value: string): boolean {
	return /^(\d{1,3}\.){3}\d{1,3}$/.test(value.trim());
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
	const isIpHost = isIpv4Host(normalizedHost);
	const explicitTlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim();
	const explicitTlsServernameIsIp = explicitTlsServername ? isIpv4Host(explicitTlsServername) : false;
	const tlsServername = explicitTlsServername && !explicitTlsServernameIsIp
		? explicitTlsServername
		: "epp.coccaregistry.org";
	const allowLegacyCommonNameFallback =
		(process.env.KENIC_EPP_ALLOW_LEGACY_CN_FALLBACK ??
			// Default to safe compatibility for KENIC unless explicitly disabled.
			"true"
		).toLowerCase() === "true";
	// KENIC_EPP_REJECT_UNAUTHORIZED=false disables TLS cert verification entirely.
	// The connection is still encrypted but the peer cert is NOT verified.
	// Use when the registry presents a cert from a different server path (e.g. Cloud Run → different IP).
	const rejectUnauthorized =
		(process.env.KENIC_EPP_REJECT_UNAUTHORIZED ?? "true").toLowerCase() !== "false";
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
	if (process.env.NODE_ENV === "production" && explicitTlsServernameIsIp) {
		console.warn(
			"[KENIC EPP] KENIC_EPP_TLS_SERVERNAME is set to an IP, which breaks TLS hostname verification. " +
				`Ignoring it and using '${tlsServername}' instead.`
		);
	}
	if (!rejectUnauthorized) {
		console.warn(
			"[KENIC EPP] KENIC_EPP_REJECT_UNAUTHORIZED=false   TLS cert verification is DISABLED. " +
				"Connection is still encrypted but peer certificate is NOT validated. " +
				"Set to true once the registry cert issue is resolved."
		);
	}

	if (process.env.NODE_ENV === "production" && !hasLoggedProdTlsResolution) {
		hasLoggedProdTlsResolution = true;
		console.info("[KENIC EPP] Resolved TLS connection settings", {
			host,
			hostIsIp: isIpHost,
			port,
			explicitTlsServername: explicitTlsServername ?? null,
			explicitTlsServernameIsIp,
			resolvedTlsServername: tlsServername,
			allowLegacyCommonNameFallback,
			rejectUnauthorized,
		});
	}

	return {
		host,
		port,
		timeoutMs: Number.isNaN(timeoutMs) ? 30_000 : timeoutMs,
		tlsServername,
		allowLegacyCommonNameFallback,
		rejectUnauthorized,
		username,
		password,
	};
}
