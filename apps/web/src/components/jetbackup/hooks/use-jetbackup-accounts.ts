import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import type { JetBackupAccountRow } from "../types";

function normalizeAccounts(data: unknown): JetBackupAccountRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.accounts ?? record.items ?? record.data;
  return Array.isArray(list) ? (list as JetBackupAccountRow[]) : [];
}

export function useJetBackupAccounts(input?: { limit?: number; search?: string }) {
  const query = trpc.jetbackup.accounts.list.useQuery(
    { limit: input?.limit ?? 200, search: input?.search },
    jetbackupQueryOptions,
  );

  return {
    ...query,
    accounts: normalizeAccounts(query.data),
  };
}
