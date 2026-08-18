"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/account-settings/settings-section";
import { formatNiscBackupDate } from "../formatters";
import { niscBackupSuccessBadgeClass } from "../status-badges";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value}</span>
    </div>
  );
}

export function NiscBackupAccountDetailsPanel({
  account,
}: {
  account: Record<string, unknown>;
}) {
  const included = !account.excluded;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Account"
        description="Nisc Backup identity and hosting metadata for this backup account."
      >
        <div className="space-y-3 rounded-xl border bg-card px-4 py-3.5">
          <DetailRow label="Display name" value={String(account.nickname ?? account.username ?? "-")} />
          <DetailRow label="Username" value={String(account.username ?? "-")} />
          <DetailRow label="Domain" value={String(account.domain ?? "-")} />
          <DetailRow
            label="Owner"
            value={String(account.owner_nickname ?? account.owner ?? "-")}
          />
          <DetailRow
            label="Created"
            value={formatNiscBackupDate(account.created as string | number | undefined)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Backup policy"
        description="Whether scheduled backups include this account."
      >
        <div className="space-y-3 rounded-xl border bg-card px-4 py-3.5">
          <DetailRow
            label="Backup status"
            value={
              <Badge
                variant={included ? "default" : "outline"}
                className={niscBackupSuccessBadgeClass(included)}
              >
                {included ? "Included in backups" : "Excluded from backups"}
              </Badge>
            }
          />
          {account.backup_job ? (
            <DetailRow label="Backup job" value={String(account.backup_job)} />
          ) : null}
        </div>
      </SettingsSection>
    </div>
  );
}
