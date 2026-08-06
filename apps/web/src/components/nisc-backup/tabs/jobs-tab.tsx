"use client";

import { captureEvent } from "@/lib/posthog";

import { Play } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";
import { niscBackupSuccessBadgeClass } from "../status-badges";
import type { NiscBackupJobRow } from "../types";

function normalizeJobs(data: unknown): NiscBackupJobRow[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.jobs ?? record.items ?? record.backup_jobs;
  return Array.isArray(list) ? (list as NiscBackupJobRow[]) : [];
}

function jobStatusLabel(job: NiscBackupJobRow): string {
  if (job.running) return "Running";
  if (job.enabled === 0 || job.enabled === false) return "Disabled";
  return "Enabled";
}

export function NiscBackupJobsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch } = trpc.niscBackup.jobs.listBackup.useQuery(
    { limit: 100 },
    niscBackupQueryOptions,
  );
  const runJob = trpc.niscBackup.jobs.runBackupManually.useMutation({
    onSuccess: () => {
      captureEvent("backup_job_started");
      toast.success("Backup job queued");
      utils.niscBackup.jobs.listBackup.invalidate();
      utils.niscBackup.dashboard.getDetails.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const jobs = normalizeJobs(data);

  if (isLoading) return <NiscBackupTableSkeleton rows={3} />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load backup jobs"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <NiscBackupMinimalList emptyMessage="No backup jobs configured.">
      {jobs.map((job) => {
        const label = jobStatusLabel(job);
        const isSuccess = Boolean(job.running) || (job.enabled !== 0 && job.enabled !== false);

        return (
        <NiscBackupMinimalRow
          key={job._id}
          title={job.name ?? "Unnamed job"}
          badge={label}
          badgeVariant={isSuccess ? "default" : "outline"}
          badgeClassName={niscBackupSuccessBadgeClass(isSuccess)}
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
    </NiscBackupMinimalList>
  );
}
