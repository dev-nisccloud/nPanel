"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { JetBackupAccountBackupsTab } from "../tabs/account-backups-tab";
import { JetBackupDownloadsTab } from "../tabs/downloads-tab";
import { JetBackupAccountDetailsPanel } from "../tabs/account-details-panel";
import { JetBackupLogsTab } from "../tabs/logs-tab";
import {
  JetBackupAccountSettingsShell,
  type JetBackupAccountTab,
} from "./jetbackup-account-settings-shell";
import { JetBackupAccountHeader } from "./jetbackup-account-header";

export interface JetBackupAccountDetailContentProps {
  accountId: string;
  account: Record<string, unknown>;
  readOnly?: boolean;
  backAction?: ReactNode;
}

export function JetBackupAccountDetailContent({
  accountId,
  account,
  readOnly = false,
  backAction,
}: JetBackupAccountDetailContentProps) {
  const [activeTab, setActiveTab] = React.useState<JetBackupAccountTab>("backups");
  const username = String(account.username ?? "");

  return (
    <JetBackupAccountSettingsShell
      title="Backup account"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      header={<JetBackupAccountHeader account={account} />}
      backAction={backAction}
    >
      {activeTab === "backups" && (
        <JetBackupAccountBackupsTab
          accountId={accountId}
          username={username}
          readOnly={readOnly}
        />
      )}
      {activeTab === "downloads" && <JetBackupDownloadsTab username={username} />}
      {activeTab === "details" && <JetBackupAccountDetailsPanel account={account} />}
      {activeTab === "activity" && <JetBackupLogsTab username={username} />}
    </JetBackupAccountSettingsShell>
  );
}
