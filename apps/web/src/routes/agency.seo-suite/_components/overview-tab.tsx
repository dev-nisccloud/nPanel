"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  CREDENTIALS_TOAST,
  formatDate,
  formatNumber,
  type SeoProject,
} from "./seo-suite-utils";

interface OverviewTabProps {
  projectId: string;
  project: SeoProject;
  onNavigateTab: (tab: string) => void;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function OverviewTab({ projectId, project, onNavigateTab }: OverviewTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();

  const snapshot = trpc.seoSuite.latestDomainSnapshot.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const audits = trpc.seoSuite.listAuditRuns.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const refreshDomain = trpc.seoSuite.domainOverview.useMutation({
    onSuccess: () => {
      toast.success("Domain overview refreshed");
      utils.seoSuite.latestDomainSnapshot.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to refresh domain overview"),
  });

  // Use transformed data from new service layer
  const metrics = (snapshot.data?.metrics as any);
  const latestAudit = audits.data?.[0];
  const organicTraffic = metrics?.organicTraffic;
  const organicKeywords = metrics?.organicKeywords;
  const organicPos1 = metrics?.pos1Keywords;

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  if (snapshot.isLoading || audits.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Project snapshot</h2>
          <p className="text-xs text-muted-foreground">
            {project.primaryDomain}
            {snapshot.data?.capturedAt
              ? ` · last domain capture ${formatDate(snapshot.data.capturedAt)}`
              : " · no domain snapshot yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshDomain.isPending}
            onClick={() => guard(() => refreshDomain.mutate({ projectId }))}
          >
            Refresh domain baseline
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateTab("research")}>
            Keyword research
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateTab("audit")}>
            Site audit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateTab("ranks")}>
            Rank tracking
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Organic keywords" value={formatNumber(organicKeywords)} />
        <KpiCard label="Organic traffic" value={formatNumber(organicTraffic)} />
        <KpiCard label="Pos. 1 keywords" value={formatNumber(organicPos1)} />
        <KpiCard
          label="Latest audit score"
          value={
            latestAudit?.score != null
              ? String(latestAudit.score)
              : latestAudit
                ? latestAudit.status
                : "—"
          }
        />
      </div>

      {!snapshot.data && (
        <p className="text-sm text-muted-foreground">
          Run a domain baseline to populate KPIs, then use the tabs for research, competitors,
          backlinks, and AI visibility.
        </p>
      )}
    </div>
  );
}
