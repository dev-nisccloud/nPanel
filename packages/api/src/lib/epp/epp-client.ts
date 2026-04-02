/**
 * EPP (Extensible Provisioning Protocol) client - minimal transport layer.
 * Connects over TLS, reads/writes length-prefixed frames (RFC 5730/5734).
 * Used for KENIC registry integration.
 */

import * as tls from "node:tls";

const DEFAULT_TIMEOUT_MS = 30_000;

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

function parseSubjectAltDns(subjectAltName: string | undefined): string[] {
	if (!subjectAltName || typeof subjectAltName !== "string") return [];
	const out: string[] = [];
	for (const part of subjectAltName.split(",")) {
		const p = part.trim();
		const m = /^DNS:(.+)$/i.exec(p);
		if (m?.[1]) out.push(m[1].trim());
	}
	return out;
}

/**
 * Connect with TLS verification disabled, read peer certificate, then close.
 * Use only for debugging which hostname the registry cert is issued for (CN/SAN).
 */
export function inspectPeerCertificate(
	config: EppClientConfig,
	options?: { sniServernameOverride?: string; timeoutMs?: number }
): Promise<EppTlsPeerInspectResult> {
	const {
		host,
		port,
		timeoutMs = DEFAULT_TIMEOUT_MS,
		tlsServername,
	} = config;
	const servername = (options?.sniServernameOverride ?? tlsServername)?.trim() || host;
	const effectiveTimeout = options?.timeoutMs ?? timeoutMs;

	return new Promise((resolve, reject) => {
		const socket = tls.connect(
			{
				host,
				port,
				servername,
				rejectUnauthorized: false,
			},
			() => {
				try {
					const cert = socket.getPeerCertificate(true);
					socket.destroy();
					if (!cert || Object.keys(cert).length === 0) {
						reject(new Error("No peer certificate received"));
						return;
					}
					const subjectCN =
						cert.subject && typeof cert.subject === "object"
							? (cert.subject as { CN?: string }).CN ?? null
							: null;
					const sanRaw =
						typeof cert.subjectaltname === "string" ? cert.subjectaltname : null;
					const subjectAltNamesDns = parseSubjectAltDns(cert.subjectaltname);
					const issuer =
						cert.issuer && typeof cert.issuer === "object"
							? (cert.issuer as { CN?: string; O?: string })
							: null;
					const suggested =
						subjectAltNamesDns[0] ?? (typeof subjectCN === "string" ? subjectCN : null);
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
				} catch (e) {
					socket.destroy();
					reject(e instanceof Error ? e : new Error(String(e)));
				}
			}
		);

		socket.setTimeout(effectiveTimeout);
		socket.once("timeout", () => {
			socket.destroy();
			reject(new Error("EPP TLS inspect connection timeout"));
		});
		socket.once("error", (e: Error) => {
			socket.destroy();
			reject(e);
		});
	});
}

function matchesWildcardCommonName(commonName: string, hostname: string): boolean {
	if (!commonName.startsWith("*.")) return false;
	const suffix = commonName.slice(1); // ".example.com"
	return hostname.endsWith(suffix) && hostname.split(".").length >= commonName.split(".").length;
}

function legacyCnCheck(
	hostname: string,
	cert: tls.PeerCertificate,
	defaultError: Error
): Error | undefined {
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

function buildCheckServerIdentity(
	allowLegacyCommonNameFallback: boolean,
	expectedHostname?: string
) {
	return (hostname: string, cert: tls.PeerCertificate) => {
		// Prefer explicit expected hostname (usually TLS SNI/servername) when provided.
		// Some environments pass socket host into checkServerIdentity, which can differ
		// from TLS servername and cause false hostname mismatch failures.
		const verifyHostname = expectedHostname?.trim() || hostname;
		const defaultError = tls.checkServerIdentity(verifyHostname, cert);
		if (!defaultError) return undefined;
		if (!allowLegacyCommonNameFallback) return defaultError;
		return legacyCnCheck(verifyHostname, cert, defaultError);
	};
}

/**
 * Read exactly n bytes from the socket (may take multiple read() calls).
 */
function readExactly(socket: tls.TLSSocket, n: number): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let total = 0;

		const onError = (err: Error) => {
			cleanup();
			reject(err);
		};
		socket.once("error", onError);

		const tryRead = () => {
			const chunk = socket.read(n - total) as Buffer | null;
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
export async function readFrame(socket: tls.TLSSocket): Promise<Buffer> {
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
export function sendFrame(socket: tls.TLSSocket, xml: string): void {
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
export function createConnection(config: EppClientConfig): Promise<tls.TLSSocket> {
	const {
		host,
		port,
		timeoutMs = DEFAULT_TIMEOUT_MS,
		tlsServername,
		allowLegacyCommonNameFallback = false,
	} = config;
	const servername = tlsServername?.trim() || host;

	return new Promise((resolve, reject) => {
		const socket = tls.connect(
			{
				host,
				port,
				servername,
				rejectUnauthorized: true,
				checkServerIdentity: buildCheckServerIdentity(allowLegacyCommonNameFallback, servername),
			},
			() => {
				socket.removeListener("error", onError);
				resolve(socket);
			}
		);
		const onError = (err: Error) => reject(err);
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
export async function connectAndReceiveGreeting(
	config: EppClientConfig
): Promise<ConnectAndReceiveGreetingResult> {
	const {
		host,
		port,
		timeoutMs = DEFAULT_TIMEOUT_MS,
		tlsServername,
		allowLegacyCommonNameFallback = false,
	} = config;
	const servername = tlsServername?.trim() || host;

	const socket = tls.connect(
		{
			host,
			port,
			servername,
			rejectUnauthorized: true,
			checkServerIdentity: buildCheckServerIdentity(allowLegacyCommonNameFallback, servername),
		},
		() => {
			// Connected; server will send greeting
		}
	);

	// Do not set encoding: we need socket.read() to return Buffer for EPP framing.
	socket.setTimeout(timeoutMs);
	socket.on("timeout", () => {
		socket.destroy(new Error("EPP connection timeout"));
	});

	try {
		const payload = await readFrame(socket);
		const xml = payload.toString("utf8");
		return { xml };
	} finally {
		socket.destroy();
	}
}
