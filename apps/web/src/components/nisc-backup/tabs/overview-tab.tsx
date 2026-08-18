"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  HardDrive,
  ListOrdered,
  ScrollText,
  Server,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatAlertLevel,
  formatBytes,
  formatNiscBackupDate,
  isJetBackupFlagOn,
  parseNiscBackupBytes,
  sortNewestFirst,
} from "../formatters";
import { NiscBackupErrorState } from "../primitives";
import { useNiscBackupDashboard } from "../hooks/use-nisc-backup-dashboard";
import {
  niscBackupAlertLevelClass,
  niscBackupSuccessBadgeClass,
} from "../status-badges";
import type { NiscBackupAlertRow, NiscBackupDestinationRow } from "../types";

export type NiscBackupPageTab =
  | "overview"
  | "accounts"
  | "jobs"
  | "queue"
  | "downloads"
  | "alerts"
  | "logs";

const QUICK_ACTIONS: Array<{
  tab: Exclude<NiscBackupPageTab, "overview">;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { tab: "accounts", label: "Accounts", description: "Backup accounts", icon: Users },
  { tab: "jobs", label: "Jobs", description: "Backup jobs", icon: HardDrive },
  { tab: "queue", label: "Queue", description: "Backup operations", icon: ListOrdered },
  { tab: "downloads", label: "Downloads", description: "Save archives", icon: Download },
  { tab: "alerts", label: "Alerts", description: "Notifications", icon: AlertTriangle },
  { tab: "logs", label: "Logs", description: "Recent activity", icon: ScrollText },
];

type UsageTone = "ok" | "warn" | "critical" | "neutral";

function usageStroke(tone: UsageTone) {
  switch (tone) {
    case "critical":
      return "stroke-red-500";
    case "warn":
      return "stroke-amber-500";
    case "ok":
      return "stroke-emerald-500";
    default:
      return "stroke-muted-foreground/30";
  }
}

function usageText(tone: UsageTone) {
  switch (tone) {
    case "critical":
      return "text-red-600 dark:text-red-400";
    case "warn":
      return "text-amber-600 dark:text-amber-400";
    case "ok":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-muted-foreground";
  }
}

function UsageRing({
  percentage,
  tone,
  icon,
}: {
  percentage: number | null;
  tone: UsageTone;
  icon: React.ReactNode;
}) {
  const size = 56;
  const stroke = 9;
  const view = 100;
  const center = 50;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = percentage ?? 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${view} ${view}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={usageStroke(tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={percentage === null ? circumference : offset}
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center", usageText(tone))}>
        {icon}
      </div>
    </div>
  );
}

function LimitCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-primary">{value}</p>
    </div>
  );
}

function OverviewCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function PairRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
      {children}
    </div>
  );
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    return Object.values(value).filter((item) => item && typeof item === "object") as T[];
  }
  return [];
}

function pickBytes(record: Record<string, unknown> | null | undefined, keys: string[]): number | undefined {
  if (!record) return undefined;
  const lower = new Map(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  );
  for (const key of keys) {
    const parsed = parseNiscBackupBytes(lower.get(key.toLowerCase()));
    if (parsed != null) return parsed;
  }
  return undefined;
}

function usageRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const hasUsageField = Object.keys(record).some((key) =>
    ["usage", "used", "free", "total"].includes(key.toLowerCase()),
  );
  return hasUsageField ? record : null;
}

function destinationStorage(
  destination: NiscBackupDestinationRow,
  fallbackUsed?: number,
) {
  const dest = destination as Record<string, unknown>;
  const nested = usageRecord(dest.disk_usage);
  const used =
    pickBytes(nested, ["usage", "used"])
    ?? pickBytes(dest, ["usage", "used"])
    ?? parseNiscBackupBytes(dest.disk_usage)
    ?? fallbackUsed;
  const free = pickBytes(nested, ["free"]) ?? pickBytes(dest, ["free"]);
  const total =
    pickBytes(nested, ["total"])
    ?? pickBytes(dest, ["total"])
    ?? (used != null && free != null ? used + free : undefined);

  return { used, free, total };
}

function normalizeDestinations(data: unknown): NiscBackupDestinationRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const nested = record.destinations as Record<string, unknown> | unknown[] | undefined;
  const list = nested && typeof nested === "object" && !Array.isArray(nested) && "destinations" in nested
    ? asList<NiscBackupDestinationRow>(nested.destinations)
    : asList<NiscBackupDestinationRow>(record.destinations ?? record.items);
  return list.filter((item) => Boolean(item._id || item.name));
}

function normalizeAlerts(data: unknown): NiscBackupAlertRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const nested = record.alerts as Record<string, unknown> | unknown[] | undefined;
  const list = nested && typeof nested === "object" && !Array.isArray(nested) && "alerts" in nested
    ? nested.alerts
    : nested;
  return sortNewestFirst(
    asList<NiscBackupAlertRow>(list).filter((alert) => alert._id),
    (alert) => alert.created,
  );
}

function usagePercent(used: number | undefined, total: number | undefined): number | null {
  if (used == null || total == null || total <= 0) return null;
  return Math.min(100, Math.round((used / total) * 100));
}

function destinationRing(
  used: number | undefined,
  total: number | undefined,
  diskLimit: number | undefined,
): { percent: number; label: string } | null {
  const fromUsage = usagePercent(used, total);
  if (fromUsage != null) return { percent: fromUsage, label: `${fromUsage}% used` };
  if (diskLimit != null && diskLimit > 0) {
    return { percent: Math.min(100, diskLimit), label: `${diskLimit}% limit` };
  }
  return null;
}

