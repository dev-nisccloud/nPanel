"use client";

import { Database, RefreshCw, Settings2, Shield, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LINKS = [
  { tab: "security", label: "Security", description: "Protection & scans", icon: Shield },
  {
    tab: "site-settings",
    label: "Site settings",
    description: "Speed, debug & downtime",
    icon: Settings2,
  },
  { tab: "updates", label: "Updates", description: "Plugins & themes", icon: RefreshCw },
  { tab: "backups", label: "Backups", description: "Restore points", icon: Database },
] as const;

interface OverviewQuickActionsProps {
  onNavigateToTab?: (tab: string) => void;
  className?: string;
  highlights?: {
    vulnerable?: boolean;
    maintenance?: boolean;
    debug?: boolean;
    updatesCount?: number;
    pluginUpdates?: number;
    themeUpdates?: number;
  };
}

export function OverviewQuickActions({
  onNavigateToTab,
  className,
  highlights,
}: OverviewQuickActionsProps) {
  return (
    <Card className={cn("overflow-hidden py-0 gap-0", className)}>
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-xs">Jump to common management tasks</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const updatesCount = highlights?.updatesCount ?? 0;
            const updatesDescription =
              updatesCount > 0
                ? `${highlights?.pluginUpdates ?? 0} plugins · ${highlights?.themeUpdates ?? 0} themes`
                : "Up to date";

            const description =
              link.tab === "updates" ? updatesDescription : link.description;

            const badge =
              link.tab === "security" && highlights?.vulnerable
                ? "Review"
                : link.tab === "site-settings" && highlights?.maintenance
                  ? "Maintenance on"
                  : link.tab === "site-settings" && highlights?.debug
                    ? "Debug on"
                    : link.tab === "updates" && updatesCount > 0
                      ? `${updatesCount} updates`
                      : null;

            return (
              <div key={link.tab} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium text-primary">{link.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {badge ? (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {badge}
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    disabled={!onNavigateToTab}
                    onClick={() => onNavigateToTab?.(link.tab)}
                  >
                    View
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
