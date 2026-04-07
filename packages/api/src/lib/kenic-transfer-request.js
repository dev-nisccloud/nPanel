/**
 * Execute KENIC EPP domain transfer request. Shared by kenic.domainTransfer.request
 * and domainTransfer.initiateTransfer (save to DB then call provider).
 */
import { XMLParser } from "fast-xml-parser";
import { TRPCError } from "@trpc/server";
import { createConnection, readFrame, sendFrame } from "./epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildDomainTransferXml } from "./epp/epp-xml";
import { getKenicEppConfig } from "./epp/kenic-config";
import { validateKenicDomains } from "./epp/kenic-tlds";
const parser = new XMLParser({ ignoreAttributes: false });
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
    let extValue;
    const extNode = r.extValue;
    if (extNode && typeof extNode === "object" && !Array.isArray(extNode)) {
        const ext = extNode;
        const toStr = (v) => v === undefined || v === null
            ? undefined
            : typeof v === "string"
                ? v
                : typeof v === "object" && v !== null && "#text" in v
                    ? String(v["#text"])
                    : String(v);
        const value = toStr(ext.value);
        const reason = toStr(ext.reason);
        if (value !== undefined || reason !== undefined) {
            extValue = { value, reason };
        }
    }
    return { code, msg, extValue };
}
function getResData(parsed) {
    const response = parsed?.epp?.response;
    return response?.resData;
}
/**
 * Run KENIC EPP domain transfer (RFC 5731, op="request"). Caller is responsible for
 * creating/updating any DB record (e.g. DomainTransferRequest).
 */
export async function executeKenicTransferRequest(input) {
    const validation = validateKenicDomains([input.name]);
    if (!validation.valid) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only KENIC TLDs are supported. Domain: ${input.name}.`,
            cause: { invalidDomains: "invalidDomains" in validation ? validation.invalidDomains : [] },
        });
    }
    let socket;
    try {
        const config = getKenicEppConfig(true);
        socket = await createConnection(config);
        await readFrame(socket);
        sendFrame(socket, buildLoginXml(config.username, config.password));
        const loginResponseBuffer = await readFrame(socket);
        const loginParsed = parser.parse(loginResponseBuffer.toString("utf8"));
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
        const transferParsed = parser.parse(transferResponseXml);
        const transferResult = getEppResult(transferParsed);
        sendFrame(socket, buildLogoutXml());
        await readFrame(socket);
        if (transferResult.code !== "1000" && transferResult.code !== "1001") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: transferResult.msg,
                cause: transferResult.extValue,
            });
        }
        const resData = getResData(transferParsed);
        const trnData = resData?.["domain:trnData"];
        const name = trnData?.["domain:name"];
        const trStatus = trnData?.["domain:trStatus"];
        const reId = trnData?.["domain:reId"];
        const reDate = trnData?.["domain:reDate"];
        const acId = trnData?.["domain:acId"];
        const acDate = trnData?.["domain:acDate"];
        const exDate = trnData?.["domain:exDate"];
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
    }
    catch (error) {
        if (error instanceof TRPCError)
            throw error;
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required",
            });
        }
        const isTimeout = message.toLowerCase().includes("timeout");
        const isRefused = message.toLowerCase().includes("econnrefused") ||
            message.toLowerCase().includes("connection refused");
        throw new TRPCError({
            code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
            message: `KENIC domain transfer failed: ${message}`,
            cause: error,
        });
    }
    finally {
        socket?.destroy();
    }
}