function destinationTone(percentage: number | null, diskLimit?: number): UsageTone {
  if (percentage === null) return "neutral";
  if (percentage >= 95) return "critical";
  if ((diskLimit != null && diskLimit > 0 && percentage >= diskLimit) || percentage >= 80) {
    return "warn";
  }
  return "ok";
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function NiscBackupOverviewTab({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: NiscBackupPageTab) => void;
}) {
  const { details, isLoading, isError, error, refetch, system } = useNiscBackupDashboard();

  if (isLoading) return <OverviewSkeleton />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load NiscBackup dashboard"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = details?.statistics;
  const destinations = normalizeDestinations(details);
  const alerts = normalizeAlerts(details);
  const queue = details?.queue_summary;
  const licenseIssue = Boolean(system?.licenseIssue);
  const storedBytes = parseNiscBackupBytes(stats?.total_disk_usage);
  const destinationFallbackUsed = destinations.length === 1 ? storedBytes : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewCard
          title="General Information"
          description="Nisc Backup system details"
          icon={Server}
        >
          <div className="divide-y divide-border">
            <PairRow>
              <LimitCell label="Version" value={system?.version ?? "—"} />
              <LimitCell label="Tier" value={system?.tier ?? "—"} />
            </PairRow>
            <PairRow>
              <div className="space-y-1 px-4 py-3">
                <p className="text-xs text-muted-foreground">License</p>
                {licenseIssue ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Issue
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <LimitCell
                label="Disaster recovery"
                value={system?.dr ? "On" : "Off"}
              />
            </PairRow>
            <PairRow>
              <LimitCell
                label="Backup UI"
                value={system?.disableui ? "Disabled" : "Enabled"}
              />
              <LimitCell
                label="Agreement"
                value={system?.agreement ? "Accepted" : "Pending"}
              />
            </PairRow>
          </div>
        </OverviewCard>

        <OverviewCard
          title="Statistics"
          description="Accounts, backups, and jobs on this server"
          icon={Database}
        >
          <div className="divide-y divide-border">
            <PairRow>
              <LimitCell label="Accounts" value={stats?.total_accounts ?? 0} />
              <LimitCell label="Backups" value={stats?.total_backups ?? 0} />
            </PairRow>
            <PairRow>
              <LimitCell
                label="Backup jobs"
                value={`${stats?.total_backup_jobs_running ?? 0} / ${stats?.total_backup_jobs ?? 0} running`}
              />
              <LimitCell label="Storage used" value={formatBytes(storedBytes ?? 0)} />
            </PairRow>
            <PairRow>
              <LimitCell label="New alerts" value={stats?.total_new_alerts ?? 0} />
              <LimitCell label="Clone jobs" value={stats?.total_clone_jobs ?? 0} />
            </PairRow>
          </div>
        </OverviewCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewCard
          title="Destinations"
          description="Backup storage targets on this server"
          icon={HardDrive}
        >
          {destinations.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">
              No destinations are configured.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {destinations.map((destination) => {
                const storage = destinationStorage(destination, destinationFallbackUsed);
                const ring = destinationRing(storage.used, storage.total, destination.disk_limit);
                const tone = destinationTone(ring?.percent ?? null, destination.disk_limit);
                const disabled = isJetBackupFlagOn(destination.disabled);
                const running = isJetBackupFlagOn(destination.running);
                const usageLabel =
                  storage.used != null && storage.total != null
                    ? `${formatBytes(storage.used)} / ${formatBytes(storage.total)}`
                    : storage.used != null
                      ? formatBytes(storage.used)
                      : null;

                return (
                  <div key={destination._id} className="flex items-center gap-3 px-4 py-3">
                    <UsageRing
                      percentage={ring?.percent ?? null}
                      tone={tone}
                      icon={<HardDrive className="h-4 w-4" />}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium text-primary">
                        {destination.name ?? "Destination"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[destination.type_name ?? destination.type, usageLabel]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {ring ? (
                        <p className="text-xs text-muted-foreground">{ring.label}</p>
                      ) : null}
                    </div>
                    <Badge
                      variant={disabled ? "outline" : "default"}
                      className={niscBackupSuccessBadgeClass(!disabled)}
                    >
                      {running ? "Running" : disabled ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </OverviewCard>

        <OverviewCard
          title="Queue"
          description="Current backup, restore, and download operations"
          icon={ListOrdered}
        >
          <div className="divide-y divide-border">
            <PairRow>
              <LimitCell label="Pending" value={queue?.pending ?? 0} />
              <LimitCell label="Processing" value={queue?.processing ?? 0} />
            </PairRow>
            <PairRow>
              <LimitCell label="Completed" value={queue?.completed ?? 0} />
              <LimitCell label="Failed" value={queue?.failed ?? 0} />
            </PairRow>
          </div>
        </OverviewCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewCard
          title="Recent Alerts"
          description="Latest notifications from Nisc Backup"
          icon={AlertTriangle}
        >
          {alerts.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No recent alerts.</p>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => (
                <div key={alert._id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-primary">
                      {alert.title ?? alert.message ?? "Alert"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[formatNiscBackupDate(alert.created), alert.owner_name || alert.owner]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge variant="outline" className={niscBackupAlertLevelClass(alert.level)}>
                    {formatAlertLevel(alert.level)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        <OverviewCard
          title="Quick Actions"
          description="Jump to common backup tasks"
          icon={Zap}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.tab} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-primary">{action.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    disabled={!onNavigateTab}
                    onClick={() => onNavigateTab?.(action.tab)}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </OverviewCard>
      </div>
    </div>
  );
}
