"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
    Calendar as CalendarIcon,
    BarChart3,
    RefreshCw,
    TrendingUp,
    Zap,
    FileCheck,
    Clock,
    Target,
    Layers,
    Activity,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreativeReportsPage() {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

    const utils = trpc.useUtils();

    const productionStats = trpc.reports.creative.getProductionStats.useQuery(
        {
            from: dateRange?.from,
            to: dateRange?.to,
            limit: 30
        },
        { staleTime: 1000 * 60 * 5 }
    );

    const sync = trpc.reports.creative.sync.useMutation({
        onSuccess: () => {
            utils.reports.creative.invalidate();
        }
    });

    const handleRefresh = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        sync.mutate({ period: "DAILY" });
    };

    const stats = productionStats.data || [];
    const latestStats = stats[0] || {
        assetsCreated: 0,
        assetsApproved: 0,
        versionsCreated: 0,
        avgVelocityDays: 0,
    };

    const totalAssets = stats.reduce((sum, s) => sum + s.assetsCreated, 0);
    const totalApproved = stats.reduce((sum, s) => sum + s.assetsApproved, 0);

    const isLoading = productionStats.isLoading;

    if (isLoading) {
        return <ReportsSkeleton />;
    }

    return (
        <div
            className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans"
            onClick={() => handleRefresh()}
        >
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-bold tracking-tight">Creative Analytics</h1>
                    <p className="text-xs text-muted-foreground">
                        Strategic tracking of asset velocity, versioning, and approval throughput across the production pipeline.
                    </p>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 w-full md:w-auto justify-start shadow-sm border-muted/60 font-medium whitespace-nowrap px-4">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
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
                            <PopoverContent className="w-auto p-0" align="start">
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
                            className="h-10 w-10 shadow-sm border-muted/60 shrink-0"
                            onClick={(e) => handleRefresh(e)}
                            disabled={sync.isPending}
                        >
                            <RefreshCw className={cn("h-4 w-4", sync.isPending && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="mt-8 space-y-12">
                    {/* KPI Scorecards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <MetricCard
                            title="Assets Created"
                            value={String(totalAssets)}
                            icon={<Zap className="h-4 w-4" />}
                            color="blue"
                            tooltip="Total assets initiated across all production channels."
                        />
                        <MetricCard
                            title="Approval Rate"
                            value={`${totalAssets > 0 ? ((totalApproved / totalAssets) * 100).toFixed(1) : 0}%`}
                            icon={<FileCheck className="h-4 w-4" />}
                            color="green"
                            tooltip="Percentage of created assets that have reached final sign-off."
                        />
                        <MetricCard
                            title="Avg. Velocity"
                            value={`${(latestStats.avgVelocityDays || 0).toFixed(1)} Days`}
                            icon={<Clock className="h-4 w-4" />}
                            color="orange"
                            tooltip="Average time from asset creation to final approval."
                        />
                        <MetricCard
                            title="Total Versions"
                            value={String(stats.reduce((sum, s) => sum + s.versionsCreated, 0))}
                            icon={<Layers className="h-4 w-4" />}
                            color="purple"
                            tooltip="Total number of asset iterations and file versions processed."
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-muted/60 shadow-none overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <CardHeader className="pb-2 bg-muted/5">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight uppercase opacity-60">Production Pipeline Trends</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[350px] w-full mt-4 flex items-end gap-3 pb-8 px-2">
                                    {stats.length > 0 ? (
                                        stats.slice().reverse().map((s, i) => (
                                            <div key={i} className="flex-1 group relative flex flex-col justify-end">
                                                <div className="flex items-end gap-1 h-full">
                                                    <div
                                                        className="flex-1 bg-primary/20 rounded-t-sm transition-all group-hover:bg-primary/30 relative"
                                                        style={{ height: `${Math.max(10, (s.assetsCreated / Math.max(...stats.map(x => x.assetsCreated), 1)) * 100)}%` }}
                                                    >
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded border shadow-sm whitespace-nowrap z-20">
                                                            {s.assetsCreated} Created
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="flex-1 bg-primary/50 rounded-t-sm transition-all group-hover:bg-primary/70 relative"
                                                        style={{ height: `${Math.max(5, (s.assetsApproved / Math.max(...stats.map(x => x.assetsCreated), 1)) * 100)}%` }}
                                                    >
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded border shadow-sm whitespace-nowrap z-20">
                                                            {s.assetsApproved} Approved
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-[9px] font-bold text-muted-foreground text-center truncate uppercase tracking-tighter">
                                                    {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/5">
                                            <p className="text-xs text-muted-foreground italic">No historical production data available</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-4 border-t border-muted/40">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-primary/20 rounded-sm" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Assets Created</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-primary/50 rounded-sm" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Assets Approved</span>
                                    </div>
                                </div>
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
    icon,
    color,
    tooltip,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "blue" | "green" | "purple" | "orange";
    tooltip?: string;
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
        purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
        orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    };

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Card className="overflow-hidden border-muted/60 shadow-none hover:border-muted-foreground/10 transition-colors group cursor-default" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                            <div className="flex items-center justify-between">
                                <div className={cn("p-1.5 rounded-md border transition-colors", colorClasses[color])}>
                                    {icon}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 group-hover:text-primary transition-colors">{title}</p>
                                <h3 className="text-xl font-bold tracking-tight">{value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                {tooltip && (
                    <TooltipContent className="max-w-[200px] text-[10px] p-2">
                        {tooltip}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

function ReportsSkeleton() {
    return (
        <div className="@container/main flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96 font-sans" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        </div>
    );
}
