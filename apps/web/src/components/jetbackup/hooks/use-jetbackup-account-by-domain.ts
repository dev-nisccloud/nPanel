import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import type { JetBackupAccountRow } from "../types";

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

function normalizeAccounts(data: unknown): JetBackupAccountRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.accounts ?? record.items ?? record.data;
  return Array.isArray(list) ? (list as JetBackupAccountRow[]) : [];
}

function findAccountByDomain(
  accounts: JetBackupAccountRow[],
  domainName: string,
  username?: string,
): JetBackupAccountRow | undefined {
  const normalizedDomain = normalizeHostname(domainName);

  const byDomain = accounts.find(
    (account) => account.domain && normalizeHostname(String(account.domain)) === normalizedDomain,
  );
  if (byDomain) return byDomain;

  if (username) {
    const normalizedUsername = username.trim().toLowerCase();
    return accounts.find((account) => account.username?.toLowerCase() === normalizedUsername);
  }

  return undefined;
}

export function useJetBackupAccountByDomain({
  domainName,
  username,
  enabled = true,
}: {
  domainName?: string;
  username?: string;
  enabled?: boolean;
}) {
  const trimmedDomain = domainName?.trim() ?? "";
  const shouldFetch = enabled && trimmedDomain.length > 0;

  const listQuery = trpc.jetbackup.accounts.list.useQuery(
    { limit: 50, search: trimmedDomain },
    { ...jetbackupQueryOptions, enabled: shouldFetch },
  );

  const matchedAccount = useMemo(() => {
    if (!shouldFetch || !listQuery.data) return undefined;
    const accounts = normalizeAccounts(listQuery.data);
    return findAccountByDomain(accounts, trimmedDomain, username);
  }, [listQuery.data, shouldFetch, trimmedDomain, username]);

  const accountId = matchedAccount?._id;

  const getQuery = trpc.jetbackup.accounts.get.useQuery(
    { _id: accountId! },
    { ...jetbackupQueryOptions, enabled: shouldFetch && !!accountId },
  );

  const isLoading =
    shouldFetch && (listQuery.isLoading || (!!accountId && getQuery.isLoading));
  const isNotFound = shouldFetch && listQuery.isSuccess && !matchedAccount;

  return {
    account: getQuery.data as Record<string, unknown> | undefined,
    accountId,
    isLoading,
    isError: listQuery.isError || getQuery.isError,
    error: listQuery.error ?? getQuery.error,
    isNotFound,
    isMissingDomain: !trimmedDomain,
    refetch: () => {
      void listQuery.refetch();
      if (accountId) void getQuery.refetch();
    },
    isRefetching: listQuery.isRefetching || getQuery.isRefetching,
  };
}
