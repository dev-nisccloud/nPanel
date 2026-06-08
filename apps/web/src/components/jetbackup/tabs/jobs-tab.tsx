"use client";

import { Play } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import { jetbackupSuccessBadgeClass } from "../status-badges";
import type { JetBackupJobRow } from "../types";

function normalizeJobs(data: unknown): JetBackupJobRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.jobs ?? record.items ?? record.backup_jobs;
  return Array.isArray(list) ? (list as JetBackupJobRow[]) : [];
}

function jobStatusLabel(job: JetBackupJobRow): string {
  if (job.running) return "Running";
  if (job.enabled === 0 || job.enabled === false) return "Disabled";
  return "Enabled";
}

export function JetBackupJobsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch } = trpc.jetbackup.jobs.listBackup.useQuery(
    { limit: 100 },
    jetbackupQueryOptions,
  );
  const runJob = trpc.jetbackup.jobs.runBackupManually.useMutation({
    onSuccess: () => {
      toast.success("Backup job queued");
      utils.jetbackup.jobs.listBackup.invalidate();
      utils.jetbackup.dashboard.getDetails.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const jobs = normalizeJobs(data);

  if (isLoading) return <JetBackupTableSkeleton rows={3} />;
  if (isError) {
    return (
      <JetBackupErrorState
        title="Failed to load backup jobs"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <JetBackupMinimalList emptyMessage="No backup jobs configured.">
      {jobs.map((job) => {
        const label = jobStatusLabel(job);
        const isSuccess = Boolean(job.running) || (job.enabled !== 0 && job.enabled !== false);

        return (
        <JetBackupMinimalRow
          key={job._id}
          title={job.name ?? "Unnamed job"}
          badge={label}
          badgeVariant={isSuccess ? "default" : "outline"}
          badgeClassName={jetbackupSuccessBadgeClass(isSuccess)}
          actions={
            <Button
              size="sm"
              variant="ghost"
              disabled={runJob.isPending}
              onClick={() => runJob.mutate({ _id: job._id })}
            >
              <Play className="mr-1 h-3 w-3" />
              Run
            </Button>
          }
        />
        );
      })}
    </JetBackupMinimalList>
  );
}
