import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
	buildDomainCreateXml,
	type DomainCreateParams,
} from "../../lib/epp/epp-xml";
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

const domainCreateInputSchema = z.object({
	name: z.string().min(1),
	period: z.number().int().min(1).max(10).optional().default(1),
	ns: z
		.union([
			z.object({ type: z.literal("hostObj"), hosts: z.array(z.string().min(1)).min(1) }),
			z.object({
				type: z.literal("hostAttr"),
				hosts: z.array(z.object({ name: z.string().min(1), addrs: z.array(z.string()).optional() })).min(1),
			}),
		])
		.optional(),
	registrant: z.string().min(1),
	adminContacts: z.array(z.string().min(1)).optional(),
	techContacts: z.array(z.string().min(1)).optional(),
	authInfo: z.string().optional(),
});

/**
 * KENIC EPP domain create (RFC 5731).
 * Contacts (registrant, admin, tech) must exist; create them via kenic.contactCreate.create first.
 */
export const kenicDomainCreateRouter = router({
	create: publicProcedure
		.input(domainCreateInputSchema)
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

				const params: DomainCreateParams = {
					name: input.name,
					period: input.period,
					registrant: input.registrant,
					adminContacts: input.adminContacts,
					techContacts: input.techContacts,
					authInfo: input.authInfo,
				};
				if (input.ns) params.ns = input.ns;

				const createXml = buildDomainCreateXml(params);
				sendFrame(socket, createXml);
				const createResponseBuffer = await readFrame(socket);
				const createResponseXml = createResponseBuffer.toString("utf8");
				const createParsed = parser.parse(createResponseXml) as Record<string, unknown>;
				const createResult = getEppResult(createParsed);

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				if (createResult.code !== "1000") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: createResult.msg,
						cause: createResult.extValue,
					});
				}

				const resData = getResData(createParsed);
				const creData = resData?.["domain:creData"] as Record<string, unknown> | undefined;
				const name = creData?.["domain:name"] as string | undefined;
				const crDate = creData?.["domain:crDate"] as string | undefined;
				const exDate = creData?.["domain:exDate"] as string | undefined;

				return {
					success: true,
					domain: name ?? input.name,
					crDate: crDate ?? null,
					exDate: exDate ?? null,
					raw: createResponseXml,
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
					message: `KENIC domain create failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
