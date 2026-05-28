"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const tabs = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "activities", label: "Sessions" },
] as const;

export type AccountTab = (typeof tabs)[number]["value"];

interface AccountSettingsShellProps {
  title: string;
  description?: string;
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  header: ReactNode;
  children: ReactNode;
}

export function AccountSettingsShell({
  title,
  description = "Manage your profile, security, and active sessions",
  activeTab,
  onTabChange,
  header,
  children,
}: AccountSettingsShellProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {header}

      <div className="flex flex-col gap-5 md:flex-row md:gap-8">
        <nav
          aria-label="Account settings"
          className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:w-44 md:flex-col md:overflow-visible"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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
