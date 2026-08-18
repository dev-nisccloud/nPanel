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
  /** Hosting detail already has a page header; skip the extra title and identity card. */
  embedded?: boolean;
  children: ReactNode;
}

export function NiscBackupAccountSettingsShell({
  title,
  description = "View backups, restore snapshots, and review activity for this hosting account.",
  activeTab,
  onTabChange,
  header,
  backAction,
  embedded = false,
  children,
}: NiscBackupAccountSettingsShellProps) {
  return (
    <div className={cn("w-full space-y-5", !embedded && "mx-auto max-w-6xl")}>
      {backAction}

      {!embedded ? (
        <>
          <div className="space-y-1">
            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {header}
        </>
      ) : null}

      <nav
        aria-label="Backup account"
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1"
      >
        {NISC_BACKUP_ACCOUNT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
