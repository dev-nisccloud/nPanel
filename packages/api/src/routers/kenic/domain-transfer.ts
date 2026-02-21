import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildDomainTransferXml } from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import { validateKenicDomains } from "../../lib/epp/kenic-tlds";

const parser = new XMLParser({ ignoreAttributes: false });

/** Extract EPP result code, message, and optional extValue from parsed response (epp.response.result). */
function getEppResult(parsed: Record<string, unknown>): {
	code: string;
	msg: string;
	extValue?: { value?: string; reason?: string };
} {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
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
	let extValue: { value?: string; reason?: string } | undefined;
	const extNode = r.extValue;
	if (extNode && typeof extNode === "object" && !Array.isArray(extNode)) {
		const ext = extNode as Record<string, unknown>;
		const toStr = (v: unknown): string | undefined =>
			v === undefined || v === null
				? undefined
				: typeof v === "string"
					? v
					: typeof v === "object" && v !== null && "#text" in v
						? String((v as { "#text": string })["#text"])
						: String(v);
		const value = toStr(ext.value);
		const reason = toStr(ext.reason);
		if (value !== undefined || reason !== undefined) {
			extValue = { value, reason };
		}
	}
	return { code, msg, extValue };
}

/** Get response resData (epp.response.resData). */
function getResData(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	return response?.resData as Record<string, unknown> | undefined;
}

const domainTransferInputSchema = z.object({
	name: z.string().min(1),
	authCode: z.string().min(1, "Auth code from losing registrar is required"),
	roid: z.string().optional(),
	period: z.number().int().min(1).max(10).optional(),
});

/**
 * KENIC EPP domain transfer (RFC 5731, op="request").
 * Initiates transfer of a domain to us (gaining registrar). Auth code must be obtained from current registrar.
 */
export const kenicDomainTransferRouter = router({
	request: publicProcedure
		.input(domainTransferInputSchema)
		.mutation(async ({ input }) => {
			const validation = validateKenicDomains([input.name]);
			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Only KENIC TLDs are supported. Domain: ${input.name}. Use kenic.tlds.list for supported TLDs.`,
					cause: { invalidDomains: validation.invalidDomains },
				});
			}

			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);

				await readFrame(socket);

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginResponseBuffer = await readFrame(socket);
				const loginParsed = parser.parse(loginResponseBuffer.toString("utf8")) as Record<string, unknown>;
				const loginResult = getEppResult(loginParsed);
				if (loginResult.code !== "1000") {
					sendFrame(socket, buildLogoutXml());
					await readFrame(socket);
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `EPP login failed: ${loginResult.msg}`,
						cause: loginResult.extValue,
					});
				}

				const transferXml = buildDomainTransferXml({
					name: input.name,
					authCode: input.authCode,
					roid: input.roid,
					period: input.period,
				});
				sendFrame(socket, transferXml);
				const transferResponseBuffer = await readFrame(socket);
				const transferResponseXml = transferResponseBuffer.toString("utf8");
				const transferParsed = parser.parse(transferResponseXml) as Record<string, unknown>;
				const transferResult = getEppResult(transferParsed);

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				// 1000 = completed (auto-approved), 1001 = pending (awaiting losing registrar approval)
				if (transferResult.code !== "1000" && transferResult.code !== "1001") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: transferResult.msg,
						cause: transferResult.extValue,
					});
				}

				const resData = getResData(transferParsed);
				const trnData = resData?.["domain:trnData"] as Record<string, unknown> | undefined;
				const name = trnData?.["domain:name"] as string | undefined;
				const trStatus = trnData?.["domain:trStatus"] as string | undefined;
				const reId = trnData?.["domain:reId"] as string | undefined;
				const reDate = trnData?.["domain:reDate"] as string | undefined;
				const acId = trnData?.["domain:acId"] as string | undefined;
				const acDate = trnData?.["domain:acDate"] as string | undefined;
				const exDate = trnData?.["domain:exDate"] as string | undefined;

				return {
					success: true,
					pending: transferResult.code === "1001",
					domain: name ?? input.name,
					trStatus: trStatus ?? null,
					reId: reId ?? null,
					reDate: reDate ?? null,
					acId: acId ?? null,
					acDate: acDate ?? null,
					exDate: exDate ?? null,
					raw: transferResponseXml,
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required",
					});
				}
				const isTimeout = message.toLowerCase().includes("timeout");
				const isRefused =
					message.toLowerCase().includes("econnrefused") ||
					message.toLowerCase().includes("connection refused");
				throw new TRPCError({
					code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
					message: `KENIC domain transfer failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
