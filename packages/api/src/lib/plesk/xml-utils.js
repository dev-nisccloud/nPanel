import { TRPCError } from "@trpc/server";
import { XMLParser } from "fast-xml-parser";
import { sendPleskXmlRequest } from "./xml-client";
const parser = new XMLParser({ ignoreAttributes: false });
export function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
export function asArray(value) {
    if (value == null)
        return [];
    return Array.isArray(value) ? value : [value];
}
export function pleskXmlScalar(value) {
    if (value == null)
        return undefined;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value).trim();
    }
    if (typeof value === "object" && value !== null && "#text" in value) {
        const t = value["#text"];
        if (t == null)
            return undefined;
        return String(t).trim();
    }
    return undefined;
}
export function pleskXmlInt(value) {
    const s = pleskXmlScalar(value);
    if (!s)
        return undefined;
    const n = parseInt(s.replace(/\s/g, ""), 10);
    if (Number.isNaN(n))
        return undefined;
    return n;
}
export function parsePleskXml(xml) {
    return parser.parse(xml);
}
export async function sendPleskXmlOrThrow(xmlRequest) {
    if (!process.env.PLESK_XML_ENDPOINT) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
        });
    }
    const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
    if (isHostUnreachable) {
        throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Plesk host is unreachable",
        });
    }
    if (isAuthError) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid Plesk credentials",
        });
    }
    if (!xml || xml.trim() === "") {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Empty response from Plesk server",
        });
    }
    let parsed;
    try {
        parsed = parsePleskXml(xml);
    }
    catch (parseError) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
        });
    }
    const packet = parsed.packet;
    const system = packet?.system;
    if (pleskXmlScalar(system?.status)?.toLowerCase() === "error") {
        const errorCode = pleskXmlScalar(system?.errcode);
        const errorText = pleskXmlScalar(system?.errtext) || "Unknown error";
        if (errorCode === "1010") {
            throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: `Rate limit exceeded: ${errorText}. Please wait before making another request.`,
            });
        }
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plesk API Error ${errorCode}: ${errorText}`,
        });
    }
    return { xml, parsed };
}
export function pleskOperationError(result, fallback) {
    if (!result)
        return { error: fallback, code: "MISSING_RESULT" };
    if (pleskXmlScalar(result.status)?.toLowerCase() !== "error")
        return null;
    return {
        error: pleskXmlScalar(result.errtext) || fallback,
        code: pleskXmlScalar(result.errcode),
    };
}
