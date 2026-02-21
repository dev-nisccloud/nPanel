/**
 * Parse EPP response result (RFC 5730). Used by KENIC routers.
 */

export interface EppResultExtValue {
	value?: string;
	reason?: string;
}

export interface EppResult {
	code: string;
	msg: string;
	extValue?: EppResultExtValue;
}

/**
 * Extract EPP result code, message, and optional extValue from parsed response (epp.response.result).
 */
export function getEppResult(parsed: Record<string, unknown>): EppResult {
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

/** Get response resData (epp.response.resData). */
export function getResData(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	return response?.resData as Record<string, unknown> | undefined;
}
