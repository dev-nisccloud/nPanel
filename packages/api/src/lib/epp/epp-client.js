/**
 * EPP (Extensible Provisioning Protocol) client - minimal transport layer.
 * Connects over TLS, reads/writes length-prefixed frames (RFC 5730/5734).
 * Used for KENIC registry integration.
 */
import * as tls from "node:tls";
const DEFAULT_TIMEOUT_MS = 30_000;
function parseSubjectAltDns(subjectAltName) {
    if (!subjectAltName || typeof subjectAltName !== "string")
        return [];
    const out = [];
    for (const part of subjectAltName.split(",")) {
        const p = part.trim();
        const m = /^DNS:(.+)$/i.exec(p);
        if (m?.[1])
            out.push(m[1].trim());
    }
    return out;
}
/**
 * Connect with TLS verification disabled, read peer certificate, then close.
 * Use only for debugging which hostname the registry cert is issued for (CN/SAN).
 */
export function inspectPeerCertificate(config, options) {
    const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername, } = config;
    const servername = (options?.sniServernameOverride ?? tlsServername)?.trim() || host;
    const effectiveTimeout = options?.timeoutMs ?? timeoutMs;
    return new Promise((resolve, reject) => {
        const socket = tls.connect({
            host,
            port,
            servername,
            rejectUnauthorized: false,
        }, () => {
            try {
                const cert = socket.getPeerCertificate(true);
                socket.destroy();
                if (!cert || Object.keys(cert).length === 0) {
                    reject(new Error("No peer certificate received"));
                    return;
                }
                const subjectCN = cert.subject && typeof cert.subject === "object"
                    ? cert.subject.CN ?? null
                    : null;
                const sanRaw = typeof cert.subjectaltname === "string" ? cert.subjectaltname : null;
                const subjectAltNamesDns = parseSubjectAltDns(cert.subjectaltname);
                const issuer = cert.issuer && typeof cert.issuer === "object"
                    ? cert.issuer
                    : null;
                const suggested = subjectAltNamesDns[0] ?? (typeof subjectCN === "string" ? subjectCN : null);
                resolve({
                    connectHost: host,
                    connectPort: port,
                    sniServername: servername,
                    subjectCommonName: subjectCN,
                    subjectAltNamesDns,
                    subjectAltNameRaw: sanRaw,
                    issuerCommonName: issuer?.CN ?? null,
                    issuerOrganization: issuer?.O ?? null,
                    validFrom: cert.valid_from ?? null,
                    validTo: cert.valid_to ?? null,
                    fingerprintSha256: cert.fingerprint256 ?? null,
                    suggestedTlsServername: suggested,
                });
            }
            catch (e) {
                socket.destroy();
                reject(e instanceof Error ? e : new Error(String(e)));
            }
        });
        socket.setTimeout(effectiveTimeout);
        socket.once("timeout", () => {
            socket.destroy();
            reject(new Error("EPP TLS inspect connection timeout"));
        });
        socket.once("error", (e) => {
            socket.destroy();
            reject(e);
        });
    });
}
function matchesWildcardCommonName(commonName, hostname) {
    if (!commonName.startsWith("*."))
        return false;
    const suffix = commonName.slice(1); // ".example.com"
    return hostname.endsWith(suffix) && hostname.split(".").length >= commonName.split(".").length;
}
function legacyCnCheck(hostname, cert, defaultError) {
    // Only relax when SAN is missing in legacy certs.
    if (!defaultError.message.includes("Cert does not contain a DNS name")) {
        return defaultError;
    }
    const subjectCN = cert.subject?.CN;
    if (!subjectCN || typeof subjectCN !== "string") {
        return defaultError;
    }
    const normalizedHost = hostname.toLowerCase();
    const normalizedCN = subjectCN.toLowerCase();
    if (normalizedCN === normalizedHost || matchesWildcardCommonName(normalizedCN, normalizedHost)) {
        return undefined;
    }
    return defaultError;
}
function certDiagnostics(cert) {
    return {
        subjectCN: cert.subject?.CN ?? null,
        subjectAltName: cert.subjectaltname ?? null,
        issuerCN: cert.issuer?.CN ?? null,
        validFrom: cert.valid_from ?? null,
        validTo: cert.valid_to ?? null,
        fingerprint256: cert.fingerprint256 ?? null,
    };
}
function buildCheckServerIdentity(allowLegacyCommonNameFallback, expectedHostname) {
    return (hostname, cert) => {
        // Prefer explicit expected hostname (usually TLS SNI/servername) when provided.
        // Some environments pass socket host into checkServerIdentity, which can differ
        // from TLS servername and cause false hostname mismatch failures.
        const verifyHostname = expectedHostname?.trim() || hostname;
        const defaultError = tls.checkServerIdentity(verifyHostname, cert);
        if (!defaultError)
            return undefined;
        if (!allowLegacyCommonNameFallback) {
            console.error("[KENIC EPP] TLS cert verification failed (no CN fallback)", {
                verifyHostname,
                error: defaultError.message,
                cert: certDiagnostics(cert),
            });
            return defaultError;
        }
        const cnError = legacyCnCheck(verifyHostname, cert, defaultError);
        if (cnError) {
            // Always log cert details so we can see exactly what cert Cloud Run receives.
            console.error("[KENIC EPP] TLS cert verification failed (CN fallback also failed)", {
                verifyHostname,
                error: cnError.message,
                cert: certDiagnostics(cert),
            });
        }
        return cnError;
    };
}
/**
 * Read exactly n bytes from the socket (may take multiple read() calls).
 */
