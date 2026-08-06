"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
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

interface BacklinksTabProps {
  projectId: string;
  project: SeoProject;
}

type ListMode = "backlinks" | "referring_domains" | "anchors";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function BacklinksTab({ projectId, project }: BacklinksTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [mode, setMode] = React.useState<ListMode>("backlinks");
  const [listItems, setListItems] = React.useState<unknown[]>([]);
  const [summaryLive, setSummaryLive] = React.useState<unknown>(null);

  const snapshot = trpc.seoSuite.latestBacklinkSnapshot.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const refreshSummary = trpc.seoSuite.backlinksSummary.useMutation({
    onSuccess: (data) => {
      setSummaryLive(data);
      utils.seoSuite.latestBacklinkSnapshot.invalidate({ projectId });
      captureEvent("seo_backlinks_analyzed", { domain: project.primaryDomain });
      toast.success("Backlink summary updated");
    },
    onError: (e) => toast.error(e.message || "Failed to refresh backlinks"),
  });

  const listMutation = trpc.seoSuite.backlinksList.useMutation({
    onSuccess: (data) => {
      const items = asArray(getNested(data.items, "items") ?? data.items);
      setListItems(items);
    },
    onError: (e) => toast.error(e.message || "Failed to load backlink list"),
  });

  const summary = asRecord(summaryLive ?? snapshot.data?.summary);
  const summaryInner = asRecord(getNested(summary, "items.0") ?? asArray(summary.items)[0] ?? summary);

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  const loadList = (m: ListMode) => {
    guard(() => listMutation.mutate({ projectId, mode: m }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Backlinks</h2>
          <p className="text-xs text-muted-foreground">
            {project.primaryDomain}
            {snapshot.data?.capturedAt
              ? ` · captured ${formatDate(snapshot.data.capturedAt)}`
              : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshSummary.isPending}
          onClick={() => guard(() => refreshSummary.mutate({ projectId }))}
        >
          {refreshSummary.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing…
            </>
          ) : (
            "Refresh summary"
          )}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Backlinks" value={formatNumber(summaryInner.backlinks)} />
        <Kpi label="Referring domains" value={formatNumber(summaryInner.referring_domains)} />
        <Kpi label="Rank" value={formatNumber(summaryInner.rank)} />
        <Kpi label="Broken backlinks" value={formatNumber(summaryInner.broken_backlinks)} />
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => {
          const m = v as ListMode;
          setMode(m);
          loadList(m);
        }}
      >
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            <TabsTrigger value="referring_domains">Referring domains</TabsTrigger>
            <TabsTrigger value="anchors">Anchors</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            disabled={listMutation.isPending}
            onClick={() => loadList(mode)}
          >
            {listMutation.isPending ? <Spinner className="h-4 w-4" /> : "Load list"}
          </Button>
        </div>

        <TabsContent value={mode} className="mt-4">
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {mode === "anchors" ? (
                    <>
                      <TableHead className="pl-6">Anchor</TableHead>
                      <TableHead>Backlinks</TableHead>
                      <TableHead>Domains</TableHead>
                    </>
                  ) : mode === "referring_domains" ? (
                    <>
                      <TableHead className="pl-6">Domain</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Backlinks</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="pl-6">URL from</TableHead>
                      <TableHead>URL to</TableHead>
                      <TableHead>Rank</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {listItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Load a list to see results
                    </TableCell>
                  </TableRow>
                ) : (
                  listItems.slice(0, 50).map((item, i) => {
                    const r = asRecord(item);
                    if (mode === "anchors") {
                      return (
                        <TableRow key={i}>
                          <TableCell className="pl-6 font-medium">
                            {String(r.anchor ?? "")}
                          </TableCell>
                          <TableCell>{formatNumber(r.backlinks)}</TableCell>
                          <TableCell>{formatNumber(r.referring_domains)}</TableCell>
                        </TableRow>
                      );
                    }
                    if (mode === "referring_domains") {
                      return (
                        <TableRow key={i}>
                          <TableCell className="pl-6 font-medium">
                            {String(r.domain ?? r.target ?? "")}
                          </TableCell>
                          <TableCell>{formatNumber(r.rank)}</TableCell>
                          <TableCell>{formatNumber(r.backlinks)}</TableCell>
                        </TableRow>
                      );
                    }
                    return (
                      <TableRow key={i}>
                        <TableCell className="pl-6 font-medium max-w-[240px] truncate">
                          {String(r.url_from ?? "")}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {String(r.url_to ?? "")}
                        </TableCell>
                        <TableCell>{formatNumber(r.rank)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
