"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoricalTrendsTabProps {
  projectId: string;
  project: SeoProject;
}

type Period = "30" | "60" | "90" | "180";

export function HistoricalTrendsTab({ projectId, project }: HistoricalTrendsTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [period, setPeriod] = React.useState<Period>("90");

  const historicalRank = trpc.seoSuite.historicalRankOverview.useQuery(
    { projectId, days: Number(period) },
    { enabled: configured, staleTime: 5 * 60 * 1000 },
  );

  const historicalTraffic = trpc.seoSuite.historicalTraffic.useQuery(
    { projectId },
    { enabled: configured, staleTime: 5 * 60 * 1000 },
  );

  const historicalBacklinks = trpc.seoSuite.historicalBacklinks.useQuery(
    { projectId },
    { enabled: configured, staleTime: 5 * 60 * 1000 },
  );

  const refreshAll = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    utils.seoSuite.historicalRankOverview.invalidate({ projectId });
    utils.seoSuite.historicalTraffic.invalidate({ projectId });
    utils.seoSuite.historicalBacklinks.invalidate({ projectId });
    toast.success("Refreshing historical data...");
  };

  if (!configured) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Configure DataForSEO credentials to view historical trends
        </p>
      </div>
    );
  }

  if (historicalTraffic.isLoading || historicalBacklinks.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const trafficData = (historicalTraffic.data || []).map((item) => ({
    date: formatDate(item.capturedAt),
    organic: item.organicTraffic || 0,
    paid: item.paidTraffic || 0,
  }));

  const backlinkData = (historicalBacklinks.data || []).map((item) => ({
    date: formatDate(item.capturedAt),
    total: item.totalBacklinks || 0,
    domains: item.referringDomains || 0,
    new: item.newBacklinks || 0,
    lost: item.lostBacklinks || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Historical Trends</h2>
          <p className="text-xs text-muted-foreground">
            Track your SEO performance over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            {historicalRank.isFetching ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Refreshing...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>

      {trafficData.length === 0 && backlinkData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No historical data yet. Run a domain baseline to start collecting trends.
          </p>
        </div>
      ) : (
        <>
          {/* Traffic Trends */}
          {trafficData.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Traffic Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="organic"
                    stroke="hsl(var(--primary))"
                    name="Organic Traffic"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="hsl(var(--destructive))"
                    name="Paid Traffic"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Backlink Growth */}
          {backlinkData.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Backlink Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={backlinkData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    name="Total Backlinks"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="domains"
                    stroke="hsl(var(--chart-2))"
                    name="Referring Domains"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="hsl(var(--chart-3))"
                    name="New Backlinks"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="lost"
                    stroke="hsl(var(--destructive))"
                    name="Lost Backlinks"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