function readExactly(socket, n) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        const onError = (err) => {
            cleanup();
            reject(err);
        };
        socket.once("error", onError);
        const tryRead = () => {
            const chunk = socket.read(n - total);
            if (chunk && chunk.length > 0) {
                chunks.push(chunk);
                total += chunk.length;
            }
            if (total >= n) {
                cleanup();
                resolve(Buffer.concat(chunks, n));
            }
        };
        const cleanup = () => {
            socket.removeListener("error", onError);
            socket.removeListener("readable", tryRead);
        };
        socket.on("readable", tryRead);
        tryRead();
    });
}
/**
 * Read one EPP frame from the socket: 4-byte big-endian length then XML payload.
 * Length includes the 4-byte header (RFC 5734).
 */
export async function readFrame(socket) {
    const header = await readExactly(socket, 4);
    const totalLength = header.readUInt32BE(0);
    if (totalLength < 4 || totalLength > 0x00_ff_ff_ff) {
        throw new Error(`Invalid EPP frame length: ${totalLength}`);
    }
    const payloadLength = totalLength - 4;
    const payload = await readExactly(socket, payloadLength);
    return payload;
}
/**
 * Send one EPP frame: 4-byte big-endian length (total frame size) then UTF-8 XML.
 * Length includes the 4-byte header (RFC 5734).
 */
export function sendFrame(socket, xml) {
    const payload = Buffer.from(xml, "utf8");
    const totalLength = 4 + payload.length;
    const header = Buffer.alloc(4);
    header.writeUInt32BE(totalLength, 0);
    socket.write(header);
    socket.write(payload);
}
/**
 * Create a TLS connection to the EPP server. Caller must call socket.destroy() when done.
 * Do not set encoding on the socket (required for readFrame to receive Buffers).
 */
export function createConnection(config) {
    const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername, allowLegacyCommonNameFallback = false, rejectUnauthorized = true, } = config;
    const servername = tlsServername?.trim() || host;
    return new Promise((resolve, reject) => {
        const socket = tls.connect({
            host,
            port,
            servername,
            rejectUnauthorized,
            checkServerIdentity: rejectUnauthorized
                ? buildCheckServerIdentity(allowLegacyCommonNameFallback, servername)
                : () => undefined,
        }, () => {
            socket.removeListener("error", onError);
            resolve(socket);
        });
        const onError = (err) => reject(err);
        socket.once("error", onError);
        socket.setTimeout(timeoutMs);
        socket.on("timeout", () => {
            socket.destroy(new Error("EPP connection timeout"));
        });
    });
}
/**
 * Connect to the EPP server over TLS and receive the server greeting.
 * The server sends a greeting immediately upon connection (no login required).
 * Socket is closed after reading the greeting.
 */
export async function connectAndReceiveGreeting(config) {
    const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername, allowLegacyCommonNameFallback = false, rejectUnauthorized = true, } = config;
    const servername = tlsServername?.trim() || host;
    const socket = tls.connect({
        host,
        port,
        servername,
        rejectUnauthorized,
        checkServerIdentity: rejectUnauthorized
            ? buildCheckServerIdentity(allowLegacyCommonNameFallback, servername)
            : () => undefined,
    }, () => {
        // Connected; server will send greeting
    });
    // Do not set encoding: we need socket.read() to return Buffer for EPP framing.
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => {
        socket.destroy(new Error("EPP connection timeout"));
    });
    try {
        const payload = await readFrame(socket);
        const xml = payload.toString("utf8");
        return { xml };
    }
    finally {
        socket.destroy();
    }
}
