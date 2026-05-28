"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SettingsTabOption<T extends string> {
  value: T;
  label: string;
}

interface SettingsPageShellProps<T extends string> {
  title: string;
  description?: string;
  tabs: readonly SettingsTabOption<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  navLabel?: string;
  header?: ReactNode;
  children: ReactNode;
}

export function SettingsPageShell<T extends string>({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  navLabel = "Settings",
  header,
  children,
}: SettingsPageShellProps<T>) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {header}

      <div className="flex flex-col gap-5 md:flex-row md:gap-8">
        <nav
          aria-label={navLabel}
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
