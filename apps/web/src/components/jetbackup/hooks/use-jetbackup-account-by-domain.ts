import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import type { JetBackupAccountRow } from "../types";
import {
  buildJetBackupHostingSearchTerms,
  findJetBackupAccountForHosting,
} from "../hosting-account-lookup";

function normalizeAccounts(data: unknown): JetBackupAccountRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.accounts ?? record.items ?? record.data;
  return Array.isArray(list) ? (list as JetBackupAccountRow[]) : [];
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

  const searchTerms = useMemo(
    () => buildJetBackupHostingSearchTerms(trimmedDomain, username),
    [trimmedDomain, username],
  );

  const listQueries = trpc.useQueries((t) =>
    searchTerms.map((search) =>
      t.jetbackup.accounts.list(
        { limit: 200, search },
        { ...jetbackupQueryOptions, enabled: shouldFetch },
      ),
    ),
  );

  const matchedAccount = useMemo(() => {
    if (!shouldFetch) return undefined;

    const merged = new Map<string, JetBackupAccountRow>();
    for (const query of listQueries) {
      for (const account of normalizeAccounts(query.data)) {
        merged.set(account._id, account);
      }
    }

    return findJetBackupAccountForHosting(
      [...merged.values()],
      trimmedDomain,
      username,
    );
  }, [listQueries, shouldFetch, trimmedDomain, username]);

  const accountId = matchedAccount?._id;

  const getQuery = trpc.jetbackup.accounts.get.useQuery(
    { _id: accountId! },
    { ...jetbackupQueryOptions, enabled: shouldFetch && !!accountId },
  );

  const isListLoading = listQueries.some((query) => query.isLoading);
  const isListError = listQueries.every((query) => query.isError);
  const listError = listQueries.find((query) => query.error)?.error;

  const isLoading =
    shouldFetch && (isListLoading || (!!accountId && getQuery.isLoading));
  const isNotFound =
    shouldFetch &&
    listQueries.every((query) => query.isSuccess) &&
    !matchedAccount;

  return {
    account: getQuery.data as Record<string, unknown> | undefined,
    accountId,
    isLoading,
    isError: isListError || getQuery.isError,
    error: listError ?? getQuery.error,
    isNotFound,
    isMissingDomain: !trimmedDomain,
    refetch: () => {
      for (const query of listQueries) void query.refetch();
      if (accountId) void getQuery.refetch();
    },
    isRefetching:
      listQueries.some((query) => query.isRefetching) || getQuery.isRefetching,
  };
}
