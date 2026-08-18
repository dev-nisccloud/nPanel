import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { sortNewestFirst } from "../formatters";
import type { NiscBackupAccountRow } from "../types";

function normalizeAccounts(data: unknown): NiscBackupAccountRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.accounts ?? record.items ?? record.data;
  const rows = Array.isArray(list) ? (list as NiscBackupAccountRow[]) : [];
  return sortNewestFirst(rows, (account) => account.created);
}

export function useNiscBackupAccounts(input?: { limit?: number; search?: string }) {
  const query = trpc.niscBackup.accounts.list.useQuery(
    { limit: input?.limit ?? 200, search: input?.search },
    niscBackupQueryOptions,
  );

  return {
    ...query,
    accounts: normalizeAccounts(query.data),
  };
}
