import type { Context } from "hono";
import { getKenicEppConfig } from "@npanel/api/lib/epp/kenic-config";
import { inspectPeerCertificate } from "@npanel/api/lib/epp/epp-client";
import * as net from "node:net";

const CONNECT_TIMEOUT_MS = 8_000;

/** Raw TCP connect (no TLS) to verify port 700 is reachable from this runtime. */
function testTcpReachability(host: string, port: number): Promise<{ reachable: boolean; durationMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (reachable: boolean, error?: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ reachable, durationMs: Date.now() - start, error });
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false, "TCP connect timeout"));
    socket.once("error", (e: Error) => finish(false, e.message));
    socket.connect(port, host);
  });
}

/**
 * GET /api/kenic/test-connection
 *
 * Tests KENIC EPP connectivity from this runtime:
 * 1. Env vars present check (no secrets returned)
 * 2. Raw TCP reachability on port 700
 * 3. TLS handshake + peer cert inspection (rejectUnauthorized=false for diagnostics only)
 */
export async function handleTestKenicConnection(c: Context) {
  try {
    const cfg = getKenicEppConfig(false);

    // 1. Env summary (no secret values)
    const env = {
      KENIC_EPP_HOST: process.env.KENIC_EPP_HOST ?? "(default: registry.kenic.or.ke)",
      KENIC_EPP_PORT: process.env.KENIC_EPP_PORT ?? "(default: 700)",
      KENIC_EPP_TLS_SERVERNAME: process.env.KENIC_EPP_TLS_SERVERNAME ?? "(not set)",
      KENIC_EPP_ALLOW_LEGACY_CN_FALLBACK: process.env.KENIC_EPP_ALLOW_LEGACY_CN_FALLBACK ?? "(default: true)",
      KENIC_EPP_REJECT_UNAUTHORIZED: process.env.KENIC_EPP_REJECT_UNAUTHORIZED ?? "(default: true)",
      KENIC_EPP_USERNAME_SET: !!process.env.KENIC_EPP_USERNAME,
      KENIC_EPP_PASSWORD_SET: !!process.env.KENIC_EPP_PASSWORD,
    };

    // 2. Resolved config (what the code actually uses)
    const resolved = {
      host: cfg.host,
      port: cfg.port,
      tlsServername: cfg.tlsServername ?? cfg.host,
      allowLegacyCommonNameFallback: cfg.allowLegacyCommonNameFallback,
      rejectUnauthorized: cfg.rejectUnauthorized ?? true,
    };

    // 3. TCP reachability
    const tcp = await testTcpReachability(cfg.host, cfg.port);

    // 4. TLS cert inspection (always rejectUnauthorized=false here   diagnostic only)
    let tlsCert: Record<string, unknown> | null = null;
    let tlsError: string | null = null;
    if (tcp.reachable) {
      try {
        const result = await inspectPeerCertificate(cfg, { timeoutMs: CONNECT_TIMEOUT_MS });
        tlsCert = {
          sniServername: result.sniServername,
          subjectCommonName: result.subjectCommonName,
          subjectAltNamesDns: result.subjectAltNamesDns,
          subjectAltNameRaw: result.subjectAltNameRaw,
          issuerCommonName: result.issuerCommonName,
          issuerOrganization: result.issuerOrganization,
          validFrom: result.validFrom,
          validTo: result.validTo,
          fingerprintSha256: result.fingerprintSha256,
          suggestedTlsServername: result.suggestedTlsServername,
        };
      } catch (e: unknown) {
        tlsError = e instanceof Error ? e.message : String(e);
      }
    }

    // 5. Verdict
    const tlsWillValidate =
      tlsCert !== null &&
      (tlsCert.subjectAltNamesDns as string[]).includes(resolved.tlsServername);

    return c.json({
      message: "KENIC EPP Connection Test",
      timestamp: new Date().toISOString(),
      env,
      resolved,
      tcp,
      tlsCert,
      tlsError,
      verdict: {
        tcpReachable: tcp.reachable,
        tlsCertReceived: tlsCert !== null,
        tlsWillValidate: resolved.rejectUnauthorized ? tlsWillValidate : true,
        rejectUnauthorizedDisabled: !resolved.rejectUnauthorized,
        note: !resolved.rejectUnauthorized
          ? "KENIC_EPP_REJECT_UNAUTHORIZED=false   cert is NOT verified (connection still encrypted)"
          : tlsWillValidate
            ? "Cert SAN matches tlsServername   TLS validation should pass"
            : `Cert SAN [${(tlsCert?.subjectAltNamesDns as string[] | undefined)?.join(", ") ?? "none"}] does NOT include '${resolved.tlsServername}'   TLS validation will fail. Set KENIC_EPP_TLS_SERVERNAME to '${tlsCert?.suggestedTlsServername ?? "?"}'`,
      },
    });
  } catch (error: unknown) {
    return c.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}
