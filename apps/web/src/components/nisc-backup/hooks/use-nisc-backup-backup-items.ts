import * as React from "react";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { parseNiscBackupBytes } from "../formatters";
import { NISC_BACKUP_CONTAINS } from "../backup-contains";
import type { NiscBackupBackupItemRow } from "../types";

function mapBackupItem(raw: Record<string, unknown>): NiscBackupBackupItemRow {
  return {
    _id: String(raw._id ?? ""),
    parent_id: raw.parent_id ? String(raw.parent_id) : undefined,
    name: raw.name ? String(raw.name) : undefined,
    path: raw.path ? String(raw.path) : undefined,
    backup_contains: parseNiscBackupBytes(raw.backup_contains),
    backup_structure: parseNiscBackupBytes(raw.backup_structure),
    size: parseNiscBackupBytes(raw.size),
  };
}

function normalizeBackupItems(data: unknown): NiscBackupBackupItemRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.items ?? record.backups;
  const rows = Array.isArray(list) ? list : [];
  return rows
    .filter((item) => item && typeof item === "object")
    .map((item) => mapBackupItem(item as Record<string, unknown>))
    .filter((item) => item._id && item.backup_contains !== NISC_BACKUP_CONTAINS.FullAccount);
}

export function useNiscBackupBackupItems(parentId: string | undefined) {
  const query = trpc.niscBackup.backups.getItems.useQuery(
    { _id: parentId! },
    {
      ...niscBackupQueryOptions,
      enabled: !!parentId,
    },
  );

  const items = React.useMemo(() => normalizeBackupItems(query.data), [query.data]);

  return {
    ...query,
    items,
  };
}
