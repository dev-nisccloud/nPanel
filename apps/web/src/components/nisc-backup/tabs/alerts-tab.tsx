"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { formatAlertLevel, formatNiscBackupDate, isSuccessStatus } from "../formatters";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
import { niscBackupAlertLevelClass, niscBackupSendLogClass } from "../status-badges";
import type { NiscBackupAlertRow } from "../types";

function normalizeAlerts(data: unknown): NiscBackupAlertRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.alerts ?? record.items;
  return Array.isArray(list) ? (list as NiscBackupAlertRow[]) : [];
}

export function NiscBackupAlertsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch } = trpc.niscBackup.alerts.list.useQuery(
    { limit: 50 },
    niscBackupQueryOptions,
  );
  const clearAlerts = trpc.niscBackup.alerts.clear.useMutation({
    onSuccess: () => {
      toast.success("Alerts cleared");
      utils.niscBackup.alerts.list.invalidate();
      utils.niscBackup.dashboard.getDetails.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const alerts = normalizeAlerts(data);

  if (isLoading) return <NiscBackupTableSkeleton rows={4} />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load alerts"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={clearAlerts.isPending || alerts.length === 0}
          onClick={() => clearAlerts.mutate({})}
        >
          Clear all
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No alerts.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden @md/main:grid @md/main:grid-cols-[140px_1fr_80px_100px] gap-3 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Created</span>
            <span>Details</span>
            <span>Owner</span>
            <span>Level</span>
          </div>
          <div className="divide-y">
            {alerts.map((alert) => {
              const sendLog = alert.send_logs?.[0];
              const sendSuccess = isSuccessStatus(sendLog?.status, sendLog?.message);
              const owner = alert.owner_name || alert.owner || "-";

              return (
                <div
                  key={alert._id}
                  className="grid gap-2 px-3 py-2.5 @md/main:grid-cols-[140px_1fr_80px_100px] @md/main:items-start @md/main:gap-3"
                >
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatNiscBackupDate(alert.created)}
                  </p>

                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-snug">{alert.title ?? "Alert"}</p>
                    {alert.message ? (
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    ) : null}
                    {sendLog ? (
                      <p className={niscBackupSendLogClass(sendSuccess)}>
                        {sendSuccess ? "Sent" : "Not sent"} · {sendLog.integration ?? "Notification"}
                        {sendLog.created ? ` · ${formatNiscBackupDate(sendLog.created)}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate">{owner}</p>

                  <Badge
                    variant="outline"
                    className={niscBackupAlertLevelClass(alert.level)}
                  >
                    {formatAlertLevel(alert.level)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
