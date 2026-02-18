/**
 * Normalized shapes for KENIC EPP domain check responses.
 * Derived from real fee:chkData and domain:chkData so UI and other callers can use a stable structure.
 */

/** Fee for one operation (create/renew/transfer/restore). */
export interface DomainCheckFeeItem {
	description?: string;
	amount: number;
	currency: string;
	refundable?: boolean;
	gracePeriod?: string;
}

/** One domain in the normalized check result. */
export interface DomainCheckResultItem {
	domain: string;
	available: boolean;
	/** Present when available is false (e.g. "The domain exists"). */
	reason?: string;
	/** Set when withFee was true and server returned fee data. */
	currency?: string;
	/** Fee class from registry (e.g. "standard", "premium"). */
	feeClass?: string;
	createFee?: DomainCheckFeeItem;
	renewFee?: DomainCheckFeeItem;
	transferFee?: DomainCheckFeeItem;
	restoreFee?: DomainCheckFeeItem;
}

/** Normalized domain check response (array of domains with availability and optional fees). */
export type DomainCheckNormalized = DomainCheckResultItem[];

/** Extract numeric fee and attributes from parsed fee:fee node (fast-xml-parser output). */
function parseFeeNode(
	feeNode: unknown,
	currency: string
): DomainCheckFeeItem | undefined {
	if (feeNode == null || typeof feeNode !== "object") return undefined;
	const n = feeNode as Record<string, unknown>;
	const amount = Number(n["#text"] ?? 0);
	if (Number.isNaN(amount)) return undefined;
	return {
		amount,
		currency,
		description: typeof n["@_description"] === "string" ? n["@_description"] : undefined,
		refundable: n["@_refundable"] === "1" || n["@_refundable"] === true,
		gracePeriod: typeof n["@_grace-period"] === "string" ? n["@_grace-period"] : undefined,
	};
}

/** Find fee command by name in fee:command array. */
function findFeeCommand(commands: unknown, name: string): unknown {
	if (!Array.isArray(commands)) return (commands as Record<string, unknown>)?.["@_name"] === name ? commands : undefined;
	const cmd = commands.find((c) => (c as Record<string, unknown>)?.["@_name"] === name);
	return cmd ?? undefined;
}

/**
 * Build normalized domain check result from parsed EPP response.
 * Merges resData (availability) and extension fee:chkData (fees) by domain name.
 */
export function normalizeDomainCheckResponse(
	parsed: Record<string, unknown>
): DomainCheckNormalized {
	const response = (parsed?.epp as Record<string, unknown>)?.response as Record<string, unknown> | undefined;
	const resData = response?.resData as Record<string, unknown> | undefined;
	const domainChkData = resData?.["domain:chkData"] as Record<string, unknown> | undefined;
	const domainCdList = domainChkData?.["domain:cd"];
	const domainCds = Array.isArray(domainCdList) ? domainCdList : domainCdList != null ? [domainCdList] : [];

	const extension = response?.extension as Record<string, unknown> | undefined;
	const feeChkData = extension?.["fee:chkData"] as Record<string, unknown> | undefined;
	const currency = (typeof feeChkData?.["fee:currency"] === "string" ? feeChkData["fee:currency"] : undefined) ?? "";
	const feeCdList = feeChkData?.["fee:cd"];
	const feeCds = Array.isArray(feeCdList) ? feeCdList : feeCdList != null ? [feeCdList] : [];

	const byDomain = new Map<string, DomainCheckResultItem>();

	for (const cd of domainCds) {
		const item = cd as Record<string, unknown>;
		const nameNode = item["domain:name"];
		const domainRaw =
			typeof nameNode === "string"
				? nameNode
				: (nameNode as Record<string, unknown>)?.["#text"];
		const domain = typeof domainRaw === "string" ? domainRaw : String(domainRaw ?? "");
		const avail = (item["domain:name"] as Record<string, unknown>)?.["@_avail"];
		const available = avail === "1" || avail === 1;
		const reason = typeof item["domain:reason"] === "string" ? item["domain:reason"] : undefined;
		byDomain.set(domain, {
			domain,
			available,
			reason,
		});
	}

	for (const cd of feeCds) {
		const item = cd as Record<string, unknown>;
		const objId = item["fee:objID"];
		const domain = typeof objId === "string" ? objId : String(objId ?? "");
		const existing = byDomain.get(domain);
		const feeClass = typeof item["fee:class"] === "string" ? item["fee:class"] : undefined;
		const commands = item["fee:command"];
		const cmdList = Array.isArray(commands) ? commands : commands != null ? [commands] : [];

		const getFee = (name: string) => {
			const cmd = findFeeCommand(cmdList, name) as Record<string, unknown> | undefined;
			const feeNode = cmd?.["fee:fee"];
			return parseFeeNode(feeNode, currency);
		};

		const createFee = getFee("create");
		const renewFee = getFee("renew");
		const transferFee = getFee("transfer");
		const restoreFee = getFee("restore");

		if (existing) {
			byDomain.set(domain, {
				...existing,
				currency: currency || existing.currency,
				feeClass,
				createFee,
				renewFee,
				transferFee,
				restoreFee,
			});
		} else {
			byDomain.set(domain, {
				domain,
				available: false,
				currency: currency || undefined,
				feeClass,
				createFee,
				renewFee,
				transferFee,
				restoreFee,
			});
		}
	}

	return Array.from(byDomain.values());
}
