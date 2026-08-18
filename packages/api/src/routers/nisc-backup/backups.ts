import { protectedProcedure, router } from "../../trpc";
import { BackupItem, BackupSnapshot, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import {
  extractList,
  niscBackupCall,
  niscBackupCallSafe,
  parseNiscBackupNumber,
  NISC_BACKUP_BACKUP_TYPE_ACCOUNTS,
  NISC_BACKUP_CONTAINS,
  NISC_BACKUP_CONTAINS_FULL_ACCOUNT,
  jetBackupNewestFirst,
  listSchema,
  queueItemSchema,
} from "./_helpers";

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]!);
    }
  }
  await Promise.all(Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  ));
  return results;
}

function asBackupRecord(item: unknown): Record<string, unknown> | null {
  if (!item || typeof item !== "object") return null;
  return item as Record<string, unknown>;
}

function backupParentId(item: Record<string, unknown>): string {
  return String(item.parent_id ?? item._id ?? "");
}

function pickAccountBackup(items: Record<string, unknown>[]): Record<string, unknown> {
  const full = items.find((item) => (
    parseNiscBackupNumber(item.backup_contains) === NISC_BACKUP_CONTAINS.FullAccount
  ));
  return full ?? items[0]!;
}

function backupCreatedMs(item: Record<string, unknown>): number {
  const value = item.created ?? item.date;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function sortAccountBackupsLatestFirst(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...items].sort((a, b) => backupCreatedMs(b) - backupCreatedMs(a));
}

function groupAccountBackups(items: unknown[]): Record<string, unknown>[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    const record = asBackupRecord(item);
    if (!record) continue;
    const parentId = backupParentId(record);
    if (!parentId) continue;
    const group = groups.get(parentId) ?? [];
    group.push(record);
    groups.set(parentId, group);
  }
  return [...groups.values()].map(pickAccountBackup);
}

async function withSnapshotStorageSize(item: Record<string, unknown>): Promise<Record<string, unknown>> {
  const parentId = backupParentId(item);
  const contains = parseNiscBackupNumber(item.backup_contains) ?? 0;
  const listedSize = parseNiscBackupNumber(item.size) ?? 0;
  if (contains === NISC_BACKUP_CONTAINS.FullAccount && listedSize > 0) {
    return { ...item, parent_id: parentId, size: listedSize };
  }

  const result = await niscBackupCallSafe("getBackupItems", { _id: parentId });
  if (!result.success) {
    return { ...item, parent_id: parentId, size: listedSize };
  }
  const children = extractList(result.data, ["backups", "items"]) as Record<string, unknown>[];
  const size = children.reduce((sum, child) => sum + (parseNiscBackupNumber(child.size) ?? 0), 0);
  return { ...item, parent_id: parentId, size: size > 0 ? size : listedSize };
}

const backupListSchema = listSchema.extend({
  type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
  contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
  account_id: z.string().optional(),
  destination_id: z.string().optional(),
});

export const niscBackupBackupsRouter = router({
  list: protectedProcedure
    .input(backupListSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<BackupSnapshot>>(
        "listBackups",
        jetBackupNewestFirst(input, "created"),
      );
    }),

  listForAccount: protectedProcedure
    .input(listSchema.extend({
      account_id: z.string(),
      type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
      contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
      destination_id: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const data = await niscBackupCall("listBackups", jetBackupNewestFirst(input, "created"));
      const snapshots = sortAccountBackupsLatestFirst(
        await mapPool(
          groupAccountBackups(extractList(data, ["backups", "items", "snapshots"])),
          4,
          withSnapshotStorageSize,
        ),
      );
      return { backups: snapshots, total: snapshots.length };
    }),

  listLatestForAccounts: protectedProcedure
    .input(z.object({
      account_id: z.string().optional(),
      username: z.string().optional(),
      type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
      contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
      destination_id: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return niscBackupCall("listBackupForAccounts", input);
    }),

  listForType: protectedProcedure
    .input(z.object({
      type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
      contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
    }))
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<BackupSnapshot>>("listBackupForType", input);
    }),

  listForTypeName: protectedProcedure
    .input(listSchema.extend({
      account_id: z.string(),
      name: z.string(),
      type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
      contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
    }))
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<BackupSnapshot>>("listBackupForTypeName", input);
    }),

  listAccountsByFilters: protectedProcedure
    .input(z.object({
      filter: z.record(z.string(), z.unknown()),
    }))
    .query(async ({ input }) => {
      return niscBackupCall("listAccountsByFilters", input);
    }),

  getItems: protectedProcedure
    .input(z.object({
      _id: z.string().optional(),
      parent_id: z.string().optional(),
    }).refine((value) => Boolean(value._id || value.parent_id), {
      message: "Backup parent id is required",
    }))
    .query(async ({ input }) => {
      const parentId = input._id ?? input.parent_id!;
      const data = await niscBackupCall("getBackupItems", { _id: parentId });
      const items = extractList(data, ["backups", "items"]) as BackupItem[];
      return { items, total: items.length };
    }),

  getItem: protectedProcedure
    .input(z.object({
      _id: z.string(),
      parent_id: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return niscBackupCall<BackupItem>("getBackupItem", { _id: input._id });
    }),

  addQueueItems: protectedProcedure
    .input(z.object({
      items: z.array(queueItemSchema),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("addQueueItems", input);
    }),

  manageLock: protectedProcedure
    .input(z.object({
      _id: z.string(),
      lock: z.number(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageBackupLock", input);
    }),
});
