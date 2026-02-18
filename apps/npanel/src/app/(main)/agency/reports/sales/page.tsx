"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
    Calendar as CalendarIcon,
    BarChart3,
    RefreshCw,
    TrendingUp,
    FileText,
    Zap,
    AlertCircle,
    ChevronDown,
    Building2,
    Target,
    MousePointer2,
    Eye,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function SalesReportsPage() {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

    const utils = trpc.useUtils();

    const revenueTrends = trpc.reports.sales.getRevenueTrends.useQuery(
        {
            from: dateRange?.from,
            to: dateRange?.to,
            limit: 30
        },
        { staleTime: 1000 * 60 * 5 }
    );

    const revenueByService = trpc.reports.sales.getRevenueByService.useQuery(
        {
            from: dateRange?.from,
            to: dateRange?.to,
            limit: 10
        },
        { staleTime: 1000 * 60 * 5 }
    );

    const sync = trpc.reports.sales.sync.useMutation({
        onSuccess: () => {
            utils.reports.sales.invalidate();
        }
    });

    const handleRefresh = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        sync.mutate({ period: "DAILY" });
    };

    const trends = revenueTrends.data || [];
    const currentMetrics = trends[0] || {
        totalRevenue: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        taxableAmount: 0,
        taxAmount: 0,
        pendingAmount: 0,
        invoiceCount: 0,
        paidInvoiceCount: 0,
    };

    const formatCurrency = (amount: number | string | any) => {
        const val = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const isLoading = revenueTrends.isLoading || revenueByService.isLoading;

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
                    <h1 className="text-xl font-bold tracking-tight">Sales Reports</h1>
                    <p className="text-xs text-muted-foreground">
                        Comprehensive financial performance and revenue analytics across all invoicing channels.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <MetricCard
                            title="Total Revenue"
                            value={formatCurrency(currentMetrics.totalRevenue)}
                            icon={<TrendingUp className="h-4 w-4" />}
                            color="green"
                            tooltip="Total successfully collected revenue across all periods."
                        />
                        <MetricCard
                            title="Invoiced Amount"
                            value={formatCurrency(currentMetrics.totalInvoiced)}
                            icon={<FileText className="h-4 w-4" />}
                            color="blue"
                        />
                        <MetricCard
                            title="Pending Amount"
                            value={formatCurrency(Number(currentMetrics.totalInvoiced) - Number(currentMetrics.totalPaid))}
                            icon={<AlertCircle className="h-4 w-4" />}
                            color="orange"
                            tooltip="Total outstanding balance from unpaid or partially paid invoices."
                        />
                        <MetricCard
                            title="Taxable Amount"
                            value={formatCurrency(currentMetrics.taxableAmount || 0)}
                            icon={<Zap className="h-4 w-4" />}
                            color="purple"
                            tooltip="Sum of invoice subtotals before tax applied."
                        />
                        <MetricCard
                            title="Monthly Potential"
                            value={formatCurrency(Number(currentMetrics.totalInvoiced) / (trends.length || 1))}
                            icon={<BarChart3 className="h-4 w-4" />}
                            color="blue"
                            tooltip="Projected periodic throughput based on total historical invoicing velocity."
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                        <Card className="lg:col-span-4 border-muted/60 shadow-none overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <CardHeader className="pb-2 bg-muted/5">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight uppercase opacity-60">Revenue Growth</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[300px] w-full mt-4 flex items-end gap-2 pb-6">
                                    {trends.length > 0 ? (
                                        trends.slice().reverse().map((t, i) => (
                                            <div key={i} className="flex-1 group relative">
                                                <div
                                                    className="w-full bg-primary/20 rounded-t-sm transition-all group-hover:bg-primary/40 relative"
                                                    style={{ height: `${Math.max(15, (Number(t.totalRevenue) / Math.max(...trends.map(x => Number(x.totalRevenue)), 1)) * 250)}px` }}
                                                >
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded border shadow-sm whitespace-nowrap z-20">
                                                        {formatCurrency(t.totalRevenue)}
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[10px] font-medium text-muted-foreground text-center truncate">
                                                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/5">
                                            <p className="text-xs text-muted-foreground italic">No historical data available</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3 border-muted/60 shadow-none overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <CardHeader className="pb-2 bg-muted/5">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-bold tracking-tight uppercase opacity-60">Revenue by Service</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {revenueByService.data && revenueByService.data.length > 0 ? (
                                    revenueByService.data.map((s, i) => (
                                        <div key={i} className="space-y-2 group">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{s.serviceType}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{((Number(s.amount) / Math.max(1, Number(currentMetrics.totalInvoiced))) * 100).toFixed(1)}% of total</span>
                                                </div>
                                                <span className="text-xs font-mono font-bold">{formatCurrency(s.amount)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/60 rounded-full transition-all duration-500"
                                                    style={{ width: `${(Number(s.amount) / Math.max(1, ...revenueByService.data!.map(x => Number(x.amount)))) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/5">
                                        <p className="text-xs text-muted-foreground italic">No service data available</p>
                                    </div>
                                )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <Skeleton className="lg:col-span-4 h-80 w-full rounded-xl" />
                    <Skeleton className="lg:col-span-3 h-80 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
