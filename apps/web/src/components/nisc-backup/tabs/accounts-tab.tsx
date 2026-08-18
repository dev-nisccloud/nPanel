"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { NiscBackupErrorState, NiscBackupTableSkeleton, NiscBackupToolbar } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";
import { useNiscBackupAccounts } from "../hooks/use-nisc-backup-accounts";
import { formatNiscBackupDate } from "../formatters";
import { niscBackupSuccessBadgeClass } from "../status-badges";
import type { NiscBackupAccountRow } from "../types";

function accountBackupCount(account: NiscBackupAccountRow): number | null {
  const stats = account.backup_stats;
  if (!stats) return null;
  const total = stats["511"] ?? Object.values(stats).find((v) => v > 0);
  return typeof total === "number" ? total : null;
}

function accountStatus(account: NiscBackupAccountRow): { label: string; active: boolean } {
  if (account.excluded) return { label: "Excluded", active: false };
  if (account.suspended) return { label: "Suspended", active: false };
  if (account.active === false) return { label: "Inactive", active: false };
  return { label: "Active", active: true };
}

export function NiscBackupAccountsTab({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const { accounts, isLoading, isError, error, refetch, isRefetching } = useNiscBackupAccounts({
    limit: 200,
    search: appliedSearch || undefined,
  });

  const filtered = React.useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((account) =>
      [account.username, account.nickname, account.domain, account.owner, account.owner_nickname]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [accounts, appliedSearch]);

  if (isLoading) return <NiscBackupTableSkeleton rows={6} />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load accounts"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <NiscBackupToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => setAppliedSearch(searchInput.trim())}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      <NiscBackupMinimalList emptyMessage="No Nisc Backup accounts found.">
        {filtered.map((account) => {
          const status = accountStatus(account);
          const backups = accountBackupCount(account);
          const subtitle = [
            account.username,
            account.domain,
            account.owner_nickname ?? account.owner,
          ]
            .filter(Boolean)
            .join(" · ");
          const meta = [
            backups != null ? `${backups} backups` : null,
            account.created ? formatNiscBackupDate(account.created) : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <NiscBackupMinimalRow
              key={account._id}
              compact
              title={account.nickname || account.username}
              subtitle={subtitle}
              meta={meta || undefined}
              badge={status.label}
              badgeVariant={status.active ? "default" : "outline"}
              badgeClassName={niscBackupSuccessBadgeClass(status.active)}
              onClick={() => navigate(`${basePath}/${account._id}`)}
              actions={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
            />
          );
        })}
      </NiscBackupMinimalList>
    </div>
  );
}
