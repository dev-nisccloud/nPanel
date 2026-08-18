import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendNiscBackupRequest } from "../../lib/nisc-backup/client";

/** JetBackup 5 backup type: Accounts */
export const NISC_BACKUP_BACKUP_TYPE_ACCOUNTS = 1;

/** JetBackup 5 contains flags (binary). Full account = 511. */
export const NISC_BACKUP_CONTAINS = {
  PanelConfig: 1,
  Homedir: 2,
  Databases: 4,
  Emails: 8,
  CronJobs: 16,
  DnsZones: 32,
  SslCertificates: 64,
  DatabaseUsers: 128,
  FtpAccounts: 256,
  FullAccount: 511,
} as const;

/** JetBackup 5 contains: full account (all components) */
export const NISC_BACKUP_CONTAINS_FULL_ACCOUNT = NISC_BACKUP_CONTAINS.FullAccount;

/** NiscBackup queue group type: restore */
export const NISC_BACKUP_QUEUE_TYPE_RESTORE = 2;

/** NiscBackup queue group type: download */
export const NISC_BACKUP_QUEUE_TYPE_DOWNLOAD = 4;

export const listSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  orderby: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const idSchema = z.object({ _id: z.string() });

export const restoreQueueOptionsSchema = z.object({
  merge: z.boolean().optional(),
  terminate: z.boolean().optional(),
  suspend: z.boolean().optional(),
});

export const queueItemSchema = z.object({
  parent_id: z.string(),
  type: z.number(),
  item_id: z.string().optional(),
  username: z.string().optional(),
});

export function buildAddQueueItemsParams(input: {
  type: number;
  snapshot_id?: string;
  items?: string[];
  merge?: boolean;
  terminate?: boolean;
  suspend?: boolean;
}): Record<string, unknown> {
  const params: Record<string, unknown> = { type: input.type };
  if (input.snapshot_id) {
    params.snapshot_id = input.snapshot_id;
  }
  if (input.items && input.items.length > 0) {
    params.items = input.items;
  }
  const options: Record<string, number> = {};
  if (input.merge != null) options.merge = input.merge ? 1 : 0;
  if (input.terminate != null) options.terminate = input.terminate ? 1 : 0;
  if (input.suspend != null) options.suspend = input.suspend ? 1 : 0;
  if (Object.keys(options).length > 0) {
    params.options = options;
  }
  return params;
}

export async function niscBackupCall<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const result = await sendNiscBackupRequest<T>(functionName, params);
  if (!result.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.message || `NiscBackup ${functionName} failed`,
    });
  }
  return result.data as T;
}

export async function niscBackupCallSafe<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
) {
  return sendNiscBackupRequest<T>(functionName, params);
}

function numericKeyedValues(record: Record<string, unknown>): unknown[] {
  const entries = Object.entries(record)
    .filter(([key, value]) => /^\d+$/.test(key) && value != null && typeof value === "object")
    .sort(([a], [b]) => Number(a) - Number(b));
  return entries.map(([, value]) => value);
}

export function niscBackupDateMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => unknown): T[] {
  return [...items].sort(
    (a, b) => niscBackupDateMs(getDate(b)) - niscBackupDateMs(getDate(a)),
  );
}

/** JetBackup 5 list sort: 1 = oldest first, -1 = newest first. */
export function jetBackupNewestFirst(
  input: { orderby?: string; order?: "asc" | "desc" } & Record<string, unknown>,
  defaultField: string,
): Record<string, unknown> {
  const { orderby, order, ...rest } = input;
  const field = typeof orderby === "string" && orderby ? orderby : defaultField;
  return {
    ...rest,
    sort: { [field]: order === "asc" ? 1 : -1 },
  };
}

export function parseNiscBackupNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

/** JetBackup booleans are 1/0; empty YAML fields often arrive as false, null, or "". */
export function isJetBackupFlagOn(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function extractList(data: unknown, keys: string[] = []): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const list = record[key];
    if (Array.isArray(list)) return list;
    if (list && typeof list === "object") {
      const nested = numericKeyedValues(list as Record<string, unknown>);
      if (nested.length > 0) return nested;
    }
  }
  return numericKeyedValues(record);
}
