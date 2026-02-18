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
}

export interface ConnectAndReceiveGreetingResult {
	/** Raw XML string (greeting or first server message). */
	xml: string;
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
async function readOneFrame(socket: tls.TLSSocket): Promise<Buffer> {
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
 * Connect to the EPP server over TLS and receive the server greeting.
 * The server sends a greeting immediately upon connection (no login required).
 * Socket is closed after reading the greeting.
 */
export async function connectAndReceiveGreeting(
	config: EppClientConfig
): Promise<ConnectAndReceiveGreetingResult> {
	const { host, port, timeoutMs = DEFAULT_TIMEOUT_MS, tlsServername } = config;
	const servername = tlsServername?.trim() || host;

	const socket = tls.connect(
		{
			host,
			port,
			servername,
			rejectUnauthorized: true,
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
		const payload = await readOneFrame(socket);
		const xml = payload.toString("utf8");
		return { xml };
	} finally {
		socket.destroy();
	}
}
