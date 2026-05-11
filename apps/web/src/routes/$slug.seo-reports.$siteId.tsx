"use client";

import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import {
  ChevronLeft,
  Search,
  MousePointer2,
  TrendingUp,
  BarChart3,
  Calendar as CalendarIcon,
  Globe,
  Target,
  FileText,
} from "lucide-react";

export default function TeamSeoSiteDetailPage() {
  const navigate = useNavigate();
  const { slug: teamSlug, siteId: siteIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const siteId = siteIdParam ? decodeURIComponent(siteIdParam) : "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const {
    data: report,
    isLoading,
    error,
  } = trpc.seoReports.getAutomatedReport.useQuery(
    { siteId, from, to, teamSlug: teamSlug! },
    { enabled: !!teamSlug && !!siteId && !!from && !!to, refetchOnWindowFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-500/10 w-fit mx-auto">
          <BarChart3 className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Failed to load report</h3>
        <p className="text-sm text-muted-foreground">{error?.message || "Data not available for this period."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
    );
  }

  const { summary, topKeywords, topPages, topCountries } = report;

  const formatNumber = (val: number) => val.toLocaleString();
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  return (
    <div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group"
          >
            <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{siteId}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(from), "MMM dd, yyyy")} - {format(new Date(to), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Clicks"
            value={formatNumber(summary.totalClicks)}
            prevValue={summary.totalClicksPrev}
            currentValue={summary.totalClicks}
            icon={<MousePointer2 className="h-4 w-4" />}
            color="blue"
          />
          <MetricCard
            title="Total Impressions"
            value={formatNumber(summary.totalImpressions)}
            prevValue={summary.totalImpressionsPrev}
            currentValue={summary.totalImpressions}
            icon={<Target className="h-4 w-4" />}
            color="green"
          />
          <MetricCard
            title="Average CTR"
            value={formatPercent(summary.averageCtr)}
            prevValue={summary.averageCtrPrev}
            currentValue={summary.averageCtr}
            icon={<TrendingUp className="h-4 w-4" />}
            color="purple"
            isPercent
          />
          <MetricCard
            title="Average Position"
            value={summary.averagePosition.toFixed(1)}
            prevValue={summary.averagePositionPrev}
            currentValue={summary.averagePosition}
            icon={<BarChart3 className="h-4 w-4" />}
            color="orange"
            isInverse
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-none border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-muted/60">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-semibold tracking-tight">Queries leading to your site</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Top performing search terms</CardDescription>
                </div>
                <Search className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 px-6 text-sm uppercase tracking-wider font-bold">Query</TableHead>
                        <TableHead className="h-9 px-4 text-right text-sm uppercase tracking-wider font-bold">Clicks</TableHead>
                        <TableHead className="h-9 px-4 text-right text-sm uppercase tracking-wider font-bold">Impr.</TableHead>
                        <TableHead className="h-9 px-4 text-right text-sm uppercase tracking-wider font-bold">CTR</TableHead>
                        <TableHead className="h-9 px-6 text-right text-sm uppercase tracking-wider font-bold">Pos.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm font-medium">
                      {topKeywords.map((k, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-3 truncate max-w-[200px]">{k.query}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(k.clicks)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(k.impressions)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{k.ctr.toFixed(2)}%</td>
                          <td className="px-6 py-3 text-right font-mono text-muted-foreground">#{k.position.toFixed(1)}</td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-muted/60">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-semibold tracking-tight">Top Pages</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Content that received the most clicks</CardDescription>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 px-6 text-sm uppercase tracking-wider font-bold">URL</TableHead>
                        <TableHead className="h-9 px-4 text-right text-sm uppercase tracking-wider font-bold">Clicks</TableHead>
                        <TableHead className="h-9 px-6 text-right text-sm uppercase tracking-wider font-bold">Impr.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm font-medium">
                      {topPages.top.map((p, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-3 truncate max-w-[300px] text-primary hover:underline">
                            <a href={p.url} target="_blank" rel="noopener noreferrer">{p.url.replace(/^https?:\/\//, "")}</a>
                          </td>
                          <td className="px-4 py-3 text-right">{formatNumber(p.clicks)}</td>
                          <td className="px-6 py-3 text-right text-muted-foreground">{formatNumber(p.impressions)}</td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-none border-muted/60 overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-muted/60">
                <CardTitle className="text-sm font-semibold tracking-tight">Content Performance Trends</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Trending Up
                    </h4>
                    <div className="space-y-2">
                      {topPages.trendingUp.length > 0 ? topPages.trendingUp.map((p, i) => (
                        <div key={i} className="flex flex-col p-2.5 rounded-md bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10">
                          <span className="text-sm font-medium truncate mb-1">{p.url.split("/").pop() || p.url}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{formatNumber(p.clicks)} clicks</span>
                            <span className="text-xs font-bold text-emerald-600">+{p.clicksChange} clicks</span>
                          </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground italic">No gainers found</p>}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 rotate-180" /> Trending Down
                    </h4>
                    <div className="space-y-2">
                      {topPages.trendingDown.length > 0 ? topPages.trendingDown.map((p, i) => (
                        <div key={i} className="flex flex-col p-2.5 rounded-md bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10">
                          <span className="text-sm font-medium truncate mb-1">{p.url.split("/").pop() || p.url}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{formatNumber(p.clicks)} clicks</span>
                            <span className="text-xs font-bold text-rose-600">{p.clicksChange} clicks</span>
                          </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground italic">No losers found</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-muted/60 overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight">Top Countries</CardTitle>
                <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-6 text-sm uppercase font-bold">Country</TableHead>
                      <TableHead className="h-8 px-6 text-right text-sm uppercase font-bold">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-sm font-medium">
                    {topCountries.map((c, i) => (
                      <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-2 uppercase">{c.country}</td>
                        <td className="px-6 py-2 text-right">{formatNumber(c.clicks)}</td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  prevValue,
  currentValue,
  icon,
  color,
  isPercent = false,
  isInverse = false,
}: {
  title: string;
  value: string;
  prevValue: number;
  currentValue: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
  isPercent?: boolean;
  isInverse?: boolean;
}) {
  const diff = currentValue - prevValue;
  const percentChange = prevValue !== 0 ? (diff / prevValue) * 100 : 0;
  const isPositive = isInverse ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
    purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  };

  return (
    <Card className="overflow-hidden border-muted/60 shadow-none hover:border-muted-foreground/20 transition-colors">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <div className={cn("p-1.5 rounded-md border", colorClasses[color])}>
            {icon}
          </div>
          {!isNeutral && (
            <Badge
              variant="outline"
              className={cn(
                "px-1.5 py-0 text-xs font-bold border-transparent",
                isPositive
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
              )}
            >
              {isPositive ? "+" : ""}{percentChange.toFixed(1)}%
            </Badge>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
          <h3 className="text-xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="pt-2 border-t border-muted/40">
          <p className="text-xs text-muted-foreground">vs previous period</p>
        </div>
      </CardContent>
    </Card>
  );
}
