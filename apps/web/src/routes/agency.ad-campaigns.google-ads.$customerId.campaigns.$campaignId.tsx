"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { format, parseISO } from "date-fns";
import {
    Target,
    Layers,
    FileText,
    Calendar as CalendarIcon,
    TrendingUp,
    MapPin,
    Users,
    ArrowLeft,
    BarChart3,
    Activity,
    ChevronDown,
    ChevronUp,
    MousePointer2,
    Building2,
    Globe,
    Clock,
    DollarSign,
    Map as MapIcon,
    Palette
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Label,
} from "recharts";

/** Format customer ID with dashes for display (XXXXXXXXXX -> XXX-XXX-XXXX) */
function formatCustomerIdDisplay(customerId: string): string {
    const raw = customerId.replace(/-/g, "");
    return raw.length === 10
        ? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
        : customerId;
}

export default function GoogleAdsCampaignPage() {
    const params = useParams();
    const navigate = useNavigate();
    const customerId = (params.customerId as string) || "";
    const campaignId = (params.campaignId as string) || "";

    // Date range (Matches global state pattern)
    const [timeRange] = React.useState({
        since: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
        until: format(new Date(), "yyyy-MM-dd"),
    });

    // Fetch campaign details with metrics by filtering listCampaigns
    const {
        data: campaignsData,
        isLoading: isLoadingCampaigns,
        error: campaignsError,
    } = trpc.googleAds.campaigns.listCampaigns.useQuery(
        { customerId, timeRange },
        { enabled: !!customerId && !!campaignId, refetchOnWindowFocus: false }
    );

    const campaign = React.useMemo(() => {
        return (campaignsData?.data || []).find((c: any) => c.id === campaignId);
    }, [campaignsData, campaignId]);

    // Fetch ad groups
    const {
        data: adGroupsData,
        isLoading: isLoadingAdGroups,
        error: adGroupsError,
    } = trpc.googleAds.adGroups.listAdGroups.useQuery(
        { customerId, campaignId, timeRange },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const adGroups = adGroupsData?.data || [];

    // Fetch trends and breakdowns
    const { data: dailyPerformance, isLoading: isLoadingDaily } = trpc.googleAds.insights.getDailyPerformance.useQuery(
        { customerId, campaignId, timeRange },
        { enabled: !!campaignId, refetchOnWindowFocus: false }
    );

    const { data: genderBreakdown, isLoading: isLoadingGender } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'gender' },
        { enabled: !!campaignId, refetchOnWindowFocus: false }
    );

    const { data: deviceBreakdown, isLoading: isLoadingDevice } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'device' },
        { enabled: !!campaignId, refetchOnWindowFocus: false }
    );

    const { data: regionBreakdown, isLoading: isLoadingRegion } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'region' },
        { enabled: !!campaignId, refetchOnWindowFocus: false }
    );

    const { data: ageRangeBreakdown, isLoading: isLoadingAgeRange } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'age_range' },
        { enabled: !!campaignId, refetchOnWindowFocus: false }
    );

    // Fetch account details for account name
    const { data: accountDetails } = trpc.googleAds.accounts.getAccountDetails.useQuery(
        { customerId },
        { enabled: !!customerId, refetchOnWindowFocus: false }
    );

    React.useEffect(() => {
        if (campaignsError) toast.error(campaignsError.message || "Failed to load campaign");
        if (adGroupsError) toast.error(adGroupsError.message || "Failed to load ad groups");
    }, [campaignsError, adGroupsError]);

    const currency = "USD";

    if (isLoadingCampaigns && !campaign) {
        return (
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-24">
                        <Spinner size={32} />
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign && !isLoadingCampaigns) {
        return (
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
                <div className="w-full max-w-7xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Not Found</CardTitle>
                            <CardDescription>We couldn't find the campaign details for ID: {campaignId}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate(`/agency/ad-campaigns/google-ads/${customerId}`)} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        const statusUpper = status?.toUpperCase() || "";
        if (statusUpper === "ACTIVE" || statusUpper === "ENABLED") {
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full";
        }
        if (statusUpper === "PAUSED") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 font-sans rounded-full";
        if (statusUpper === "REMOVED" || statusUpper === "DELETED") return "destructive";
        return "";
    };

    const formatGoogleDate = (yyyyMMdd: string | undefined): string => {
        if (!yyyyMMdd) return "No date";
        try {
            const normalized = yyyyMMdd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
            return format(new Date(normalized), "MMM dd, yyyy");
        } catch {
            return yyyyMMdd;
        }
    };

    const performanceChartConfig = {
        spend: { label: "Spend", color: "var(--chart-3)" },
        impressions: { label: "Impressions", color: "var(--chart-2)" },
        clicks: { label: "Clicks", color: "var(--chart-1)" },
    } satisfies ChartConfig;

    const breakdownChartConfig = {
        value: { label: "Impressions" },
    } satisfies ChartConfig;

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans">
            <div className="w-full max-w-7xl mx-auto space-y-12">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group text-xs font-bold uppercase tracking-wider"
                        onClick={() => navigate(`/agency/ad-campaigns/google-ads/${customerId}`)}
                    >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                        Back to Account
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight truncate">
                                    {campaign?.name || `Campaign ${campaignId}`}
                                </h1>
                                {campaign?.status && (
                                    <Badge
                                        variant={getStatusStyles(campaign.status) === "destructive" ? "destructive" : "outline"}
                                        className={cn("text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider", getStatusStyles(campaign.status))}
                                    >
                                        {campaign.status}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-medium text-[13px]">
                                    <Building2 className="h-3.5 w-3.5 opacity-60" />
                                    <span>{accountDetails?.data?.accountName || formatCustomerIdDisplay(customerId)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-medium text-[13px]">
                                    <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
                                    <span>
                                        {formatGoogleDate(campaign?.start_date)} — {campaign?.end_date ? formatGoogleDate(campaign.end_date) : "Ongoing"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Overview */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Overview</h2>
                    </div>

                    {/* Overview Scorecards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <MetricCard
                            title="Impressions"
                            value={parseInt(campaign?.insights?.impressions || "0").toLocaleString()}
                            icon={<Target className="h-4 w-4" />}
                            color="purple"
                        />
                        <MetricCard
                            title="Clicks"
                            value={parseInt(campaign?.insights?.clicks || "0").toLocaleString()}
                            icon={<MousePointer2 className="h-4 w-4" />}
                            color="green"
                        />
                        <MetricCard
                            title="Amount Spent"
                            value={new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(campaign?.insights?.cost || "0"))}
                            icon={<DollarSign className="h-4 w-4" />}
                            color="emerald"
                        />
                        <MetricCard
                            title="Avg CPC"
                            value={new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(campaign?.insights?.cpc || "0"))}
                            icon={<BarChart3 className="h-4 w-4" />}
                            color="orange"
                        />
                        <MetricCard
                            title="Avg CTR"
                            value={`${parseFloat(campaign?.insights?.ctr || "0").toFixed(2)}%`}
                            icon={<TrendingUp className="h-4 w-4" />}
                            color="indigo"
                        />
                        <MetricCard
                            title="Conversions"
                            value={parseInt(campaign?.insights?.conversions || "0").toLocaleString()}
                            icon={<Activity className="h-4 w-4" />}
                            color="blue"
                        />
                    </div>
                </div>

                {/* Section: Ad Groups (Accordion Style) - Moved up */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Ad Groups & Ads</h2>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold opacity-40 border-dashed rounded-full px-3">
                            {adGroups.length} AD GROUPS
                        </Badge>
                    </div>

                    {isLoadingAdGroups ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : adGroups.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/5 py-16">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <Layers className="h-10 w-10 text-muted-foreground/20 mb-4" />
                                <h3 className="text-sm font-bold opacity-60">No Ad Groups Found</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">No active or paused ad groups were identified for this campaign.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {adGroups.map((adGroup: any) => (
                                <AdGroupAccordionItem
                                    key={adGroup.id}
                                    adGroup={adGroup}
                                    customerId={customerId}
                                    currency={currency}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Performance Trends */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Performance Trends</h2>
                    </div>

                    <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                        <CardHeader className="border-b border-muted/60 py-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold">Daily Activity</CardTitle>
                                    <CardDescription className="text-xs">Impressions and Clicks over time</CardDescription>
                                </div>
                                <Activity className="h-5 w-5 text-muted-foreground opacity-60" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            {isLoadingDaily ? (
                                <Skeleton className="h-[350px] w-full" />
                            ) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
                                <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
                                    <LineChart data={dailyPerformance.data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(val) => val ? format(parseISO(val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), 'MMM dd') : ''}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Line
                                            type="monotone"
                                            dataKey="impressions"
                                            stroke="var(--chart-2)"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: "var(--chart-2)", strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="clicks"
                                            stroke="var(--chart-1)"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground italic text-sm border border-dashed rounded-lg bg-background">
                                    No performance data available for this range
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col">
                            <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Daily Spend</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-6">
                                {isLoadingDaily ? (
                                    <Skeleton className="h-full w-full" />
                                ) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
                                    <ChartContainer config={performanceChartConfig} className="h-full w-full">
                                        <AreaChart data={dailyPerformance.data}>
                                            <defs>
                                                <linearGradient id="fillSpendTop" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 9 }}
                                                tickFormatter={(val) => val ? format(parseISO(val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), 'MMM dd') : ''}
                                            />
                                            <YAxis hide />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area
                                                type="monotone"
                                                dataKey="spend"
                                                stroke="var(--chart-3)"
                                                fillOpacity={1}
                                                fill="url(#fillSpendTop)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col">
                            <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Gender</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-6 text-center">
                                {isLoadingGender ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Skeleton className="h-24 w-24 rounded-full" />
                                    </div>
                                ) : genderBreakdown?.data && genderBreakdown.data.length > 0 ? (
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                        <PieChart>
                                            <Pie
                                                data={genderBreakdown.data
                                                    .filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || "0") > 0)
                                                    .map((item: any) => ({
                                                        name: item.gender,
                                                        value: parseInt(item.impressions || "0"),
                                                    }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                paddingAngle={5}
                                            >
                                                {genderBreakdown.data
                                                    .filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || "0") > 0)
                                                    .map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                                                    ))}
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                            const total = (genderBreakdown?.data || [])
                                                                .filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || "0") > 0)
                                                                .reduce((acc: number, curr: any) => acc + parseInt(curr.impressions || "0"), 0);
                                                            return (
                                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-sm font-bold">
                                                                        {total > 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                                                                    </tspan>
                                                                </text>
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col">
                            <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Devices</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-6">
                                {isLoadingDevice ? (
                                    <Skeleton className="h-full w-full" />
                                ) : deviceBreakdown?.data && deviceBreakdown.data.length > 0 ? (
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                        <BarChart
                                            data={deviceBreakdown.data
                                                .sort((a: any, b: any) => parseInt(b.impressions || '0') - parseInt(a.impressions || '0'))
                                                .map((item: any) => ({
                                                    name: item.device || 'Unknown',
                                                    value: parseInt(item.impressions || '0'),
                                                }))}
                                            layout="vertical"
                                            margin={{ left: 10, right: 10 }}
                                        >
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} width={60} />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={12} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col">
                            <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Age Groups</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-6">
                                {isLoadingAgeRange ? (
                                    <Skeleton className="h-full w-full" />
                                ) : ageRangeBreakdown?.data && ageRangeBreakdown.data.length > 0 ? (
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                        <BarChart
                                            data={ageRangeBreakdown.data
                                                .filter((item: any) => item.age_range?.toLowerCase() !== 'unknown')
                                                .map((item: any) => ({
                                                    name: item.age_range.replace('AGE_RANGE_', ''),
                                                    value: parseInt(item.impressions || '0'),
                                                }))}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                                            <YAxis hide />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section: Geography */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Geography</h2>
                    </div>

                    <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                        <CardHeader className="border-b border-muted/60 py-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold">Top Regions</CardTitle>
                                    <CardDescription className="text-xs">Impressions by geographic region</CardDescription>
                                </div>
                                <MapPin className="h-5 w-5 text-muted-foreground opacity-60" />
                            </div>
                        </CardHeader>
                        <CardContent className="min-h-[400px] pt-10">
                            {isLoadingRegion ? (
                                <div className="space-y-4 pt-4">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : regionBreakdown?.data && regionBreakdown.data.length > 0 ? (
                                <ChartContainer config={breakdownChartConfig} className="h-full w-full min-h-[400px]">
                                    <BarChart
                                        data={regionBreakdown.data
                                            .sort((a: any, b: any) => parseInt(b.impressions || '0') - parseInt(a.impressions || '0'))
                                            .slice(0, 10)
                                            .map((item: any) => ({
                                                name: item.region || 'Unknown',
                                                value: parseInt(item.impressions || '0'),
                                            }))}
                                        layout="vertical"
                                        margin={{ left: 20, right: 30 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 11, fontWeight: 700 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-background mx-4 space-y-4">
                                    <MapPin className="h-10 w-10 text-muted-foreground/20" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">No Regional Data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/**
 * Accordion-style Ad Group Item (Matches Meta Ads Flow)
 */
function AdGroupAccordionItem({ adGroup, customerId, currency }: { adGroup: any, customerId: string, currency: string }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { data: adsData, isLoading: isLoadingAds } = trpc.googleAds.ads.listAds.useQuery(
        { customerId, adGroupId: adGroup.id },
        { enabled: isExpanded, refetchOnWindowFocus: false }
    );

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase() || "";
        if (s === "ACTIVE" || s === "ENABLED") {
            return "bg-green-100/80 text-green-800 border-green-200/50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
        }
        if (s === "PAUSED") {
            return "bg-yellow-100/80 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50";
        }
        return "bg-muted text-muted-foreground";
    };

    return (
        <Card className={cn(
            "overflow-hidden transition-all duration-300 border-muted/60 shadow-none",
            isExpanded ? "ring-1 ring-primary/20 border-primary/20 bg-muted/5 shadow-md" : "hover:border-primary/30"
        )}>
            <div
                className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isExpanded ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                    )}>
                        <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[13px] tracking-tight truncate leading-none">
                                {adGroup.name}
                            </h3>
                            <Badge variant="outline" className={cn("text-[8px] px-1.5 h-4 font-bold uppercase tracking-wider rounded-full", getStatusStyles(adGroup.status))}>
                                {adGroup.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                            <span>ID: {adGroup.id}</span>
                            <span>•</span>
                            <span>{adGroup.type || "STANDARD"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden sm:grid grid-cols-2 gap-x-8 gap-y-1">
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Clicks</p>
                            <p className="text-[13px] font-bold leading-none mt-1">{parseInt(adGroup?.insights?.clicks || "0").toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Spend</p>
                            <p className="text-[13px] font-bold leading-none mt-1">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(parseFloat(adGroup?.insights?.cost || "0"))}
                            </p>
                        </div>
                    </div>
                    <div className={cn(
                        "p-1.5 rounded-full bg-muted/50 transition-transform duration-300",
                        isExpanded && "rotate-180 bg-primary/10 text-primary"
                    )}>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300 fade-in border-t border-muted/60 bg-background">
                    <div className="p-6 space-y-8">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricBox
                                label="CPC BID"
                                value={adGroup.cpc_bid ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(adGroup.cpc_bid)) : "—"}
                            />
                            <MetricBox
                                label="Impressions"
                                value={parseInt(adGroup?.insights?.impressions || "0").toLocaleString()}
                            />
                            <MetricBox
                                label="CTR"
                                value={`${parseFloat(adGroup?.insights?.ctr || "0").toFixed(2)}%`}
                            />
                            <MetricBox
                                label="Conversions"
                                value={parseInt(adGroup?.insights?.conversions || "0").toLocaleString()}
                            />
                        </div>

                        <Separator className="opacity-50" />

                        {/* Ads List (Now with Nested Accordions) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Ads within this group</h4>
                                <Badge variant="secondary" className="text-[9px] font-bold opacity-60">
                                    {adsData?.data?.length || 0} ADS
                                </Badge>
                            </div>

                            {isLoadingAds ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            ) : adsData?.data && adsData.data.length > 0 ? (
                                <div className="grid gap-3">
                                    {adsData.data.map((ad: any) => (
                                        <AdAccordionItem key={ad.id} ad={ad} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center border border-dashed rounded-xl bg-muted/5">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-40 italic font-bold">No ads found for this group</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

/**
 * Nested Ad Accordion Item for deeper metrics
 */
function AdAccordionItem({ ad }: { ad: any }) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase() || "";
        if (s === "ACTIVE" || s === "ENABLED") return "text-green-600 bg-green-50 dark:bg-green-500/10";
        if (s === "PAUSED") return "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10";
        return "text-muted-foreground bg-muted";
    };

    return (
        <div className={cn(
            "rounded-xl border border-muted/60 bg-white dark:bg-zinc-900/50 overflow-hidden transition-all duration-200",
            isExpanded ? "ring-1 ring-primary/10 border-primary/20 shadow-sm" : "hover:border-primary/20"
        )}>
            <div
                className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none group/ad"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-muted shadow-xs transition-transform",
                        isExpanded ? "bg-primary text-primary-foreground" : "bg-muted/10 text-muted-foreground/60 group-hover/ad:scale-105"
                    )}>
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-[12px] leading-tight truncate tracking-tight">{ad.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={cn("text-[7px] px-1.5 h-3.5 font-bold uppercase tracking-wider rounded-full border-none", getStatusStyles(ad.status))}>
                                {ad.status}
                            </Badge>
                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest leading-none">ID: {ad.id}</span>
                        </div>
                    </div>
                </div>
                <div className={cn(
                    "p-1 rounded-full bg-muted/30 transition-transform duration-300",
                    isExpanded && "rotate-180 bg-primary/10 text-primary"
                )}>
                    <ChevronDown className="h-3 w-3" />
                </div>
            </div>

            {isExpanded && ad?.insights && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200 fade-in border-t border-muted/30 bg-muted/5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                        <MetricBoxSmall label="Clicks" value={parseInt(ad.insights.clicks || "0").toLocaleString()} icon={<MousePointer2 className="h-3 w-3" />} />
                        <MetricBoxSmall label="Impressions" value={parseInt(ad.insights.impressions || "0").toLocaleString()} icon={<Target className="h-3 w-3" />} />
                        <MetricBoxSmall label="CTR" value={`${parseFloat(ad.insights.ctr || "0").toFixed(2)}%`} icon={<TrendingUp className="h-3 w-3" />} />
                        <MetricBoxSmall label="Conversions" value={parseInt(ad.insights.conversions || "0").toLocaleString()} icon={<Activity className="h-3 w-3" />} />
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricBoxSmall({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="p-2.5 rounded-lg border border-muted/40 bg-background/50 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground/50">
                {icon}
                <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[11px] font-bold tracking-tight text-foreground">{value}</p>
        </div>
    );
}

function MetricBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-1.5 p-3 rounded-xl border border-muted/60 bg-muted/5">
            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] leading-none">{label}</p>
            <p className="text-sm font-bold tracking-tight text-foreground">{value}</p>
        </div>
    );
}

/**
 * Standardized Premium Metric Card
 */
function MetricCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
        purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
        orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    };

    return (
        <Card className="overflow-hidden border-muted/60 shadow-none hover:border-primary/20 transition-all group bg-background hover:bg-muted/5">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                    <div className={cn("p-1.5 rounded-lg border group-hover:scale-110 transition-transform", colorClasses[color])}>
                        {icon}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-60 line-clamp-1">{title}</p>
                    <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}
