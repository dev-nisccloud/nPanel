"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { JetBackupErrorState, JetBackupTableSkeleton, JetBackupToolbar } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import { useJetBackupAccounts } from "../hooks/use-jetbackup-accounts";
import { formatJetBackupDate } from "../formatters";
import { jetbackupSuccessBadgeClass } from "../status-badges";
import type { JetBackupAccountRow } from "../types";

function accountBackupCount(account: JetBackupAccountRow): number | null {
  const stats = account.backup_stats;
  if (!stats) return null;
  const total = stats["511"] ?? stats["127"] ?? Object.values(stats).find((v) => v > 0);
  return typeof total === "number" ? total : null;
}

function accountStatus(account: JetBackupAccountRow): { label: string; active: boolean } {
  if (account.excluded) return { label: "Excluded", active: false };
  if (account.suspended) return { label: "Suspended", active: false };
  if (account.active === false) return { label: "Inactive", active: false };
  return { label: "Active", active: true };
}

export function JetBackupAccountsTab({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const { accounts, isLoading, isError, error, refetch, isRefetching } = useJetBackupAccounts({
    limit: 200,
    search: search || undefined,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((account) =>
      [account.username, account.nickname, account.domain, account.owner, account.owner_nickname]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [accounts, search]);

  if (isLoading) return <JetBackupTableSkeleton rows={6} />;
  if (isError) {
    return (
      <JetBackupErrorState
        title="Failed to load accounts"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <JetBackupToolbar
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      <JetBackupMinimalList emptyMessage="No JetBackup accounts found.">
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
            account.created ? formatJetBackupDate(account.created) : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <JetBackupMinimalRow
              key={account._id}
              compact
              title={account.nickname || account.username}
              subtitle={subtitle}
              meta={meta || undefined}
              badge={status.label}
              badgeVariant={status.active ? "default" : "outline"}
              badgeClassName={jetbackupSuccessBadgeClass(status.active)}
              onClick={() => navigate(`${basePath}/${account._id}`)}
              actions={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
            />
          );
        })}
      </JetBackupMinimalList>
    </div>
  );
}
