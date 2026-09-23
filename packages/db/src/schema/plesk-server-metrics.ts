import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type PleskDiskDeviceSnapshot = {
  name: string;
  total: number;
  used: number;
  free: number;
};

export type PleskObjectCountsSnapshot = {
  clients: number;
  domains: number;
  activeDomains: number;
  mailBoxes: number;
  databases: number;
};

/**
 * Point-in-time Plesk server resource reading.
 * The XML API only returns the current snapshot, so we persist rows here
 * to build load / memory / disk charts over time.
 */
export const pleskServerMetricSnapshot = pgTable(
  "plesk_server_metric_snapshot",
  {
    id: text("id").primaryKey(),
    /** Distinguishes hosts if more than one Plesk endpoint is added later. */
    hostKey: text("host_key").notNull().default("default"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
    hostname: text("hostname"),
    cpu: text("cpu"),
    uptimeSeconds: doublePrecision("uptime_seconds"),
    insideVz: boolean("inside_vz"),
    pleskVersion: text("plesk_version"),
    pleskOs: text("plesk_os"),
    load1: doublePrecision("load_1"),
    load5: doublePrecision("load_5"),
    load15: doublePrecision("load_15"),
    memTotal: doublePrecision("mem_total"),
    memUsed: doublePrecision("mem_used"),
    memFree: doublePrecision("mem_free"),
    memShared: doublePrecision("mem_shared"),
    memBuffer: doublePrecision("mem_buffer"),
    memCached: doublePrecision("mem_cached"),
    swapTotal: doublePrecision("swap_total"),
    swapUsed: doublePrecision("swap_used"),
    swapFree: doublePrecision("swap_free"),
    diskDevices: jsonb("disk_devices").$type<PleskDiskDeviceSnapshot[]>(),
    objects: jsonb("objects").$type<PleskObjectCountsSnapshot>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("plesk_server_metric_snapshot_capturedAt_idx").on(table.capturedAt),
    index("plesk_server_metric_snapshot_host_captured_idx").on(
      table.hostKey,
      table.capturedAt,
    ),
  ],
);
