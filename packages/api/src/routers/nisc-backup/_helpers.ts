import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendNiscBackupRequest } from "../../lib/nisc-backup/client";

/** Nisc Backup backup type: Accounts */
export const NISC_BACKUP_BACKUP_TYPE_ACCOUNTS = 1;

/** Nisc Backup contains: full account (all components) */
export const NISC_BACKUP_CONTAINS_FULL_ACCOUNT = 511;

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

export const queueItemSchema = z.object({
  parent_id: z.string(),
  type: z.number(),
  item_id: z.string().optional(),
  username: z.string().optional(),
});

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

export function extractList(data: unknown, keys: string[]): unknown[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const list = record[key];
    if (Array.isArray(list)) return list;
  }
  return [];
}
