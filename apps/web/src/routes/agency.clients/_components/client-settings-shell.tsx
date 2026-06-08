"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const CLIENT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "profile", label: "Profile" },
  { value: "activity", label: "Sessions" },
  { value: "integrations", label: "Integrations" },
  { value: "organizations", label: "Organizations" },
  { value: "invoices", label: "Invoices" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "quotations", label: "Quotations" },
  { value: "transactions", label: "Transactions" },
] as const;

export type ClientTab = (typeof CLIENT_TABS)[number]["value"];

interface ClientSettingsShellProps {
  title: string;
  description?: string;
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  header: ReactNode;
  backAction?: ReactNode;
  children: ReactNode;
}

export function ClientSettingsShell({
  title,
  description = "View and manage client account information",
  activeTab,
  onTabChange,
  header,
  backAction,
  children,
}: ClientSettingsShellProps) {
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
          aria-label="Client details"
          className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:w-44 md:max-h-[min(70vh,520px)] md:flex-col md:overflow-y-auto md:overflow-x-visible"
        >
          {CLIENT_TABS.map((tab) => (
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
