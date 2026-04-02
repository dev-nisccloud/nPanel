import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import { inspectPeerCertificate } from "../../lib/epp/epp-client";

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

	/**
	 * Connects to KENIC EPP with TLS verification off, reads the leaf certificate only.
	 * Use to see CN/SAN and pick `KENIC_EPP_TLS_SERVERNAME`. Optional `sniServername` probes a different SNI.
	 */
	inspectTls: protectedProcedure
		.input(
			z
				.object({
					/** Override SNI for this probe (e.g. try `registry.kenic.or.ke` vs `epp.coccaregistry.org`). */
					sniServername: z.string().min(1).optional(),
				})
				.optional()
		)
		.query(async ({ input }) => {
			const cfg = getKenicEppConfig(false);
			return inspectPeerCertificate(cfg, {
				sniServernameOverride: input?.sniServername,
			});
		}),
});

