"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { formatAlertLevel, formatNiscBackupDate, isSuccessStatus, sortNewestFirst } from "../formatters";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";
import { niscBackupAlertLevelClass } from "../status-badges";
import type { NiscBackupAlertRow } from "../types";

function normalizeAlerts(data: unknown): NiscBackupAlertRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.alerts ?? record.items;
  const rows = Array.isArray(list)
    ? (list as NiscBackupAlertRow[])
    : list && typeof list === "object"
      ? (Object.values(list) as NiscBackupAlertRow[])
      : [];
  return sortNewestFirst(
    rows.filter((alert) => alert && typeof alert === "object" && alert._id),
    (alert) => alert.created,
  );
}

function alertSubtitle(alert: NiscBackupAlertRow): string {
  const sendLog = alert.send_logs?.[0];
  const sent = sendLog
    ? isSuccessStatus(sendLog.status, sendLog.message) ? "Sent" : "Not sent"
    : null;
  const owner = alert.owner_name || alert.owner;

  return [
    formatNiscBackupDate(alert.created),
    owner && owner !== "-" ? owner : null,
    sent,
  ]
    .filter((part) => part && part !== "-")
    .join(" · ");
}

function alertMeta(alert: NiscBackupAlertRow): string | undefined {
  const title = alert.title?.trim();
  const message = alert.message?.trim();
  if (!message || !title) return message || undefined;
  if (message.toLowerCase() === title.toLowerCase()) return undefined;
  if (message.toLowerCase().startsWith(title.toLowerCase())) return undefined;
  return message;
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

      <NiscBackupMinimalList emptyMessage="No alerts.">
        {alerts.map((alert) => (
          <NiscBackupMinimalRow
            key={alert._id}
            compact
            title={alert.title ?? alert.message ?? "Alert"}
            subtitle={alertSubtitle(alert) || undefined}
            meta={alertMeta(alert)}
            badge={formatAlertLevel(alert.level)}
            badgeVariant="outline"
            badgeClassName={niscBackupAlertLevelClass(alert.level)}
          />
        ))}
      </NiscBackupMinimalList>
    </div>
  );
}
