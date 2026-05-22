"use client";

import { ChevronRight, Shield, Settings2, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LINKS = [
  { tab: "security", label: "Security", sub: "Protection & scans", icon: Shield },
  { tab: "site-settings", label: "Site settings", sub: "Speed, debug & downtime", icon: Settings2 },
  { tab: "updates", label: "Updates", sub: "Smart & auto", icon: RefreshCw },
  { tab: "backups", label: "Backups", sub: "Restore points", icon: Database },
] as const;

interface OverviewQuickActionsProps {
  onNavigateToTab?: (tab: string) => void;
  highlights?: {
    vulnerable?: boolean;
    maintenance?: boolean;
    debug?: boolean;
    updatesCount?: number;
  };
}

export function OverviewQuickActions({ onNavigateToTab, highlights }: OverviewQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">Manage site</CardTitle>
        <CardDescription>
          Open a section to change settings. Detailed controls live in each tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const badge =
              link.tab === "security" && highlights?.vulnerable
                ? "Review"
                : link.tab === "site-settings" && highlights?.maintenance
                  ? "Maintenance on"
                  : link.tab === "site-settings" && highlights?.debug
                    ? "Debug on"
                    : link.tab === "updates" && (highlights?.updatesCount ?? 0) > 0
                      ? `${highlights?.updatesCount} updates`
                      : null;

            return (
              <Button
                key={link.tab}
                type="button"
                variant="outline"
                className="h-auto justify-between gap-2 px-3 py-3 text-left"
                onClick={() => onNavigateToTab?.(link.tab)}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{link.label}</span>
                    <span className="block text-xs text-muted-foreground truncate">{link.sub}</span>
                  </span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {badge ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {badge}
                    </Badge>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
