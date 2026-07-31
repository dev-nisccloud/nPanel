"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  CREDENTIALS_TOAST,
  formatDate,
  formatNumber,
  parseCommaList,
  type SeoProject,
} from "./seo-suite-utils";

interface RankTrackingTabProps {
  projectId: string;
  project: SeoProject;
}

export function RankTrackingTab({ projectId }: RankTrackingTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = React.useState(false);
  const [keywordsText, setKeywordsText] = React.useState("");

  const trackerQuery = trpc.seoSuite.getRankTracker.useQuery(
    { projectId },
    { staleTime: 30_000, refetchOnWindowFocus: false },
  );
  const resultsQuery = trpc.seoSuite.listRankResults.useQuery(
    { projectId, limit: 100 },
    { staleTime: 30_000, refetchOnWindowFocus: false },
  );

  const addKeywords = trpc.seoSuite.addRankKeywords.useMutation({
    onSuccess: () => {
      toast.success("Keywords added");
      setAddOpen(false);
      setKeywordsText("");
      utils.seoSuite.getRankTracker.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to add keywords"),
  });

  const updateTracker = trpc.seoSuite.updateRankTracker.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      utils.seoSuite.getRankTracker.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to update tracker"),
  });

  const runCheck = trpc.seoSuite.runRankCheck.useMutation({
    onSuccess: (res) => {
      toast.success(res.queued ? "Rank check queued" : "Rank check completed");
      utils.seoSuite.getRankTracker.invalidate({ projectId });
      utils.seoSuite.listRankResults.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Rank check failed"),
  });

  const latestByKeyword = React.useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof resultsQuery.data>[number]
    >();
    for (const row of resultsQuery.data ?? []) {
      if (!map.has(row.rankKeywordId)) map.set(row.rankKeywordId, row);
    }
    return map;
  }, [resultsQuery.data]);

  if (trackerQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (trackerQuery.isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {trackerQuery.error.message || "Failed to load rank tracker"}
        </p>
        <Button variant="outline" onClick={() => trackerQuery.refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const tracker = trackerQuery.data?.tracker;
  const keywords = trackerQuery.data?.keywords ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1.5">
          <label className="text-xs text-muted-foreground">Schedule</label>
          <Select
            value={tracker?.schedule ?? "weekly"}
            onValueChange={(v) =>
              updateTracker.mutate({
                projectId,
                schedule: v as "daily" | "every_3_days" | "weekly",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="every_3_days">Every 3 days</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          Add keywords
        </Button>
        <Button
          size="sm"
          disabled={runCheck.isPending || keywords.length === 0}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            runCheck.mutate({ projectId });
          }}
        >
          {runCheck.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Running…
            </>
          ) : (
            "Run check"
          )}
        </Button>
        {tracker?.lastRunAt && (
          <p className="text-xs text-muted-foreground self-center">
            Last run {formatDate(tracker.lastRunAt)}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Keyword</TableHead>
              <TableHead>Latest rank</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Checked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No tracked keywords yet
                </TableCell>
              </TableRow>
            ) : (
              keywords.map((kw) => {
                const result = latestByKeyword.get(kw.id);
                return (
                  <TableRow key={kw.id}>
                    <TableCell className="pl-6 font-medium">{kw.keyword}</TableCell>
                    <TableCell>{formatNumber(result?.rankAbsolute)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {result?.url ?? ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(result?.checkedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add rank keywords</DialogTitle>
            <DialogDescription>
              Enter one keyword per line, or comma-separated.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder={"best hosting kenya\nwordpress hosting"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={addKeywords.isPending}
              onClick={() => {
                const keywords = parseCommaList(keywordsText.replace(/\n/g, ","));
                if (!keywords.length) {
                  toast.error("Enter at least one keyword");
                  return;
                }
                addKeywords.mutate({ projectId, keywords });
              }}
            >
              {addKeywords.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Adding…
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
