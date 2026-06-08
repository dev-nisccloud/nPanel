import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import type { JetBackupSnapshotRow } from "../types";

function mapBackupRow(raw: Record<string, unknown>): JetBackupSnapshotRow {
  return {
    _id: String(raw._id ?? ""),
    parent_id: raw.parent_id ? String(raw.parent_id) : undefined,
    username: raw.account ? String(raw.account) : raw.name ? String(raw.name) : undefined,
    date: (raw.created ?? raw.date) as string | number | undefined,
    size: typeof raw.size === "number" ? raw.size : undefined,
    destination_id: raw.destination ? String(raw.destination) : undefined,
    destination_name: raw.destination_name ? String(raw.destination_name) : undefined,
    locked: Boolean(raw.lock),
    damaged: Boolean(raw.damaged),
  };
}

function normalizeSnapshots(data: unknown): JetBackupSnapshotRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.backups ?? record.items ?? record.snapshots;
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === "object")
    .map((item) => mapBackupRow(item as Record<string, unknown>));
}

export function useJetBackupAccountBackups(accountId: string | undefined) {
  const query = trpc.jetbackup.backups.listForAccount.useQuery(
    { account_id: accountId! },
    {
      ...jetbackupQueryOptions,
      enabled: !!accountId,
    },
  );

  return {
    ...query,
    snapshots: normalizeSnapshots(query.data),
  };
}
