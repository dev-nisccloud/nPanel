"use client";

import { ShieldCheck } from "lucide-react";
import { SecurityMeasuresCard } from "@/components/wordpress/security-measures-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import { trpc } from "@/utils/trpc";

export function IntegrityHardeningSheet({
  open,
  onOpenChange,
  installationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
}) {
  const { data: integrity, isLoading } = trpc.plesk.wpFeatures.getIntegrityInfo.useQuery(
    { installationId },
    { enabled: open },
  );

  const integrityTasks = integrity?.tasks ?? [];
  const hasIntegrityContent =
    Boolean(integrity?.status) || Boolean(integrity?.message) || integrityTasks.length > 0;

  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Integrity & hardening"
      description="Core file integrity and recommended security fixes"
      icon={ShieldCheck}
      isLoading={isLoading}
    >
      <div className="space-y-3 rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-primary">WordPress integrity</p>
          <p className="text-xs text-muted-foreground">File integrity status for this installation</p>
        </div>
        {hasIntegrityContent ? (
          <div className="space-y-3">
            {integrity?.status ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <WpStatusBadge label={String(integrity.status)} />
              </div>
            ) : null}
            {integrity?.message ? (
              <p className="text-sm text-muted-foreground">{integrity.message}</p>
            ) : null}
            {integrityTasks.length > 0 ? (
              <div className="space-y-3">
                {integrityTasks.map((task) => (
                  <div
                    key={task.code}
                    className="flex items-start justify-between gap-3 rounded-lg border px-3 py-3"
                  >
                    <p className="min-w-0 text-sm font-medium text-primary">
                      {task.title ?? task.code}
                    </p>
                    <WpStatusBadge label={task.status ?? "pending"} />
                  </div>
                ))}
              </div>
            ) : integrity?.status ? (
              <p className="text-sm text-muted-foreground">No active integrity tasks.</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Integrity check data is not available for this installation.
          </p>
        )}
      </div>

      <SecurityMeasuresCard installationId={installationId} shell="none" enabled={open} />
    </WpManageSheet>
  );
}
