import * as React from "react";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { niscBackupDateMs, parseNiscBackupBytes } from "../formatters";
import type { NiscBackupSnapshotRow } from "../types";

export function mapBackupRow(raw: Record<string, unknown>): NiscBackupSnapshotRow {
  return {
    _id: String(raw._id ?? ""),
    parent_id: raw.parent_id ? String(raw.parent_id) : undefined,
    username: raw.account ? String(raw.account) : raw.name ? String(raw.name) : undefined,
    date: (raw.created ?? raw.date) as string | number | undefined,
    backup_contains: parseNiscBackupBytes(raw.backup_contains),
    backup_structure: parseNiscBackupBytes(raw.backup_structure),
    size: parseNiscBackupBytes(raw.size),
    destination_id: raw.destination ? String(raw.destination) : undefined,
    destination_name: raw.destination_name ? String(raw.destination_name) : undefined,
    locked: Boolean(raw.lock),
    damaged: Boolean(raw.damaged),
  };
}

function normalizeSnapshots(data: unknown): NiscBackupSnapshotRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.backups ?? record.items ?? record.snapshots;
  const rows = Array.isArray(list)
    ? list
    : list && typeof list === "object"
      ? Object.values(list as Record<string, unknown>)
      : Object.keys(record).every((key) => /^\d+$/.test(key))
        ? Object.values(record)
        : [];
  return rows
    .filter((item) => item && typeof item === "object")
    .map((item) => mapBackupRow(item as Record<string, unknown>))
    .filter((item) => item._id)
    .sort((a, b) => niscBackupDateMs(b.date) - niscBackupDateMs(a.date));
}

export function useNiscBackupAccountBackups(accountId: string | undefined) {
  const query = trpc.niscBackup.backups.listForAccount.useQuery(
    { account_id: accountId! },
    {
      ...niscBackupQueryOptions,
      enabled: !!accountId,
    },
  );

  const snapshots = React.useMemo(() => normalizeSnapshots(query.data), [query.data]);

  return {
    ...query,
    snapshots,
  };
}
