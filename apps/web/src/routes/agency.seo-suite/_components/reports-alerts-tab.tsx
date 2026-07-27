"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { formatDate, formatNumber, type SeoProject } from "./seo-suite-utils";

interface ReportsAlertsTabProps {
  projectId: string;
  project: SeoProject;
}

export function ReportsAlertsTab({ projectId }: ReportsAlertsTabProps) {
  const utils = trpc.useUtils();
  const [alertName, setAlertName] = React.useState("");
  const [ruleType, setRuleType] = React.useState("rank_drop");
  const [reportTitle, setReportTitle] = React.useState("Monthly SEO snapshot");
  const [reportType, setReportType] = React.useState("snapshot");

  const rules = trpc.seoSuite.listAlertRules.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const events = trpc.seoSuite.listAlertEvents.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const reports = trpc.seoSuite.listReportRuns.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const usage = trpc.seoSuite.usageSummary.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const createRule = trpc.seoSuite.createAlertRule.useMutation({
    onSuccess: () => {
      toast.success("Alert rule created");
      setAlertName("");
      utils.seoSuite.listAlertRules.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to create alert rule"),
  });

  const createReport = trpc.seoSuite.createReportRun.useMutation({
    onSuccess: () => {
      toast.success("Report generated");
      utils.seoSuite.listReportRuns.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to generate report"),
  });

  const loading =
    rules.isLoading || events.isLoading || reports.isLoading || usage.isLoading;

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (rules.isError || events.isError || reports.isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {(rules.error || events.error || reports.error)?.message ||
            "Failed to load reports & alerts"}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            rules.refetch();
            events.refetch();
            reports.refetch();
            usage.refetch();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const usageTotal = (usage.data ?? []).reduce(
    (sum, row) => sum + (Number(row.costEstimate) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Recent vendor usage (est. cost)</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">
          {formatNumber(usageTotal)}
          <span className="text-xs font-normal text-muted-foreground ml-2">
            across {(usage.data ?? []).length} calls
          </span>
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Create alert rule</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={alertName} onChange={(e) => setAlertName(e.target.value)} />
          </div>
          <div className="w-48 space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank_drop">Rank drop</SelectItem>
                <SelectItem value="backlink_loss">Backlink loss</SelectItem>
                <SelectItem value="audit_score">Audit score</SelectItem>
                <SelectItem value="ai_mention">AI mention</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            disabled={createRule.isPending || !alertName.trim()}
            onClick={() =>
              createRule.mutate({
                projectId,
                name: alertName.trim(),
                ruleType,
                config: {},
              })
            }
          >
            {createRule.isPending ? <Spinner className="h-4 w-4" /> : "Add rule"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rules.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No alert rules
                  </TableCell>
                </TableRow>
              ) : (
                (rules.data ?? []).map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="pl-6 font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.ruleType}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.enabled ? "on" : "off"}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Alert events</h3>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(events.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No alert events
                  </TableCell>
                </TableRow>
              ) : (
                (events.data ?? []).map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="pl-6 font-medium">{ev.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {ev.message ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(ev.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Generate report</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
          </div>
          <div className="w-48 space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snapshot">Snapshot</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={createReport.isPending || !reportTitle.trim()}
            onClick={() =>
              createReport.mutate({
                projectId,
                title: reportTitle.trim(),
                reportType,
              })
            }
          >
            {createReport.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reports.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No reports yet
                  </TableCell>
                </TableRow>
              ) : (
                (reports.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-6 font-medium">{r.title}</TableCell>
                    <TableCell>{r.reportType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
