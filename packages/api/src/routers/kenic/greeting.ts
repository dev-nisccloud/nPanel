import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { connectAndReceiveGreeting } from "../../lib/epp/epp-client";

/**
 * KENIC EPP greeting router.
 * Connect to the registry and receive the server greeting to inspect
 * capabilities and response format before implementing login/domain commands.
 */
export const kenicGreetingRouter = router({
	/**
	 * Connect to KENIC EPP server and return the server greeting.
	 * No login is required for the greeting; it is sent immediately on connect.
	 * Use this to see actual capabilities and response structure for building
	 * the rest of the EPP routes.
	 */
	getGreeting: protectedProcedure
		.input(z.object({}).optional().default({}))
		.query(async () => {
			const host = process.env.KENIC_EPP_HOST ?? "registry.kenic.or.ke";
			const port = Number(process.env.KENIC_EPP_PORT ?? "700");
			const timeoutMs = Number(process.env.KENIC_EPP_TIMEOUT_MS ?? "30000");
			const tlsServername = process.env.KENIC_EPP_TLS_SERVERNAME?.trim() || undefined;

			if (Number.isNaN(port) || port < 1 || port > 65535) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid KENIC_EPP_PORT (must be 1-65535)",
				});
			}

			try {
				const { xml } = await connectAndReceiveGreeting({
					host,
					port,
					timeoutMs: Number.isNaN(timeoutMs) ? 30_000 : timeoutMs,
					tlsServername,
				});

				if (!xml || xml.trim() === "") {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Empty greeting from EPP server",
					});
				}

				const parser = new XMLParser({ ignoreAttributes: false });
				let parsed: unknown;
				try {
					parsed = parser.parse(xml);
				} catch (parseError) {
					return {
						raw: xml,
						parsed: null,
						parseError: parseError instanceof Error ? parseError.message : String(parseError),
						configUsed: { host, port, timeoutMs, tlsServername: tlsServername ?? null },
					};
				}

				return {
					raw: xml,
					parsed,
					configUsed: { host, port, timeoutMs, tlsServername: tlsServername ?? null },
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				const isTimeout = message.toLowerCase().includes("timeout");
				const isRefused =
					message.toLowerCase().includes("econnrefused") ||
					message.toLowerCase().includes("connection refused");
				throw new TRPCError({
					code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
					message: `EPP connect/greeting failed: ${message}`,
					cause: error,
				});
			}
		}),
});
