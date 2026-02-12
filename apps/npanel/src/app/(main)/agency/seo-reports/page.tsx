"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  Globe,
  Search,
  TrendingUp,
  TrendingDown,
  MousePointer2,
  BarChart3,
  Calendar as CalendarIcon,
  RefreshCw,
  Target,
  FileText,
  Smartphone,
  Laptop,
  Tablet,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import type { SeoSite } from "./_components/schemas";

// Shadcn UI Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Chart Components
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
} from "recharts";

export default function SeoReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state from URL search params
  const paramSiteId = searchParams.get("id");
  const paramFrom = searchParams.get("from");
  const paramTo = searchParams.get("to");

  const [selectedSiteId, setSelectedSiteId] = React.useState<string>(paramSiteId || "");

  // Date range state
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (paramFrom && paramTo) {
      const fromDate = new Date(paramFrom);
      const toDate = new Date(paramTo);
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        return { from: fromDate, to: toDate };
      }
    }
    return {
      from: subDays(new Date(), 30),
      to: new Date(),
    };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  /**
   * Update URL search parameters
   */
  const updateSearchParams = React.useCallback((updates: Record<string, string | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.replace(`${pathname}${query}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // Sync selection changes to URL
  React.useEffect(() => {
    const updates: Record<string, string | undefined> = {};

    if (selectedSiteId) {
      updates.id = selectedSiteId;
    }

    if (dateRange?.from && dateRange?.to) {
      updates.from = format(dateRange.from, "yyyy-MM-dd");
      updates.to = format(dateRange.to, "yyyy-MM-dd");
    }

    if (Object.keys(updates).length > 0) {
      updateSearchParams(updates);
    }
  }, [selectedSiteId, dateRange, updateSearchParams]);

  // Fetch manageable sites
  const {
    data: sitesData,
    isLoading: isLoadingSites,
    error: sitesError,
    refetch: refetchSites,
  } = trpc.seoReports.listManageableSites.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const sites = sitesData || [];

  // Auto-select first site if available and none selected
  React.useMemo(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].siteUrl);
    }
  }, [sites, selectedSiteId]);

  // Prepare date range for API
  const timeRange = dateRange?.from && dateRange?.to ? {
    from: format(dateRange.from, "yyyy-MM-dd"),
    to: format(dateRange.to, "yyyy-MM-dd"),
  } : undefined;

  // Fetch automated report when site is selected
  const {
    data: reportData,
    isLoading: isLoadingReport,
    error: reportError,
    refetch: refetchReport,
  } = trpc.seoReports.getAutomatedReport.useQuery(
    {
      siteId: selectedSiteId,
      from: timeRange?.from || "",
      to: timeRange?.to || "",
    },
    {
      enabled: !!selectedSiteId && !!timeRange,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const report = reportData;
  const summary = report?.summary;
  const topKeywords = report?.topKeywords || [];
  const topPages = report?.topPages;
  const topCountries = report?.topCountries || [];
  const topDevices = report?.topDevices || [];
  const searchAppearance = report?.searchAppearance || [];
  const opportunities = report?.opportunities || { pageTwo: [], highPotential: [] };
  const sitemaps = report?.sitemaps || [];

  const formatNumber = (val: number) => val.toLocaleString();
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  if (isLoadingSites && !selectedSiteId) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">SEO Reports</h1>
          <p className="text-xs text-muted-foreground">
            Comprehensive SEO performance metrics from Google Search Console.
          </p>
        </div>

        {/* Site Switcher & Date Picker */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
          <div className="w-full md:max-w-md">
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="w-full h-10 shadow-sm border-muted/60">
                <SelectValue placeholder="Select a site">
                  {selectedSiteId && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate block max-w-[200px] md:max-w-[300px] font-medium">
                        {selectedSiteId}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.siteUrl} value={site.siteUrl}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{site.siteUrl}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 w-full md:w-auto justify-start shadow-sm border-muted/60 font-medium whitespace-nowrap">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange?.to ? (
                    format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd") ? (
                      format(dateRange.from, "MMM dd, yyyy")
                    ) : (
                      <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}</>
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shadow-sm border-muted/60"
              onClick={() => {
                refetchSites();
                refetchReport();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoadingReport ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size={32} />
          </div>
        ) : summary ? (
          <div className="mt-8 space-y-12">
            {/* Overview Scorecards */}
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
                isInverse // Lower position is better
              />
            </div>

            {/* Dashboard Layout */}
            <div className="space-y-8">
              {/* Row 1: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Trend */}
                <Card className="lg:col-span-2 shadow-none border-muted/60 overflow-hidden">
                  <CardHeader className="py-4 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-bold tracking-tight">Performance Trend</CardTitle>
                      </div>
                      <CardDescription className="text-[10px]">Daily clicks vs impressions for the selected period</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <PerformanceTrendChart data={report.timeSeries} summary={summary} />
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card className="shadow-none border-muted/60 overflow-hidden">
                  <CardHeader className="py-4 px-6 border-b border-muted/60">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-bold tracking-tight">Device Traffic</CardTitle>
                    </div>
                    <CardDescription className="text-[10px]">Distribution of traffic by device type</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DeviceBreakdown devices={topDevices} />
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Detailed Stats & Actionable Insights */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Top Search Queries */}
                <div className="xl:col-span-2">
                  <Card className="shadow-none border-muted/60 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-muted/60">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-bold tracking-tight">Top Search Queries</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-60">High Traffic</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="h-10 px-6 text-[10px] uppercase tracking-wider font-bold">Query</TableHead>
                            <TableHead className="h-10 px-4 text-right text-[10px] uppercase tracking-wider font-bold">Clicks</TableHead>
                            <TableHead className="h-10 px-4 text-right text-[10px] uppercase tracking-wider font-bold">Impr.</TableHead>
                            <TableHead className="h-10 px-4 text-right text-[10px] uppercase tracking-wider font-bold">CTR</TableHead>
                            <TableHead className="h-10 px-6 text-right text-[10px] uppercase tracking-wider font-bold">Pos.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs font-medium">
                          {topKeywords.map((k, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors border-muted/40 text-[11px]">
                              <td className="px-6 py-2.5 font-bold border-none">{k.query}</td>
                              <td className="px-4 py-2.5 text-right border-none font-black">{formatNumber(k.clicks)}</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground border-none">{formatNumber(k.impressions)}</td>
                              <td className="px-4 py-2.5 text-right font-bold border-none">{k.ctr.toFixed(1)}%</td>
                              <td className="px-6 py-2.5 text-right font-mono text-muted-foreground border-none">#{k.position.toFixed(1)}</td>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Trending & Geo info */}
                <div className="space-y-8">
                  {/* Top Pages */}
                  <Card className="shadow-none border-muted/60 overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-bold tracking-tight">Top Landing Pages</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] opacity-60">Clicks</Badge>
                    </CardHeader>
                    <CardContent className="p-0 font-medium">
                      <Table>
                        <TableBody>
                          {topPages?.top.map((p, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 border-muted/40">
                              <TableCell className="px-6 py-2 border-none">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold truncate max-w-[180px]">{p.url.split('/').pop() || p.url.replace(/^https?:\/\//, '')}</span>
                                  <span className="text-[9px] text-muted-foreground truncate max-w-[180px]">{p.url.replace(/^https?:\/\//, '')}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right px-6 py-2 border-none font-black text-[11px]">
                                {formatNumber(p.clicks)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Low Hanging Fruit */}
                  <Card className="shadow-none border-muted/60 overflow-hidden bg-primary/[0.01]">
                    <CardHeader className="py-4 px-6 border-b border-muted/60 bg-primary/[0.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm font-bold tracking-tight">"Low Hanging Fruit"</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-none bg-blue-50 text-blue-600">Page 2</Badge>
                      </div>
                      <CardDescription className="text-[9px]">Push these positions (11-20) to Page 1 for quick wins.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {opportunities.pageTwo.length > 0 ? opportunities.pageTwo.map((o: any, i: number) => (
                            <TableRow key={i} className="hover:bg-primary/5 transition-colors border-muted/40">
                              <TableCell className="px-6 py-2 border-none">
                                <span className="text-[11px] font-bold">{o.query}</span>
                              </TableCell>
                              <TableCell className="text-right px-6 py-2 border-none">
                                <span className="text-[10px] font-black opacity-60">#{o.position.toFixed(1)}</span>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow><TableCell className="h-12 text-center text-[10px] text-muted-foreground italic">No opportunities found.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* CTR Booster */}
                  <Card className="shadow-none border-muted/60 overflow-hidden bg-amber-500/[0.01]">
                    <CardHeader className="py-4 px-6 border-b border-muted/60 bg-amber-500/[0.02]">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-sm font-bold tracking-tight">CTR Boosting Targets</CardTitle>
                      </div>
                      <CardDescription className="text-[9px]">Keywords with high impressions but low CTR.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {opportunities.highPotential.length > 0 ? opportunities.highPotential.map((o: any, i: number) => (
                            <TableRow key={i} className="hover:bg-amber-500/5 transition-colors border-muted/40">
                              <TableCell className="px-6 py-2 border-none">
                                <span className="text-[11px] font-bold">{o.query}</span>
                              </TableCell>
                              <TableCell className="text-right px-6 py-2 border-none">
                                <span className="text-[10px] font-black text-amber-600">{o.ctr.toFixed(2)}%</span>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow><TableCell className="h-12 text-center text-[10px] text-muted-foreground italic">No targets found.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Row 2.5: Trending Content Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trending Up Pages */}
                <Card className="shadow-none border-muted/60 overflow-hidden bg-emerald-500/[0.01]">
                  <CardHeader className="py-4 px-6 border-b border-muted/60 bg-emerald-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-sm font-bold tracking-tight">Trending Up</CardTitle>
                    </div>
                    <CardDescription className="text-[9px]">Pages gaining the most clicks vs previous period.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {topPages?.trendingUp && topPages.trendingUp.length > 0 ? topPages.trendingUp.slice(0, 5).map((p: any, i: number) => (
                          <TableRow key={i} className="hover:bg-emerald-500/5 transition-colors border-muted/40">
                            <TableCell className="px-6 py-2 border-none">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold truncate max-w-[250px]">{p.url.split('/').pop() || p.url.replace(/^https?:\/\//, '')}</span>
                                <span className="text-[9px] text-muted-foreground truncate max-w-[250px]">{p.url.replace(/^https?:\/\//, '')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-6 py-2 border-none">
                              <span className="text-[11px] font-black text-emerald-600">{formatNumber(p.clicks)}</span>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell className="h-12 text-center text-[10px] text-muted-foreground italic">No trending pages.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Trending Down Pages */}
                <Card className="shadow-none border-muted/60 overflow-hidden bg-rose-500/[0.01]">
                  <CardHeader className="py-4 px-6 border-b border-muted/60 bg-rose-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                      <CardTitle className="text-sm font-bold tracking-tight">Trending Down</CardTitle>
                    </div>
                    <CardDescription className="text-[9px]">Pages losing the most clicks vs previous period.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {topPages?.trendingDown && topPages.trendingDown.length > 0 ? topPages.trendingDown.slice(0, 5).map((p: any, i: number) => (
                          <TableRow key={i} className="hover:bg-rose-500/5 transition-colors border-muted/40">
                            <TableCell className="px-6 py-2 border-none">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold truncate max-w-[250px]">{p.url.split('/').pop() || p.url.replace(/^https?:\/\//, '')}</span>
                                <span className="text-[9px] text-muted-foreground truncate max-w-[250px]">{p.url.replace(/^https?:\/\//, '')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-6 py-2 border-none">
                              <span className="text-[11px] font-black text-rose-600">{formatNumber(p.clicks)}</span>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell className="h-12 text-center text-[10px] text-muted-foreground italic">No trending pages.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Secondary Information (Geo, Search Style, etc) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Geography */}
                <Card className="shadow-none border-muted/60 overflow-hidden">
                  <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold tracking-tight uppercase opacity-60">Top Countries</CardTitle>
                    <Globe className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[200px] scrollbar-default">
                      <Table>
                        <TableBody className="text-[11px] font-bold">
                          {topCountries.map((c, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 border-muted/40 h-8">
                              <td className="px-6 py-1 uppercase">{c.country}</td>
                              <td className="px-6 py-1 text-right">{formatNumber(c.clicks)}</td>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" className="flex" />
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Search Appearance */}
                <Card className="shadow-none border-muted/60 overflow-hidden border-dashed">
                  <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold tracking-tight uppercase opacity-60">Search Appearance</CardTitle>
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody className="text-[11px] font-bold">
                        {searchAppearance.map((a: any, i: number) => (
                          <TableRow key={i} className="hover:bg-muted/30 border-muted/40 h-8">
                            <td className="px-6 py-1 lowercase">{a.appearance.replace(/^SEARCH_APPEARANCE_/, '').replace(/_/g, ' ')}</td>
                            <td className="px-6 py-1 text-right">{formatNumber(a.clicks)}</td>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Sitemap Health */}
                <Card className="shadow-none border-muted/60 overflow-hidden">
                  <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold tracking-tight uppercase opacity-60">Sitemap Health</CardTitle>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {sitemaps.slice(0, 3).map((s: any, i: number) => (
                      <div key={i} className="flex flex-col gap-2 border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold truncate max-w-[120px]">{s.path.split('/').pop()}</span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] px-1.5 py-0 font-bold",
                            s.status === "Success" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                              s.status.includes("warning") ? "text-amber-600 bg-amber-50 border-amber-100" :
                                "text-rose-600 bg-rose-50 border-rose-100"
                          )}>{s.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                          {s.errors > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-rose-500" />
                              {s.errors} error{s.errors !== 1 ? 's' : ''}
                            </span>
                          )}
                          {s.warnings > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              {s.warnings} warning{s.warnings !== 1 ? 's' : ''}
                            </span>
                          )}
                          {!s.errors && !s.warnings && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              Healthy
                            </span>
                          )}
                        </div>
                        {s.lastDownloaded && (
                          <span className="text-[8px] text-muted-foreground">
                            Updated: {format(new Date(s.lastDownloaded), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-5 rounded-full bg-muted/30 mb-5">
              <Search className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">No search data available</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              We couldn't find any performance data for "{selectedSiteId}" during this period. Verify your Search Console configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Performance Trend Chart (Glowing Line Chart)
 */
function PerformanceTrendChart({ data, summary }: { data: any[], summary: any }) {
  const chartConfig = {
    clicks: { label: "Clicks", color: "var(--chart-2)" },
    impressions: { label: "Impressions", color: "var(--chart-5)" },
  } satisfies ChartConfig;

  // Ensure data is sorted by date
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="h-[280px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={sortedData}
          margin={{ top: 10, left: 12, right: 12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(str) => {
              try {
                return format(new Date(str), "MMM dd");
              } catch {
                return str;
              }
            }}
            tick={{ fontSize: 10 }}
            minTickGap={30}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line
            dataKey="impressions"
            type="bump"
            stroke="var(--color-impressions)"
            dot={false}
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
          <Line
            dataKey="clicks"
            type="bump"
            stroke="var(--color-clicks)"
            dot={false}
            strokeWidth={2.5}
            filter="url(#rainbow-line-glow)"
          />
          <defs>
            <filter id="rainbow-line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </LineChart>
      </ChartContainer>
    </div>
  );
}

/**
 * Traffic by Device Pie Chart
 */
function DeviceBreakdown({ devices }: { devices: any[] }) {
  const chartConfig = {
    desktop: { label: "Desktop", color: "hsl(220, 70%, 50%)" },  // Blue
    mobile: { label: "Mobile", color: "hsl(142, 71%, 45%)" },   // Green
    tablet: { label: "Tablet", color: "hsl(280, 65%, 60%)" },   // Purple
    other: { label: "Other", color: "hsl(25, 95%, 53%)" },      // Orange
  } satisfies ChartConfig;

  // Map device data and assign colors from chartConfig
  // Handle uppercase device names from GSC API (DESKTOP, MOBILE, TABLET)
  const data = devices.map((d) => {
    const deviceKey = (d.device || '').toLowerCase() as keyof typeof chartConfig;
    const colorValue = chartConfig[deviceKey]?.color || "hsl(var(--chart-4))"; // fallback to 'other' color

    return {
      name: deviceKey,
      label: chartConfig[deviceKey]?.label || d.device,
      value: d.clicks,
      fill: colorValue,
    };
  }).sort((a, b) => b.value - a.value);

  // Debug: log to console to see what data we're getting
  console.log('Device breakdown data:', { devices, data });

  return (
    <div className="h-[280px] w-full mt-4 flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            strokeWidth={5}
            stroke="hsl(var(--background))"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

/**
 * Meta-style Metric Card
 */
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

  // For inverse metrics (like position), a negative change is good (Trending Up)
  const isPositive = isInverse ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
    purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  };

  return (
    <Card className="overflow-hidden border-muted/60 shadow-none hover:border-muted-foreground/10 transition-colors">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <div className={cn("p-1.5 rounded-md border", colorClasses[color])}>
            {icon}
          </div>
          {!isNeutral && (
            <Badge
              variant="outline"
              className={cn(
                "px-1.5 py-0 text-[10px] font-bold border-transparent",
                isPositive
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              )}
            >
              {isPositive ? "+" : ""}{percentChange.toFixed(1)}%
            </Badge>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
          <h3 className="text-xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="pt-2 border-t border-muted/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
            vs previous period
          </p>
          {!isNeutral && (
            <p className={cn(
              "text-[9px] font-bold mt-0.5",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}>
              {isPositive ? "+" : ""}{Math.abs(diff).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
