"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { WorkflowRunsTable } from "./agency.cronjobs/_components/workflow-runs-table";
import { WORKFLOW_REGISTRY } from "./agency.cronjobs/_components/workflow-registry";

export default function AgencyCronJobsIndexPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const listQuery = trpc.cronWorkflowRun.list.useQuery({ limit: 100 });

  const createMutation = trpc.cronWorkflowRun.create.useMutation({
    onSuccess: async (data) => {
      await utils.cronWorkflowRun.list.invalidate();
      navigate(`/agency/cronjobs/runs/${data.id}`);
    },
  });

  const filtered = React.useMemo(() => {
    const runs = listQuery.data?.runs ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return runs;
    return runs.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.jobKey.toLowerCase().includes(q)
      );
    });
  }, [listQuery.data?.runs, searchQuery]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Workflow Runs</h1>
          <p className="text-xs text-muted-foreground">
            Workflow runs are saved automatically. Open a run to continue the node editor.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, status, job…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="shrink-0"
                  disabled={createMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New workflow run
                  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {WORKFLOW_REGISTRY.map((w) => (
                  <DropdownMenuItem
                    key={w.jobKey}
                    onSelect={() => {
                      createMutation.mutate({ jobKey: w.jobKey });
                    }}
                  >
                    {w.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-6">
          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading runs…</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">Could not load workflow runs.</p>
          ) : (
            <WorkflowRunsTable
              data={filtered}
              searchQuery={searchQuery}
              onRowClick={(id) => navigate(`/agency/cronjobs/runs/${id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
