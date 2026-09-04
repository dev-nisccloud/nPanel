import { TRPCError } from "@trpc/server";
import { XMLParser } from "fast-xml-parser";
import { sendPleskXmlRequest } from "./xml-client";

const parser = new XMLParser({ ignoreAttributes: false });

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * fast-xml-parser turns an empty `<packet></packet>` into a string (""),
 * and namespaced XML may use a `*:packet` key. Zod expects an object.
 */
export function normalizePleskPacket(value: unknown): Record<string, unknown> {
  if (value == null || value === "") return {};
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return {};
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function extractPacket(parsed: Record<string, unknown>): unknown {
  if ("packet" in parsed) return parsed.packet;
  const namespaced = Object.keys(parsed).find((key) => key.endsWith(":packet"));
  return namespaced ? parsed[namespaced] : undefined;
}

export function pleskXmlScalar(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object" && value !== null && "#text" in value) {
    const t = (value as { "#text": unknown })["#text"];
    if (t == null) return undefined;
    return String(t).trim();
  }
  return undefined;
}

export function pleskXmlInt(value: unknown): number | undefined {
  const s = pleskXmlScalar(value);
  if (!s) return undefined;
  const n = parseInt(s.replace(/\s/g, ""), 10);
  if (Number.isNaN(n)) return undefined;
  return n;
}

export function parsePleskXml(xml: string): Record<string, unknown> {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  return {
    ...parsed,
    packet: normalizePleskPacket(extractPacket(parsed)),
  };
}

export async function sendPleskXmlOrThrow(xmlRequest: string): Promise<{
  xml: string;
  parsed: Record<string, unknown>;
}> {
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

  let parsed: Record<string, unknown>;
  try {
    parsed = parsePleskXml(xml);
  } catch (parseError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to parse Plesk response",
      cause: parseError,
    });
  }

  const packet = parsed.packet as Record<string, unknown> | undefined;
  const system = packet?.system as Record<string, unknown> | undefined;
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

export function pleskOperationError(
  result: Record<string, unknown> | undefined,
  fallback: string,
): { error: string; code?: string } | null {
  if (!result) return { error: fallback, code: "MISSING_RESULT" };
  if (pleskXmlScalar(result.status)?.toLowerCase() !== "error") return null;
  return {
    error: pleskXmlScalar(result.errtext) || fallback,
    code: pleskXmlScalar(result.errcode),
  };
}
