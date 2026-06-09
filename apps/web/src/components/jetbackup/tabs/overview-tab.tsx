"use client";

import * as React from "react";
import { Database, HardDrive, Server, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import { formatBytes, formatJetBackupDate } from "../formatters";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { useJetBackupDashboard } from "../hooks/use-jetbackup-dashboard";
import { jetbackupSuccessBadgeClass } from "../status-badges";
import type { JetBackupDestinationRow } from "../types";

function OverviewStatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function normalizeDestinations(data: unknown): JetBackupDestinationRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const nested = record.destinations as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.destinations)) {
    return nested.destinations as JetBackupDestinationRow[];
  }
  const list = record.destinations ?? record.items;
  return Array.isArray(list) ? (list as JetBackupDestinationRow[]) : [];
}

export function JetBackupOverviewTab() {
  const { details, isLoading, isError, error, refetch, system } = useJetBackupDashboard();

  if (isLoading) return <JetBackupTableSkeleton rows={3} />;
  if (isError) {
    return (
      <JetBackupErrorState
        title="Failed to load JetBackup dashboard"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = details?.statistics;
  const destinations = normalizeDestinations(details);
  const queue = details?.queue_summary;

  return (
    <div className="space-y-5">
      {system ? (
        <p className="text-xs text-muted-foreground">
          JetBackup {system.version} on {system.type}
          {system.tier ? ` · ${system.tier}` : ""}
        </p>
      ) : null}

      <div className={wpDetailLayout.statGrid}>
        <OverviewStatCard label="Accounts" value={stats?.total_accounts ?? 0} icon={Users} />
        <OverviewStatCard label="Backups" value={stats?.total_backups ?? 0} icon={Database} />
        <OverviewStatCard
          label="Backup jobs"
          value={stats?.total_backup_jobs ?? 0}
          hint={`${stats?.total_backup_jobs_running ?? 0} running`}
          icon={HardDrive}
        />
        <OverviewStatCard
          label="Storage used"
          value={formatBytes(stats?.total_disk_usage ?? 0)}
          hint={`${stats?.total_new_alerts ?? 0} new alerts`}
          icon={HardDrive}
        />
      </div>

      {destinations.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4" />
              Destinations
            </CardTitle>
            <CardDescription>Backup storage targets on this server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {destinations.map((destination) => {
              const isActive = !destination.disabled && destination.running !== false;
              const usage =
                typeof destination.disk_usage === "number"
                  ? formatBytes(destination.disk_usage)
                  : destination.disk_limit
                    ? `${destination.disk_limit}% limit`
                    : null;

              return (
                <div
                  key={destination._id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{destination.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[destination.type_name ?? destination.type, usage]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge
                    variant="default"
                    className={jetbackupSuccessBadgeClass(isActive)}
                  >
                    {destination.running ? "Running" : isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {queue ? (
        <div className="grid grid-cols-2 gap-2 @sm/main:grid-cols-4">
          {[
            { label: "Pending", value: queue.pending ?? 0 },
            { label: "Processing", value: queue.processing ?? 0 },
            { label: "Completed", value: queue.completed ?? 0 },
            { label: "Failed", value: queue.failed ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-md border px-3 py-2 text-center">
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
