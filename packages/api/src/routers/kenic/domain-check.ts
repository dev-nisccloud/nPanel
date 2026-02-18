import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import {
	buildLoginXml,
	buildLogoutXml,
	buildDomainCheckXml,
	buildDomainCheckWithFeeXml,
} from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import {
	normalizeDomainCheckResponse,
	type DomainCheckNormalized,
} from "../../lib/epp/domain-check-types";
import { validateKenicDomains } from "../../lib/epp/kenic-tlds";

const parser = new XMLParser({ ignoreAttributes: false });

/** Max domains per EPP check (with or without fee). 2400 was caused by .go.ke in the request; .go.ke is no longer offered. */
const MAX_DOMAINS_PER_EPP_CHECK = 10;

/** Merge multiple EPP domain check responses into one parsed structure (resData + extension). */
function mergeCheckResponses(parsedList: Record<string, unknown>[]): Record<string, unknown> {
	const domainCds: unknown[] = [];
	let feeCurrency: string | undefined;
	const feeCds: unknown[] = [];

	for (const parsed of parsedList) {
		const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
		const resData = response?.resData as Record<string, unknown> | undefined;
		const chkData = resData?.["domain:chkData"] as Record<string, unknown> | undefined;
		const cdList = chkData?.["domain:cd"];
		if (Array.isArray(cdList)) domainCds.push(...cdList);
		else if (cdList != null) domainCds.push(cdList);

		const ext = response?.extension as Record<string, unknown> | undefined;
		const feeChk = ext?.["fee:chkData"] as Record<string, unknown> | undefined;
		if (feeChk?.["fee:currency"]) feeCurrency = feeChk["fee:currency"] as string;
		const feeCdList = feeChk?.["fee:cd"];
		if (Array.isArray(feeCdList)) feeCds.push(...feeCdList);
		else if (feeCdList != null) feeCds.push(feeCdList);
	}

	const first = parsedList[0];
	const response = (first?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const result = response?.result;
	const trID = response?.trID;

	const mergedResponse: Record<string, unknown> = {
		result,
		resData: {
			"domain:chkData": {
				"domain:cd": domainCds,
				"@_xmlns:domain": "urn:ietf:params:xml:ns:domain-1.0",
				"@_xsi:schemaLocation": "urn:ietf:params:xml:ns:domain-1.0 domain-1.0.xsd",
			},
		},
		trID,
	};
	if (feeCds.length > 0) {
		mergedResponse.extension = {
			"fee:chkData": {
				"fee:currency": feeCurrency ?? "",
				"fee:cd": feeCds,
				"@_xmlns:fee": "urn:ietf:params:xml:ns:epp:fee-1.0",
			},
		};
	}
	return {
		"?xml": first?.["?xml"],
		epp: {
			"@_xmlns": (first?.epp as Record<string, unknown>)?.["@_xmlns"],
			"@_xmlns:xsi": (first?.epp as Record<string, unknown>)?.["@_xmlns:xsi"],
			"@_xsi:schemaLocation": (first?.epp as Record<string, unknown>)?.["@_xsi:schemaLocation"],
			response: mergedResponse,
		},
	};
}

/** Optional extended error from EPP result (RFC 5730 extValue). */
export type EppResultExtValue = { value?: string; reason?: string };

/** Extract EPP result code, message, and optional extValue from parsed response. */
function getEppResult(
	parsed: Record<string, unknown>
): { code: string; msg: string; extValue?: EppResultExtValue } {
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
	let extValue: EppResultExtValue | undefined;
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

/**
 * KENIC EPP domain check router.
 * Connects, login, sends domain:check, returns raw and parsed response for type discovery.
 */
export const kenicDomainCheckRouter = router({
	/**
	 * Check availability of one or more .ke domains.
	 * Optionally request pricing via EPP fee extension (RFC 8748); server may return fee:chkData in response.extension.
	 * Input: { domains, withFee?, currency?, periodYears? }.
	 * Returns raw and parsed EPP domain:check response (and fee data when withFee and server supports it).
	 */
	check: publicProcedure
		.input(
			z.object({
				domains: z.array(z.string().min(1)).min(1).max(100),
				/** Include fee extension in check to request create/renew/transfer pricing. */
				withFee: z.boolean().optional().default(false),
				/** Currency for fee query (e.g. "USD", "KES"). Omit for server default. */
				currency: z.string().length(3).optional(),
				/** Registration period in years for fee query. Default 1. */
				periodYears: z.number().int().min(1).max(10).optional().default(1),
				/** Launch phase (RFC 8334): e.g. "sunrise", "landrush", "open", "claims". Omit for current phase. */
				phase: z.string().min(1).optional(),
				/** Launch subphase (RFC 8334): e.g. "landrush", "open". Use with phase. */
				subphase: z.string().min(1).optional(),
				/** Request restore/redemption fee in fee response (RGP). */
				includeRestoreFee: z.boolean().optional().default(false),
			})
		)
		.mutation(async ({ input }) => {
			const validation = validateKenicDomains(input.domains);
			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Only KENIC TLDs are supported. Non-KENIC domains: ${validation.invalidDomains.join(", ")}. Use kenic.tlds.list for supported TLDs.`,
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
				const loginResponseXml = loginResponseBuffer.toString("utf8");
				const loginParsed = parser.parse(loginResponseXml) as Record<string, unknown>;
				const loginResult = getEppResult(loginParsed);
				if (loginResult.code !== "1000") {
					return {
						loginSuccess: false,
						loginResultCode: loginResult.code,
						loginResultMsg: loginResult.msg,
						...(loginResult.extValue && { loginResultExtValue: loginResult.extValue }),
						raw: loginResponseXml,
						parsed: null,
						checkResultCode: null,
						checkResultMsg: null,
					};
				}

				const feeOptions = {
					currency: input.currency,
					periodYears: input.periodYears,
					phase: input.phase,
					subphase: input.subphase,
					includeRestoreFee: input.includeRestoreFee,
				};

				const maxPerCheck = MAX_DOMAINS_PER_EPP_CHECK;
				const chunks: string[][] = [];
				for (let i = 0; i < input.domains.length; i += maxPerCheck) {
					chunks.push(input.domains.slice(i, i + maxPerCheck));
				}

				const allRaws: string[] = [];
				const allParsed: Record<string, unknown>[] = [];
				let lastCode = "1000";
				let lastMsg = "Command completed successfully";

				for (const chunk of chunks) {
					const checkXml = input.withFee
						? buildDomainCheckWithFeeXml(chunk, feeOptions)
						: buildDomainCheckXml(chunk);
					sendFrame(socket, checkXml);
					const checkResponseBuffer = await readFrame(socket);
					const checkResponseXml = checkResponseBuffer.toString("utf8");
					allRaws.push(checkResponseXml);

					let chunkParsed: Record<string, unknown>;
					try {
						chunkParsed = parser.parse(checkResponseXml) as Record<string, unknown>;
					} catch (parseError) {
						sendFrame(socket, buildLogoutXml());
						await readFrame(socket);
						return {
							loginSuccess: true,
							raw: checkResponseXml,
							parsed: null,
							parseError: parseError instanceof Error ? parseError.message : String(parseError),
							checkResultCode: null,
							checkResultMsg: null,
						};
					}

					const chunkResult = getEppResult(chunkParsed);
					lastCode = chunkResult.code;
					lastMsg = chunkResult.msg;
					if (chunkResult.code !== "1000") {
						sendFrame(socket, buildLogoutXml());
						await readFrame(socket);
						return {
							loginSuccess: true,
							raw: checkResponseXml,
							parsed: chunkParsed,
							normalized: null,
							checkResultCode: chunkResult.code,
							checkResultMsg: chunkResult.msg,
							...(chunkResult.extValue && { checkResultExtValue: chunkResult.extValue }),
						};
					}
					allParsed.push(chunkParsed);
				}

				const parsed =
					allParsed.length === 1 ? allParsed[0] : mergeCheckResponses(allParsed);
				const raw = allRaws.length === 1 ? allRaws[0] : allRaws.join("\n\n");

				let normalized: DomainCheckNormalized | null = null;
				if (input.withFee && parsed) {
					try {
						normalized = normalizeDomainCheckResponse(parsed);
					} catch {
						normalized = [];
					}
				}

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				return {
					loginSuccess: true,
					raw,
					parsed,
					normalized,
					checkResultCode: lastCode,
					checkResultMsg: lastMsg,
					...(chunks.length > 1 && { batched: true, batchCount: chunks.length }),
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD must be set for domain check",
					});
				}
				const isTimeout = message.toLowerCase().includes("timeout");
				const isRefused =
					message.toLowerCase().includes("econnrefused") ||
					message.toLowerCase().includes("connection refused");
				throw new TRPCError({
					code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
					message: `EPP domain check failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
