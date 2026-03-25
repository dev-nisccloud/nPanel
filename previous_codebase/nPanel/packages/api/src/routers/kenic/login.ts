import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import { buildLoginXml, buildLogoutXml } from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";

const parser = new XMLParser({ ignoreAttributes: false });

/** Extract EPP result code and message from parsed response (epp.response.result). */
function getEppResult(parsed: Record<string, unknown>): {
	code: string;
	msg: string;
} {
	const result = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const res = Array.isArray(result?.result) ? result?.result[0] : result?.result;
	if (!res || typeof res !== "object") {
		return { code: "0", msg: "Unknown response structure" };
	}
	const r = res as Record<string, unknown>;
	const code = String((r["@_code"] as string) ?? "0");
	const msgNode = r.msg;
	const msg =
		typeof msgNode === "string"
			? msgNode
			: Array.isArray(msgNode)
				? String(msgNode[0] ?? "")
				: typeof msgNode === "object" && msgNode !== null && "#text" in msgNode
					? String((msgNode as { "#text": string })["#text"])
					: "";
	return { code, msg };
}

/**
 * KENIC EPP login router.
 * Connects, receives greeting, sends login, returns response for type discovery.
 */
export const kenicLoginRouter = router({
	/**
	 * Connect to KENIC EPP, send login with credentials from env, return raw and parsed response.
	 * Use the response shape to derive types. No UI; API only.
	 */
	login: publicProcedure
		.input(z.object({}).optional().default({}))
		.mutation(async () => {
			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);

				// Read greeting (server sends first)
				await readFrame(socket);

				const loginXml = buildLoginXml(config.username, config.password);
				sendFrame(socket, loginXml);
				const loginResponseBuffer = await readFrame(socket);
				const loginResponseXml = loginResponseBuffer.toString("utf8");

				let parsed: Record<string, unknown>;
				try {
					parsed = parser.parse(loginResponseXml) as Record<string, unknown>;
				} catch (parseError) {
					return {
						raw: loginResponseXml,
						parsed: null,
						parseError: parseError instanceof Error ? parseError.message : String(parseError),
						resultCode: null,
						resultMsg: null,
						success: false,
					};
				}

				const { code, msg } = getEppResult(parsed);
				const success = code === "1000";

				// Logout and read logout response
				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				return {
					raw: loginResponseXml,
					parsed,
					resultCode: code,
					resultMsg: msg,
					success,
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD must be set for login",
					});
				}
				const isTimeout = message.toLowerCase().includes("timeout");
				const isRefused =
					message.toLowerCase().includes("econnrefused") ||
					message.toLowerCase().includes("connection refused");
				throw new TRPCError({
					code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
					message: `EPP login failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
