import { XMLParser } from "fast-xml-parser";
import type {
  PleskDiskDeviceSnapshot,
  PleskObjectCountsSnapshot,
} from "@npanel/db/schema/plesk-server-metrics";

import { sendPleskXmlRequest } from "./xml-client";

export type PleskServerStatSnapshot = {
  hostname: string | null;
  cpu: string | null;
  uptimeSeconds: number | null;
  insideVz: boolean | null;
  pleskVersion: string | null;
  pleskOs: string | null;
  load1: number | null;
  load5: number | null;
  load15: number | null;
  memTotal: number | null;
  memUsed: number | null;
  memFree: number | null;
  memShared: number | null;
  memBuffer: number | null;
  memCached: number | null;
  swapTotal: number | null;
  swapUsed: number | null;
  swapFree: number | null;
  diskDevices: PleskDiskDeviceSnapshot[];
  objects: PleskObjectCountsSnapshot;
};

function pleskXmlScalar(value: unknown): string | undefined {
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

function toNumber(value: unknown): number | null {
  const raw = pleskXmlScalar(value);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function toCount(value: unknown): number {
  return Math.max(0, toNumber(value) ?? 0);
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseDiskDevices(diskspace: unknown): PleskDiskDeviceSnapshot[] {
  if (!diskspace || typeof diskspace !== "object") return [];
  const devices = asArray(
    (diskspace as { device?: unknown }).device as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined,
  );
  return devices
    .map((device) => ({
      name: pleskXmlScalar(device?.name) || "disk",
      total: toNumber(device?.total) ?? 0,
      used: toNumber(device?.used) ?? 0,
      free: toNumber(device?.free) ?? 0,
    }))
    .filter((device) => device.total > 0 || device.used > 0 || device.free > 0);
}

function parseObjects(objects: unknown): PleskObjectCountsSnapshot {
  const node = objects && typeof objects === "object" ? (objects as Record<string, unknown>) : {};
  return {
    clients: toCount(node.clients),
    domains: toCount(node.domains),
    activeDomains: toCount(node.active_domains),
    mailBoxes: toCount(node.mail_boxes),
    databases: toCount(node.databases),
  };
}

export function parsePleskServerStatXml(xml: string): PleskServerStatSnapshot | null {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    trimValues: true,
  });
  const parsed = parser.parse(xml);
  const result = parsed?.packet?.server?.get?.result;
  const resultNodes = asArray(result).filter(
    (node): node is Record<string, unknown> => Boolean(node) && typeof node === "object",
  );
  if (resultNodes.length === 0) return null;

  const resultNode = resultNodes.reduce<Record<string, unknown>>((merged, node) => {
    const status = pleskXmlScalar(node.status);
    if (status && status.toLowerCase() !== "ok") return merged;
    return { ...merged, ...node };
  }, {});

  const stat = resultNode.stat as Record<string, unknown> | undefined;
  if (!stat || typeof stat !== "object") return null;

  const version = (stat.version ?? {}) as Record<string, unknown>;
  const other = (stat.other ?? {}) as Record<string, unknown>;
  const load = (stat.load_avg ?? {}) as Record<string, unknown>;
  const mem = (stat.mem ?? {}) as Record<string, unknown>;
  const swap = (stat.swap ?? {}) as Record<string, unknown>;
  const genInfo = (resultNode as { gen_info?: Record<string, unknown> }).gen_info ?? {};

  return {
    hostname: pleskXmlScalar(genInfo.server_name) ?? null,
    cpu: pleskXmlScalar(other.cpu) ?? null,
    uptimeSeconds: toNumber(other.uptime),
    insideVz: pleskXmlScalar(other.inside_vz) === "true",
    pleskVersion: pleskXmlScalar(version.plesk_version) ?? null,
    pleskOs: pleskXmlScalar(version.plesk_os) ?? null,
    load1: toNumber(load.l1),
    load5: toNumber(load.l5),
    load15: toNumber(load.l15),
    memTotal: toNumber(mem.total),
    memUsed: toNumber(mem.used),
    memFree: toNumber(mem.free),
    memShared: toNumber(mem.shared),
    memBuffer: toNumber(mem.buffer),
    memCached: toNumber(mem.cached ?? mem.cache),
    swapTotal: toNumber(swap.total),
    swapUsed: toNumber(swap.used),
    swapFree: toNumber(swap.free),
    diskDevices: parseDiskDevices(stat.diskspace),
    objects: parseObjects(stat.objects),
  };
}

const SERVER_STAT_PACKET = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <server>
    <get>
      <gen_info/>
      <stat/>
    </get>
  </server>
</packet>`;

export async function fetchPleskServerStats(): Promise<{
  snapshot: PleskServerStatSnapshot | null;
  unavailable: boolean;
  reason: "unreachable" | "auth" | "empty" | "parse" | null;
}> {
  const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(SERVER_STAT_PACKET);

  if (isHostUnreachable) {
    return { snapshot: null, unavailable: true, reason: "unreachable" };
  }
  if (isAuthError) {
    return { snapshot: null, unavailable: true, reason: "auth" };
  }
  if (!xml?.trim()) {
    return { snapshot: null, unavailable: true, reason: "empty" };
  }

  const snapshot = parsePleskServerStatXml(xml);
  if (!snapshot) {
    return { snapshot: null, unavailable: true, reason: "parse" };
  }

  return { snapshot, unavailable: false, reason: null };
}
