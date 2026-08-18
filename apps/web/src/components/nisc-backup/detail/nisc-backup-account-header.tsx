"use client";

import { Calendar, HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatNiscBackupDate } from "../formatters";
import { niscBackupSuccessBadgeClass } from "../status-badges";

function accountBackupCount(account: Record<string, unknown>): number | null {
  const stats = account.backup_stats as Record<string, number> | undefined;
  if (!stats) return null;
  const total = stats["511"] ?? Object.values(stats).find((v) => v > 0);
  return typeof total === "number" ? total : null;
}

function accountStatusLabel(account: Record<string, unknown>): { label: string; active: boolean } {
  if (account.excluded) return { label: "Excluded", active: false };
  if (account.suspended) return { label: "Suspended", active: false };
  if (account.active === false) return { label: "Inactive", active: false };
  return { label: "Active", active: true };
}

export function NiscBackupAccountHeader({
  account,
}: {
  account: Record<string, unknown>;
}) {
  const title = String(account.nickname ?? account.username ?? "Account");
  const username = String(account.username ?? "");
  const domain = account.domain ? String(account.domain) : null;
  const owner = account.owner_nickname
    ? String(account.owner_nickname)
    : account.owner
      ? String(account.owner)
      : null;
  const status = accountStatusLabel(account);
  const backups = accountBackupCount(account);
  const created = account.created as string | number | undefined;

  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || username.slice(0, 2).toUpperCase() || "JB";

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <Badge
              variant={status.active ? "default" : "outline"}
              className={niscBackupSuccessBadgeClass(status.active)}
            >
              {status.label}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[username, domain, owner].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <dl className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
        {backups != null ? (
          <div>
            <dt className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              Backups
            </dt>
            <dd className="font-medium">{backups}</dd>
          </div>
        ) : null}
        {created ? (
          <div>
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Created
            </dt>
            <dd className="font-medium whitespace-nowrap">{formatNiscBackupDate(created)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
