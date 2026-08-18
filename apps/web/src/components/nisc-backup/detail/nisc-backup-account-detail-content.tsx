"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { NiscBackupAccountBackupsTab } from "../tabs/account-backups-tab";
import { NiscBackupDownloadsTab } from "../tabs/downloads-tab";
import { NiscBackupAccountDetailsPanel } from "../tabs/account-details-panel";
import { NiscBackupLogsTab } from "../tabs/logs-tab";
import {
  NiscBackupAccountSettingsShell,
  type NiscBackupAccountTab,
} from "./nisc-backup-account-settings-shell";
import { NiscBackupAccountHeader } from "./nisc-backup-account-header";

export interface NiscBackupAccountDetailContentProps {
  accountId: string;
  account: Record<string, unknown>;
  readOnly?: boolean;
  restoreRole?: "admin" | "user";
  backAction?: ReactNode;
  embedded?: boolean;
}

export function NiscBackupAccountDetailContent({
  accountId,
  account,
  readOnly = false,
  restoreRole = "user",
  backAction,
  embedded = false,
}: NiscBackupAccountDetailContentProps) {
  const [activeTab, setActiveTab] = React.useState<NiscBackupAccountTab>("backups");
  const username = String(account.username ?? "");

  return (
    <NiscBackupAccountSettingsShell
      title="Backup account"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      header={<NiscBackupAccountHeader account={account} />}
      backAction={backAction}
      embedded={embedded}
    >
      {activeTab === "backups" && (
        <NiscBackupAccountBackupsTab
          accountId={accountId}
          username={username}
          readOnly={readOnly}
          restoreRole={restoreRole}
        />
      )}
      {activeTab === "downloads" && <NiscBackupDownloadsTab username={username} />}
      {activeTab === "details" && <NiscBackupAccountDetailsPanel account={account} />}
      {activeTab === "activity" && <NiscBackupLogsTab username={username} />}
    </NiscBackupAccountSettingsShell>
  );
}
