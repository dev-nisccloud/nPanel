"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  CREDENTIALS_TOAST,
  formatDate,
  formatNumber,
  type SeoProject,
} from "./seo-suite-utils";

interface DomainOverviewTabProps {
  projectId: string;
  project: SeoProject;
}

interface TransformedData {
  target: string;
  metrics: {
    organicTraffic: number | null;
    organicKeywords: number | null;
    pos1Count: number | null;
    pos2_3Count: number | null;
    pos4_10Count: number | null;
    pos11_20Count: number | null;
  };
  rankedKeywords: Array<{
    keyword: string;
    position: number | null;
    searchVolume: number | null;
    traffic: number | null;
    cpc: number | null;
    keywordDifficulty: number | null;
    url: string | null;
  }>;
  pages: Array<{
    pageAddress: string;
    keywordCount: number | null;
    traffic: number | null;
  }>;
  capturedAt: Date;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function DomainOverviewTab({ projectId, project }: DomainOverviewTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [liveData, setLiveData] = React.useState<TransformedData | null>(null);

  const snapshot = trpc.seoSuite.latestDomainSnapshot.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const refresh = trpc.seoSuite.domainOverview.useMutation({
    onSuccess: (data) => {
      setLiveData(data as TransformedData);
      utils.seoSuite.latestDomainSnapshot.invalidate({ projectId });
      toast.success("Domain overview updated");
    },
    onError: (e) => toast.error(e.message || "Failed to refresh domain overview"),
  });

  // Use live data if available, otherwise use snapshot's transformed data
  const data = liveData ?? (snapshot.data?.transformed as TransformedData | undefined);
  const metrics = data?.metrics;
  const rankedKeywords = data?.rankedKeywords ?? [];
  const pages = data?.pages ?? [];

  if (snapshot.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!data && !snapshot.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          No domain overview data yet. Click "Refresh" to fetch the latest data.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={refresh.isPending}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            refresh.mutate({ projectId });
          }}
        >
          {refresh.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing…
            </>
          ) : (
            "Refresh domain overview"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Domain visibility</h2>
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
          disabled={refresh.isPending}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            refresh.mutate({ projectId });
          }}
        >
          {refresh.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing…
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Organic keywords"
          value={formatNumber(metrics?.organicKeywords)}
        />
        <Kpi
          label="Organic traffic"
          value={formatNumber(metrics?.organicTraffic)}
        />
        <Kpi
          label="Pos. 1–3"
          value={formatNumber(
            (metrics?.pos1Count ?? 0) + (metrics?.pos2_3Count ?? 0),
          )}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Ranked keywords</h3>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Keyword</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No ranked keywords yet — refresh domain overview
                  </TableCell>
                </TableRow>
              ) : (
                rankedKeywords.slice(0, 50).map((keyword, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium">
                      {keyword.keyword || "—"}
                    </TableCell>
                    <TableCell>{formatNumber(keyword.searchVolume)}</TableCell>
                    <TableCell>{formatNumber(keyword.position)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Top pages</h3>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Page</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Traffic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No pages yet — refresh domain overview
                  </TableCell>
                </TableRow>
              ) : (
                pages.slice(0, 30).map((page, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium max-w-md truncate">
                      {page.pageAddress || "—"}
                    </TableCell>
                    <TableCell>{formatNumber(page.keywordCount)}</TableCell>
                    <TableCell>{formatNumber(page.traffic)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
