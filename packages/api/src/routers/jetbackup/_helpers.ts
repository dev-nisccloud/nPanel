import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";

/** JetBackup 5.3 backup type: Accounts */
export const JETBACKUP_BACKUP_TYPE_ACCOUNTS = 1;

/** JetBackup 5.3 contains: full account (all components) */
export const JETBACKUP_CONTAINS_FULL_ACCOUNT = 511;

/** JetBackup queue group type: restore */
export const JETBACKUP_QUEUE_TYPE_RESTORE = 2;

/** JetBackup queue group type: download */
export const JETBACKUP_QUEUE_TYPE_DOWNLOAD = 4;

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

export async function jetbackupCall<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const result = await sendJetBackupRequest<T>(functionName, params);
  if (!result.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.message || `JetBackup ${functionName} failed`,
    });
  }
  return result.data as T;
}

export async function jetbackupCallSafe<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
) {
  return sendJetBackupRequest<T>(functionName, params);
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
