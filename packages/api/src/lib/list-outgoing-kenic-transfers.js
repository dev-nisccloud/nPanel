/**
 * Detect KENIC domains (.ke TLDs) with an active outgoing transfer via EPP domain:info.
 * Used by agency transfer requests list alongside OpenProvider outgoing detection.
 */
import { XMLParser } from "fast-xml-parser";
import { and, eq, inArray, isNotNull } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { createConnection, readFrame, sendFrame } from "./epp/epp-client";
import { buildDomainInfoXml, buildLoginXml, buildLogoutXml } from "./epp/epp-xml";
import { getKenicEppConfig } from "./epp/kenic-config";
import { isKenicDomain } from "./epp/kenic-tlds";
const parser = new XMLParser({ ignoreAttributes: false });
/** Cap EPP info lookups per list refresh to keep response times reasonable. */
const MAX_KENIC_OUTGOING_CHECKS = 50;
function getEppResult(parsed) {
    const response = parsed?.epp?.response;
    const res = Array.isArray(response?.result) ? response?.result[0] : response?.result;
    if (!res || typeof res !== "object") {
        return { code: "0", msg: "Unknown response structure" };
    }
    const r = res;
    const code = String(r["@_code"] ?? "0");
    const msgNode = r.msg;
    const msg = typeof msgNode === "string"
        ? msgNode
        : Array.isArray(msgNode)
            ? String(msgNode[0] ?? "")
            : typeof msgNode === "object" && msgNode !== null && "#text" in msgNode
                ? String(msgNode["#text"])
                : "";
    return { code, msg };
}
function domainHasPendingOutgoingTransfer(parsed) {
    const infoData = parsed?.epp?.response;
    const infData = infoData?.resData;
    const domainInf = infData?.["domain:infData"];
    if (!domainInf)
        return { pending: false, submittedAt: null };
    const statusNode = domainInf["domain:status"];
    const statuses = Array.isArray(statusNode)
        ? statusNode
        : statusNode
            ? [statusNode]
            : [];
    const pending = statuses.some((entry) => {
        if (!entry || typeof entry !== "object")
            return false;
        const status = String(entry["@_s"] ?? "").toLowerCase();
        return status === "pendingtransfer";
    });
    if (!pending)
        return { pending: false, submittedAt: null };
    const upDateRaw = domainInf["domain:upDate"];
    const trDateRaw = domainInf["domain:trDate"];
    const dateRaw = (typeof upDateRaw === "string" && upDateRaw) ||
        (typeof trDateRaw === "string" && trDateRaw) ||
        null;
    const submittedAt = dateRaw ? new Date(dateRaw) : new Date();
    return {
        pending: true,
        submittedAt: Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt,
    };
}
export async function listOutgoingKenicTransfers() {
    if (!process.env.KENIC_EPP_USERNAME?.trim() || !process.env.KENIC_EPP_PASSWORD?.trim()) {
        return [];
    }
    try {
        const rows = await db
            .select({ primaryDomain: niscClientSubscription.primaryDomain })
            .from(niscClientSubscription)
            .where(and(isNotNull(niscClientSubscription.primaryDomain), inArray(niscClientSubscription.status, ["ACTIVE", "PROCESSING", "PENDING"])));
        const domainNames = [
            ...new Set(rows
                .map((row) => row.primaryDomain?.trim().toLowerCase())
                .filter((name) => Boolean(name) && isKenicDomain(name))),
        ].slice(0, MAX_KENIC_OUTGOING_CHECKS);
        if (domainNames.length === 0)
            return [];
        let socket;
        try {
            const config = getKenicEppConfig(true);
            socket = await createConnection(config);
            await readFrame(socket);
            sendFrame(socket, buildLoginXml(config.username, config.password));
            const loginParsed = parser.parse((await readFrame(socket)).toString("utf8"));
            const loginResult = getEppResult(loginParsed);
            if (loginResult.code !== "1000") {
                console.error("[domainTransfer.listTransferRequests] KENIC EPP login failed:", loginResult.msg);
                return [];
            }
            const outgoing = [];
            for (const domainName of domainNames) {
                sendFrame(socket, buildDomainInfoXml(domainName));
                const infoParsed = parser.parse((await readFrame(socket)).toString("utf8"));
                const infoResult = getEppResult(infoParsed);
                if (infoResult.code !== "1000")
                    continue;
                const { pending, submittedAt } = domainHasPendingOutgoingTransfer(infoParsed);
                if (!pending || !submittedAt)
                    continue;
                outgoing.push({ domainName, submittedAt });
            }
            sendFrame(socket, buildLogoutXml());
            await readFrame(socket);
            return outgoing;
        }
        finally {
            socket?.destroy();
        }
    }
    catch (error) {
        console.error("[domainTransfer.listTransferRequests] outgoing KENIC fetch failed:", error);
        return [];
    }
}
