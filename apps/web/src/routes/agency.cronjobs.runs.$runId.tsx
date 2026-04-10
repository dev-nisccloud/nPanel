"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { CRON_JOB_KEYS } from "./agency.cronjobs/_components/jobs";
import { MediaBuyingEomTotalSpendInvoicesFlow } from "./agency.cronjobs/_components/media-buying-eom-flow";
import { workflowLabelForJobKey } from "./agency.cronjobs/_components/workflow-registry";
import { workflowRunStatusBadgeVariant } from "./agency.cronjobs/_components/workflow-runs-table";

const RUN_STATUSES = [
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

export default function AgencyCronJobRunDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const runId = (params as { runId?: string }).runId;

  const query = trpc.cronWorkflowRun.getById.useQuery(
    { id: runId ?? "" },
    { enabled: !!runId }
  );

  const patchMutation = trpc.cronWorkflowRun.patch.useMutation({
    onSuccess: () => query.refetch(),
  });

  const [nameDraft, setNameDraft] = React.useState("");
  const [isWorkflowSaving, setIsWorkflowSaving] = React.useState(false);

  const onWorkflowAutosaveStatus = React.useCallback((s: { isSaving: boolean }) => {
    setIsWorkflowSaving(s.isSaving);
  }, []);

  React.useEffect(() => {
    if (query.data?.name != null) setNameDraft(query.data.name);
  }, [query.data?.name]);

  const commitName = React.useCallback(() => {
    if (!runId || !query.data) return;
    const t = nameDraft.trim();
    if (!t || t === query.data.name) return;
    patchMutation.mutate({ id: runId, name: t });
  }, [runId, query.data, nameDraft, patchMutation]);

  if (!runId) {
    return null;
  }

  if (query.isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <p className="text-sm text-muted-foreground">Loading run…</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="@container/main flex flex-col gap-4 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/agency/cronjobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-destructive">Run not found or you do not have access.</p>
      </div>
    );
  }

  const run = query.data;
  const graph = run.graphStateJson as Record<string, unknown> | null;
  const invoiceIds = Object.fromEntries(
    (run.invoices ?? []).map((i) => [i.platform, i.invoiceId])
  ) as Partial<Record<"meta" | "google" | "linkedin", string>>;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/agency/cronjobs")}
          className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group"
        >
          <ArrowLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Cron Jobs
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Run name</Label>
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="max-w-xl w-full"
              />
              <p className="text-xs text-muted-foreground pt-0.5">
                Job:{" "}
                <span className="text-foreground font-medium">
                  {workflowLabelForJobKey(run.jobKey)}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {isWorkflowSaving ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                    aria-label="Saving workflow"
                  />
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={patchMutation.isPending}
                      aria-label="Run actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Set status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {RUN_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={s === run.status || patchMutation.isPending}
                      onSelect={() => {
                        patchMutation.mutate({
                          id: runId,
                          status: s,
                        });
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Badge
                variant={workflowRunStatusBadgeVariant(run.status)}
                className="text-xs font-medium capitalize"
              >
                {run.status}
              </Badge>
            </div>
          </div>

          <div className="min-w-0 flex flex-col gap-3">
            {run.jobKey === CRON_JOB_KEYS.MEDIA_BUYING_EOM_TOTAL_SPEND_INVOICES ? (
              <MediaBuyingEomTotalSpendInvoicesFlow
                workflowRunId={runId}
                hydrationReady={!query.isLoading}
                initialGraphState={graph}
                initialVersion={run.version}
                initialInvoiceIds={invoiceIds}
                onAutosaveStatusChange={onWorkflowAutosaveStatus}
              />
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">
                  No editor registered for this job type.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
