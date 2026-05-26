"use client";

import { ChevronRight, Shield, Settings2, RefreshCw, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WpSection } from "@/components/wordpress/wp-detail-primitives";

const LINKS = [
  { tab: "security", label: "Security", sub: "Protection & scans", icon: Shield },
  { tab: "site-settings", label: "Site settings", sub: "Speed, debug & downtime", icon: Settings2 },
  { tab: "updates", label: "Updates", sub: "Smart & auto", icon: RefreshCw },
  { tab: "backups", label: "Backups", sub: "Restore points", icon: Database },
] as const;

interface OverviewQuickActionsProps {
  onNavigateToTab?: (tab: string) => void;
  className?: string;
  highlights?: {
    vulnerable?: boolean;
    maintenance?: boolean;
    debug?: boolean;
    updatesCount?: number;
  };
}

export function OverviewQuickActions({ onNavigateToTab, className, highlights }: OverviewQuickActionsProps) {
  return (
    <WpSection
      title="Manage site"
      description="Jump to a settings section"
      className={className}
    >
      <div className="grid grid-cols-1 gap-2 @sm/main:grid-cols-2 @3xl/main:grid-cols-4">
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
              size="sm"
              className="h-auto justify-between gap-2 px-3 py-2 text-left"
              onClick={() => onNavigateToTab?.(link.tab)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-none">{link.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{link.sub}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {badge ? (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {badge}
                  </Badge>
                ) : null}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </Button>
          );
        })}
      </div>
    </WpSection>
  );
}
