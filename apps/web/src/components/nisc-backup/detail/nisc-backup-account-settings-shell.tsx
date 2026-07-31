"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const NISC_BACKUP_ACCOUNT_TABS = [
  { value: "backups", label: "Backups" },
  { value: "downloads", label: "Downloads" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
] as const;

export type NiscBackupAccountTab = (typeof NISC_BACKUP_ACCOUNT_TABS)[number]["value"];

interface NiscBackupAccountSettingsShellProps {
  title: string;
  description?: string;
  activeTab: NiscBackupAccountTab;
  onTabChange: (tab: NiscBackupAccountTab) => void;
  header: ReactNode;
  backAction?: ReactNode;
  children: ReactNode;
}

export function NiscBackupAccountSettingsShell({
  title,
  description = "View backups, restore snapshots, and review activity for this hosting account.",
  activeTab,
  onTabChange,
  header,
  backAction,
  children,
}: NiscBackupAccountSettingsShellProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {backAction}

      <div className="space-y-1">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {header}

      <div className="flex flex-col gap-5 md:flex-row md:gap-8">
        <nav
          aria-label="Backup account"
          className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:w-44 md:flex-col md:overflow-visible"
        >
          {NISC_BACKUP_ACCOUNT_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
