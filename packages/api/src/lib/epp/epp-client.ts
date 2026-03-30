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

function buildCheckServerIdentity(allowLegacyCommonNameFallback: boolean) {
	return (hostname: string, cert: tls.PeerCertificate) => {
		const defaultError = tls.checkServerIdentity(hostname, cert);
		if (!defaultError) return undefined;
		if (!allowLegacyCommonNameFallback) return defaultError;
		return legacyCnCheck(hostname, cert, defaultError);
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
				checkServerIdentity: buildCheckServerIdentity(allowLegacyCommonNameFallback),
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
			checkServerIdentity: buildCheckServerIdentity(allowLegacyCommonNameFallback),
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
