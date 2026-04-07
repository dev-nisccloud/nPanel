/**
 * Normalized shapes for KENIC EPP domain check responses.
 * Derived from real fee:chkData and domain:chkData so UI and other callers can use a stable structure.
 */
/** Extract numeric fee and attributes from parsed fee:fee node (fast-xml-parser output). */
function parseFeeNode(feeNode, currency) {
    if (feeNode == null || typeof feeNode !== "object")
        return undefined;
    const n = feeNode;
    const amount = Number(n["#text"] ?? 0);
    if (Number.isNaN(amount))
        return undefined;
    return {
        amount,
        currency,
        description: typeof n["@_description"] === "string" ? n["@_description"] : undefined,
        refundable: n["@_refundable"] === "1" || n["@_refundable"] === true,
        gracePeriod: typeof n["@_grace-period"] === "string" ? n["@_grace-period"] : undefined,
    };
}
/** Find fee command by name in fee:command array. */
function findFeeCommand(commands, name) {
    if (!Array.isArray(commands))
        return commands?.["@_name"] === name ? commands : undefined;
    const cmd = commands.find((c) => c?.["@_name"] === name);
    return cmd ?? undefined;
}
/**
 * Build normalized domain check result from parsed EPP response.
 * Merges resData (availability) and extension fee:chkData (fees) by domain name.
 */
export function normalizeDomainCheckResponse(parsed) {
    const response = parsed?.epp?.response;
    const resData = response?.resData;
    const domainChkData = resData?.["domain:chkData"];
    const domainCdList = domainChkData?.["domain:cd"];
    const domainCds = Array.isArray(domainCdList) ? domainCdList : domainCdList != null ? [domainCdList] : [];
    const extension = response?.extension;
    const feeChkData = extension?.["fee:chkData"];
    const currency = (typeof feeChkData?.["fee:currency"] === "string" ? feeChkData["fee:currency"] : undefined) ?? "";
    const feeCdList = feeChkData?.["fee:cd"];
    const feeCds = Array.isArray(feeCdList) ? feeCdList : feeCdList != null ? [feeCdList] : [];
    const byDomain = new Map();
    for (const cd of domainCds) {
        const item = cd;
        const nameNode = item["domain:name"];
        const domainRaw = typeof nameNode === "string"
            ? nameNode
            : nameNode?.["#text"];
        const domain = typeof domainRaw === "string" ? domainRaw : String(domainRaw ?? "");
        const avail = item["domain:name"]?.["@_avail"];
        const available = avail === "1" || avail === 1;
        const reason = typeof item["domain:reason"] === "string" ? item["domain:reason"] : undefined;
        byDomain.set(domain, {
            domain,
            available,
            reason,
        });
    }
    for (const cd of feeCds) {
        const item = cd;
        const objId = item["fee:objID"];
        const domain = typeof objId === "string" ? objId : String(objId ?? "");
        // Match by case-insensitive domain so fee data merges into domain:cd entry when registry returns different casing (e.g. KENIC).
        const existingKey = Array.from(byDomain.keys()).find((k) => k.toLowerCase() === domain.toLowerCase());
        const existing = existingKey != null ? byDomain.get(existingKey) : undefined;
        const feeClass = typeof item["fee:class"] === "string" ? item["fee:class"] : undefined;
        const commands = item["fee:command"];
        const cmdList = Array.isArray(commands) ? commands : commands != null ? [commands] : [];
        const getFee = (name) => {
            const cmd = findFeeCommand(cmdList, name);
            const feeNode = cmd?.["fee:fee"];
            return parseFeeNode(feeNode, currency);
        };
        const createFee = getFee("create");
        const renewFee = getFee("renew");
        const transferFee = getFee("transfer");
        const restoreFee = getFee("restore");
        if (existing && existingKey !== undefined) {
            byDomain.set(existingKey, {
                ...existing,
                currency: currency || existing.currency,
                feeClass,
                createFee,
                renewFee,
                transferFee,
                restoreFee,
            });
        }
        else {
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
