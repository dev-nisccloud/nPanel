/**
 * EPP (Extensible Provisioning Protocol) client - minimal transport layer.
 * Connects over TLS, reads/writes length-prefixed frames (RFC 5730/5734).
 * Used for KENIC registry integration.
 */
import * as tls from "node:tls";
export interface EppClientConfig {
    host: string;
    port: number;
    timeoutMs?: number;
    /**
     * TLS SNI and certificate verification hostname.
     * Use when the server presents a cert for a different hostname (e.g. shared registry).
     * If set, this is used for servername; otherwise host is used.
     */
    tlsServername?: string;
    /**
     * If true, allow legacy CN hostname validation fallback when SAN is missing.
     * Certificate chain validation remains enabled (rejectUnauthorized=true).
     */
    allowLegacyCommonNameFallback?: boolean;
    /**
     * If false, skip TLS certificate verification entirely.
     * The connection is still TLS-encrypted but the peer cert is NOT verified.
     * Use only for registries with broken/inconsistent cert infrastructure.
     * Controlled via KENIC_EPP_REJECT_UNAUTHORIZED env var.
     */
    rejectUnauthorized?: boolean;
}
export interface ConnectAndReceiveGreetingResult {
    /** Raw XML string (greeting or first server message). */
    xml: string;
}
/** Parsed TLS peer certificate metadata (for diagnostics; no private keys). */
export interface EppTlsPeerInspectResult {
    connectHost: string;
    connectPort: number;
    /** SNI sent during handshake. */
    sniServername: string;
    subjectCommonName: string | null;
    /** DNS names from Subject Alternative Name extension. */
    subjectAltNamesDns: string[];
    /** Raw subjectAltName string from the cert, if present. */
    subjectAltNameRaw: string | null;
    issuerCommonName: string | null;
    issuerOrganization: string | null;
    validFrom: string | null;
    validTo: string | null;
    fingerprintSha256: string | null;
    /** Hint: which name(s) to try for KENIC_EPP_TLS_SERVERNAME (first SAN DNS, else CN). */
    suggestedTlsServername: string | null;
}
/**
 * Connect with TLS verification disabled, read peer certificate, then close.
 * Use only for debugging which hostname the registry cert is issued for (CN/SAN).
 */
export declare function inspectPeerCertificate(config: EppClientConfig, options?: {
    sniServernameOverride?: string;
    timeoutMs?: number;
}): Promise<EppTlsPeerInspectResult>;
/**
 * Read one EPP frame from the socket: 4-byte big-endian length then XML payload.
 * Length includes the 4-byte header (RFC 5734).
 */
export declare function readFrame(socket: tls.TLSSocket): Promise<Buffer>;
/**
 * Send one EPP frame: 4-byte big-endian length (total frame size) then UTF-8 XML.
 * Length includes the 4-byte header (RFC 5734).
 */
export declare function sendFrame(socket: tls.TLSSocket, xml: string): void;
/**
 * Create a TLS connection to the EPP server. Caller must call socket.destroy() when done.
 * Do not set encoding on the socket (required for readFrame to receive Buffers).
 */
export declare function createConnection(config: EppClientConfig): Promise<tls.TLSSocket>;
/**
 * Connect to the EPP server over TLS and receive the server greeting.
 * The server sends a greeting immediately upon connection (no login required).
 * Socket is closed after reading the greeting.
 */
export declare function connectAndReceiveGreeting(config: EppClientConfig): Promise<ConnectAndReceiveGreetingResult>;
