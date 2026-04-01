import { protectedProcedure, router } from "../../trpc";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";

function isIpv4Host(host: string): boolean {
	return /^(\d{1,3}\.){3}\d{1,3}$/.test(host.trim());
}

/**
 * Safe runtime config snapshot for debugging KENIC connectivity in staging/prod.
 * Does not return credentials or secrets.
 */
export const kenicConfigStatusRouter = router({
	get: protectedProcedure.query(() => {
		const cfg = getKenicEppConfig(false);
		const explicitTlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim() || null;
		const hostIsIp = isIpv4Host(cfg.host);

		return {
			host: cfg.host,
			hostIsIp,
			port: cfg.port,
			timeoutMs: cfg.timeoutMs ?? 30_000,
			tlsServernameResolved: cfg.tlsServername ?? cfg.host,
			hasExplicitTlsServername: Boolean(explicitTlsServername),
			allowLegacyCommonNameFallback: Boolean(cfg.allowLegacyCommonNameFallback),
			hasCredentialsConfigured: Boolean(cfg.username && cfg.password),
		};
	}),
});

