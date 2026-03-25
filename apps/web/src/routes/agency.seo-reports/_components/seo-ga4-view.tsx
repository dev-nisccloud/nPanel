"use client";

import * as React from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/utils/trpc";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
    TrendingUp,
    Target,
    RefreshCw,
    Laptop,
    Globe,
    FileText,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    MousePointer2,
    Calendar as CalendarIcon,
    Zap,
    BarChart3,
    Info,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    CartesianGrid,
    XAxis,
    Line,
    LineChart,
    PieChart,
    Pie,
    Cell,
} from "recharts";

/** GA4 property from listGa4Properties (independent of GSC). */
type Ga4Property = { propertyId: string; displayName: string; defaultUrl: string | null };

export function SeoGa4View() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();

    const paramGa4Id = searchParams.get("ga4_id");
    const paramFrom = searchParams.get("from");
    const paramTo = searchParams.get("to");

    const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>(paramGa4Id ?? "");

    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
        if (paramFrom && paramTo) {
            const fromDate = new Date(paramFrom);
            const toDate = new Date(paramTo);
            if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
                return { from: fromDate, to: toDate };
            }
        }
        return {
            from: subDays(new Date(), 30),
            to: new Date(),
        };
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

    const { data: ga4Properties = [], isLoading: isLoadingProperties } = trpc.seoReports.listGa4Properties.useQuery(
        undefined,
        { refetchOnWindowFocus: false, retry: 1 }
    );

    const updateSearchParams = React.useCallback(
        (updates: Record<string, string | undefined>) => {
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            for (const [key, value] of Object.entries(updates)) {
                if (value) current.set(key, value);
                else current.delete(key);
            }
            const search = current.toString();
            navigate(`${pathname}${search ? `?${search}` : ""}`, { replace: true, preventScrollReset: true });
        },
        [searchParams, pathname, navigate]
    );

    React.useEffect(() => {
        const updates: Record<string, string | undefined> = {};
        if (selectedPropertyId) updates.ga4_id = selectedPropertyId;
        if (dateRange?.from && dateRange?.to) {
            updates.from = format(dateRange.from, "yyyy-MM-dd");
            updates.to = format(dateRange.to, "yyyy-MM-dd");
        }
        if (Object.keys(updates).length > 0) updateSearchParams(updates);
    }, [selectedPropertyId, dateRange, updateSearchParams]);

    React.useEffect(() => {
        if (ga4Properties.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(ga4Properties[0].propertyId);
        }
    }, [ga4Properties, selectedPropertyId]);

    const timeRange =
        dateRange?.from && dateRange?.to
            ? { from: format(dateRange.from, "yyyy-MM-dd"), to: format(dateRange.to, "yyyy-MM-dd") }
            : undefined;

    const {
        data: reportData,
        isLoading: isLoadingReport,
        refetch: refetchReport,
    } = trpc.seoReports.getGa4Report.useQuery(
        {
            ga4PropertyId: selectedPropertyId,
            from: timeRange?.from ?? "",
            to: timeRange?.to ?? "",
        },
        {
            enabled: !!selectedPropertyId && !!timeRange?.from && !!timeRange?.to,
            refetchOnWindowFocus: false,
            retry: 1,
        }
    );

    const report = reportData;
    const summary = report?.summary;
    const topPages = report?.topPages;
    const topCountries = report?.topCountries ?? [];

    const formatNumber = (val: number) => val.toLocaleString();
    const formatPercent = (val: number) => `${val.toFixed(2)}%`;
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    if (isLoadingProperties) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size={32} />
            </div>
        );
    }

    if (ga4Properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-muted-foreground">
                    No GA4 properties available. Connect Google Analytics 4 and ensure your account has access.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6 text-foreground">

            {/* GA4 Property selector & Date Picker */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
                <div className="w-full md:max-w-md space-y-2">
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-full h-10 shadow-sm border-muted/60">
                            <SelectValue placeholder="Select a GA4 property">
                                {selectedPropertyId && (
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate block max-w-[200px] md:max-w-[300px] font-medium">
                                            {ga4Properties.find((p: Ga4Property) => p.propertyId === selectedPropertyId)?.displayName ?? selectedPropertyId}
                                        </span>
                                    </div>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {ga4Properties.map((prop: Ga4Property) => (
                                <SelectItem key={prop.propertyId} value={prop.propertyId}>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        <span>{prop.displayName}</span>
                                        {prop.defaultUrl && (
                                            <span className="text-muted-foreground text-xs truncate max-w-[120px]">
                                                ({prop.defaultUrl})
                                            </span>
                                        )}
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
                    {/* Overview Scorecards - GA4 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Google Analytics 4 Performance</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Organic Sessions"
                                value={formatNumber(summary.totalSessions ?? 0)}
                                prevValue={summary.totalSessionsPrev ?? 0}
                                currentValue={summary.totalSessions ?? 0}
                                icon={<Laptop className="h-4 w-4" />}
                                color="indigo"
                            />
                            <MetricCard
                                title="Total Users"
                                value={formatNumber(summary.totalUsers ?? 0)}
                                prevValue={summary.totalUsersPrev ?? 0}
                                currentValue={summary.totalUsers ?? 0}
                                icon={<MousePointer2 className="h-4 w-4" />}
                                color="cyan"
                            />
                            <MetricCard
                                title="Engagement Rate"
                                value={formatPercent(summary.averageEngagementRate ?? 0)}
                                prevValue={summary.averageEngagementRatePrev ?? 0}
                                currentValue={summary.averageEngagementRate ?? 0}
                                icon={<Zap className="h-4 w-4" />}
                                color="yellow"
                                isPercent
                            />
                            <MetricCard
                                title="Conversions"
                                value={formatNumber(summary.totalConversions ?? 0)}
                                prevValue={summary.totalConversionsPrev ?? 0}
                                currentValue={summary.totalConversions ?? 0}
                                icon={<Target className="h-4 w-4" />}
                                color="emerald"
                            />
                            <MetricCard
                                title="Bounce Rate"
                                value={formatPercent(summary.averageBounceRate ?? 0)}
                                prevValue={summary.averageBounceRatePrev ?? 0}
                                currentValue={summary.averageBounceRate ?? 0}
                                icon={<TrendingUp className="h-4 w-4" />}
                                color="orange"
                                isPercent
                                isInverse
                            />
                            <MetricCard
                                title="Avg. Session Duration"
                                value={formatDuration(summary.averageSessionDuration ?? 0)}
                                prevValue={summary.averageSessionDurationPrev ?? 0}
                                currentValue={summary.averageSessionDuration ?? 0}
                                icon={<RefreshCw className="h-4 w-4" />}
                                color="purple"
                            />
                        </div>
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
                                            <CardTitle className="text-sm font-bold tracking-tight">Traffic Trend</CardTitle>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground">Daily sessions and users</CardDescription>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Traffic trend info">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[240px] text-balance">
                                            <p>Daily organic sessions and users from Google. Shows how many people visited and how that changes over time.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <Ga4PerformanceChart data={report.timeSeries} />
                                </CardContent>
                            </Card>

                            {/* Device Breakdown */}
                            <Card className="shadow-none border-muted/60 overflow-hidden">
                                <CardHeader className="py-4 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Laptop className="h-4 w-4 text-primary" />
                                            <CardTitle className="text-sm font-bold tracking-tight">Device Traffic</CardTitle>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground">Organic traffic by device type</CardDescription>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Device traffic info">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[240px] text-balance">
                                            <p>Organic traffic split by device: desktop, mobile, and tablet. Use this to see which devices drive the most sessions.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <DeviceBreakdown devices={report.topDevices} />
                                </CardContent>
                            </Card>

                            {/* Top Countries */}
                            <Card className="shadow-none border-muted/60 overflow-hidden">
                                <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary" />
                                            <CardTitle className="text-sm font-bold tracking-tight">Top Countries</CardTitle>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground opacity-60">By organic search</CardDescription>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Top countries info">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[240px] text-balance">
                                            <p>Countries sending the most organic traffic. Geographic breakdown of your GA4 audience.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[280px] scrollbar-default">
                                        <Table>
                                            <TableBody className="text-sm font-bold">
                                                {topCountries.map((c: any, i: number) => (
                                                    <TableRow key={i} className="hover:bg-muted/30 border-muted/40 h-8">
                                                        <td className="px-6 py-1 uppercase">{c.country}</td>
                                                        <td className="px-6 py-1 text-right">{formatNumber(c.clicks)} <span className="text-xs font-normal opacity-50 ml-1">Sessions</span></td>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <ScrollBar orientation="vertical" className="flex" />
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* GA4 Specific Insights Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Potential High-Value Pages (High Engagement) */}
                            <Card className="shadow-none border-muted/60 bg-emerald-50/10 dark:bg-emerald-500/5">
                                <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                        <CardTitle className="text-sm font-bold tracking-tight">Highly Engaged Pages</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 uppercase tracking-tighter">High Impact</Badge>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Highly engaged pages info">
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-[240px] text-balance">
                                                <p>Pages with above-average engagement or conversions. Surfaces content that keeps users engaged.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-3">
                                        {report.topPages.top
                                            .filter((p: any) => p.engagementRate > (summary.averageEngagementRate || 0))
                                            .slice(0, 3)
                                            .map((p: any, i: number) => (
                                                <li key={i} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold truncate max-w-[200px]">{p.url.split('/').pop() || p.url}</span>
                                                        <span className="text-xs font-medium text-emerald-600">{(p.engagementRate).toFixed(1)}% Eng.</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground italic">Exceptional retention. These pages are keeping users engaged.</span>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Bounce Rate Warnings (High Bounce) */}
                            <Card className="shadow-none border-muted/60 bg-rose-50/10 dark:bg-rose-500/5">
                                <CardHeader className="py-3 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-rose-600" />
                                        <CardTitle className="text-sm font-bold tracking-tight">Bounce Rate Alerts</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs bg-rose-100 text-rose-700 border-rose-200 uppercase tracking-tighter">Needs Focus</Badge>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Bounce rate alerts info">
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-[240px] text-balance">
                                                <p>Pages with high bounce rates from organic search. Good candidates to improve relevance or load speed.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-3">
                                        {report.topPages.top
                                            .filter((p: any) => (p.bounceRate || 0) > (summary.averageBounceRate || 70))
                                            .slice(0, 3)
                                            .map((p: any, i: number) => (
                                                <li key={i} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold truncate max-w-[200px]">{p.url.split('/').pop() || p.url}</span>
                                                        <span className="text-xs font-medium text-rose-600">{(p.bounceRate || 0).toFixed(1)}% Bounce</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground italic">High sessions but high drop-off. Audit content or page load speed.</span>
                                                </li>
                                            ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Row 2: Top Pages with GA4 Metrics */}
                        <Card className="shadow-none border-muted/60 overflow-hidden">
                            <CardHeader className="py-4 px-6 border-b border-muted/60 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight">Top Performance Pages</CardTitle>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Top performance pages info">
                                            <Info className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[240px] text-balance">
                                        <p>Pages with the most sessions, engagement, and conversions from organic search. Your best-performing content in GA4.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent className="p-0 font-medium">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="h-10 px-6 text-sm uppercase tracking-wider font-bold">Page</TableHead>
                                            <TableHead className="h-10 px-4 text-right text-sm uppercase tracking-wider font-bold">Sessions</TableHead>
                                            <TableHead className="h-10 px-4 text-right text-sm uppercase tracking-wider font-bold">Engagement</TableHead>
                                            <TableHead className="h-10 px-4 text-right text-sm uppercase tracking-wider font-bold">Bounce Rate</TableHead>
                                            <TableHead className="h-10 px-4 text-right text-sm uppercase tracking-wider font-bold">Avg. Duration</TableHead>
                                            <TableHead className="h-10 px-4 text-right text-sm uppercase tracking-wider font-bold">Conversions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topPages?.top.slice(0, 10).map((p: any, i: number) => (
                                            <TableRow key={i} className="hover:bg-muted/30 border-muted/40">
                                                <TableCell className="px-6 py-2 border-none">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold truncate max-w-[280px]">{p.url.split('/').pop() || p.url.replace(/^https?:\/\//, '')}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[280px]">{p.url.replace(/^https?:\/\//, '')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-2 border-none font-black text-sm">
                                                    {formatNumber(p.sessions)}
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-2 border-none font-medium text-sm">
                                                    {p.engagementRate.toFixed(1)}%
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-2 border-none font-medium text-sm">
                                                    {p.bounceRate ? `${p.bounceRate.toFixed(1)}%` : "0%"}
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-2 border-none font-medium text-sm">
                                                    {formatDuration(p.averageSessionDuration || 0)}
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-2 border-none font-medium text-sm">
                                                    {formatNumber(p.conversions)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="p-5 rounded-full bg-muted/30 mb-5">
                        <Laptop className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">No analytics data available</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        No GA4 data for this property during the selected period.
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * GA4 Traffic Chart
 */
function Ga4PerformanceChart({ data }: { data: any[] }) {
    const chartConfig = {
        sessions: { label: "Sessions", color: "hsl(217, 91%, 60%)" },
        users: { label: "Users", color: "hsl(190, 90%, 50%)" },
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
                    <ChartTooltip cursor={false} content={<ChartTooltipContent config={chartConfig} />} />
                    <Line
                        dataKey="sessions"
                        type="monotone"
                        stroke="var(--color-sessions)"
                        strokeWidth={2}
                        dot={false}
                        fill="url(#fade)"
                    />
                    <Line
                        dataKey="totalUsers"
                        type="monotone"
                        stroke="var(--color-users)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                    />
                </LineChart>
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
    color: "blue" | "green" | "purple" | "orange" | "indigo" | "cyan" | "yellow" | "emerald";
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
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
        cyan: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
        yellow: "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
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
                                "px-1.5 py-0 text-xs font-bold border-transparent",
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
                    <h3 className="text-xl font-bold tracking-tight">{value}</h3>
                </div>
                <div className="pt-2 border-t border-muted/40">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        vs previous period
                    </p>
                    {!isNeutral && (
                        <p className={cn(
                            "text-xs font-bold mt-0.5",
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

/**
 * Traffic by Device Pie Chart (same handling as Search Console Device Traffic)
 */
function DeviceBreakdown({ devices }: { devices: any[] }) {
    const chartConfig = {
        desktop: { label: "Desktop", color: "hsl(220, 70%, 50%)" },
        mobile: { label: "Mobile", color: "hsl(142, 71%, 45%)" },
        tablet: { label: "Tablet", color: "hsl(280, 65%, 60%)" },
        other: { label: "Other", color: "hsl(25, 95%, 53%)" },
    } satisfies ChartConfig;

    const data = devices.map((d) => {
        const deviceKey = (d.device || "").toLowerCase() as keyof typeof chartConfig;
        const colorValue = chartConfig[deviceKey]?.color ?? chartConfig.other.color;
        return {
            name: deviceKey,
            label: chartConfig[deviceKey]?.label ?? d.device,
            value: d.clicks,
            fill: colorValue,
        };
    }).sort((a, b) => b.value - a.value);

    return (
        <div className="h-[280px] w-full mt-4 flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel config={chartConfig} />} />
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
