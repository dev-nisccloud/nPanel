import * as React from "react";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { isRestoreConditionEnabled } from "../backup-contains";
import type { NiscBackupRestoreConditionRow } from "../types";

function mapRestoreCondition(raw: Record<string, unknown>): NiscBackupRestoreConditionRow {
  return {
    _id: String(raw._id ?? ""),
    condition: raw.condition ? String(raw.condition) : undefined,
    disabled: raw.disabled as number | boolean | undefined,
  };
}

function normalizeRestoreConditions(data: unknown): NiscBackupRestoreConditionRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.conditions ?? record.items;
  const rows = Array.isArray(list) ? list : [];
  return rows
    .filter((item) => item && typeof item === "object")
    .map((item) => mapRestoreCondition(item as Record<string, unknown>))
    .filter((item) => item._id && item.condition && isRestoreConditionEnabled(item.disabled));
}

export function useNiscBackupRestoreConditions(enabled: boolean) {
  const query = trpc.niscBackup.restoreConditions.list.useQuery(
    {},
    {
      ...niscBackupQueryOptions,
      enabled,
    },
  );

  const conditions = React.useMemo(
    () => normalizeRestoreConditions(query.data),
    [query.data],
  );

  return {
    ...query,
    conditions,
  };
}
