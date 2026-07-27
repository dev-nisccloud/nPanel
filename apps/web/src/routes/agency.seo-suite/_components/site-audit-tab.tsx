"use client";

import * as React from "react";
import { ShieldCheck, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
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
import { useCredentialsConfigured } from "./credentials-banner";
import {
  asArray,
  asRecord,
  CREDENTIALS_TOAST,
  formatDate,
  formatNumber,
  getNested,
  type SeoProject,
} from "./seo-suite-utils";

interface SiteAuditTabProps {
  projectId: string;
  project: SeoProject;
}

export function SiteAuditTab({ projectId, project }: SiteAuditTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [startOpen, setStartOpen] = React.useState(false);
  const [instantOpen, setInstantOpen] = React.useState(false);
  const [targetUrl, setTargetUrl] = React.useState(`https://${project.primaryDomain}`);
  const [maxPages, setMaxPages] = React.useState("100");
  const [instantUrl, setInstantUrl] = React.useState(`https://${project.primaryDomain}`);
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [instantResult, setInstantResult] = React.useState<unknown>(null);

  const runs = trpc.seoSuite.listAuditRuns.useQuery(
    { projectId },
    { staleTime: 15_000, refetchOnWindowFocus: false },
  );

  const runDetail = trpc.seoSuite.getAuditRun.useQuery(
    { projectId, auditRunId: selectedRunId! },
    { enabled: !!selectedRunId, staleTime: 10_000, refetchOnWindowFocus: false },
  );

  const startAudit = trpc.seoSuite.startAudit.useMutation({
    onSuccess: (res) => {
      toast.success(res.queued ? "Audit queued" : "Audit started");
      setStartOpen(false);
      utils.seoSuite.listAuditRuns.invalidate({ projectId });
      setSelectedRunId(res.id);
    },
    onError: (e) => toast.error(e.message || "Failed to start audit"),
  });

  const instant = trpc.seoSuite.instantPageAudit.useMutation({
    onSuccess: (data) => {
      setInstantResult(data);
      toast.success("Instant page audit complete");
    },
    onError: (e) => toast.error(e.message || "Instant audit failed"),
  });

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  if (runs.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (runs.isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {runs.error.message || "Failed to load audits"}
        </p>
        <Button variant="outline" onClick={() => runs.refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const issues = runDetail.data?.issues ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            setStartOpen(true);
          }}
        >
          Start site audit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            setInstantOpen(true);
          }}
        >
          Instant URL audit
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(runs.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No audit runs yet
                </TableCell>
              </TableRow>
            ) : (
              (runs.data ?? []).map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRunId(run.id)}
                >
                  <TableCell className="pl-6 font-medium max-w-xs truncate">
                    {run.targetUrl}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{run.status}</Badge>
                  </TableCell>
                  <TableCell>{formatNumber(run.score)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(run.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRunId && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Issues {runDetail.isLoading ? "(loading…)" : `(${issues.length})`}
          </h3>
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {runDetail.isLoading ? "Loading issues…" : "No issues for this run"}
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.slice(0, 100).map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="pl-6">
                        <Badge variant="outline">{issue.severity}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{issue.title}</TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {issue.url ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Sheet open={startOpen} onOpenChange={setStartOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold">Start site audit</SheetTitle>
                <SheetDescription className="text-base">
                  Crawl and score pages for technical SEO issues
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Target URL</label>
              <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Max pages</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={startAudit.isPending}
              onClick={() =>
                guard(() =>
                  startAudit.mutate({
                    projectId,
                    targetUrl,
                    maxPages: Number(maxPages) || 100,
                  }),
                )
              }
            >
              {startAudit.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Starting…
                </>
              ) : (
                "Start audit"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={instantOpen} onOpenChange={setInstantOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Instant page audit</DialogTitle>
            <DialogDescription>Analyze a single URL without a full crawl.</DialogDescription>
          </DialogHeader>
          <Input
            value={instantUrl}
            onChange={(e) => setInstantUrl(e.target.value)}
            placeholder="https://example.com/page"
          />
          {instantResult != null && (
            <pre className="text-xs rounded-lg border bg-muted/40 p-3 overflow-auto max-h-64">
              {JSON.stringify(
                {
                  onpage_score: getNested(instantResult, "onpage_score"),
                  meta: getNested(instantResult, "meta"),
                  checks: asArray(getNested(asRecord(instantResult), "checks")).slice(0, 20),
                },
                null,
                2,
              )}
            </pre>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstantOpen(false)}>
              Close
            </Button>
            <Button
              disabled={instant.isPending}
              onClick={() => guard(() => instant.mutate({ projectId, url: instantUrl }))}
            >
              {instant.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing…
                </>
              ) : (
                "Run"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
