"use client";

import * as React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
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
    Palette,
    Key,
    Search,
    Zap,
    HelpCircle
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const campaignId = (params.campaignId as string) || "";
    const customerId = searchParams.get("customerId") || "";

    // Date range (Matches global state pattern)
    const [timeRange] = React.useState({
        since: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
        until: format(new Date(), "yyyy-MM-dd"),
    });

    // Fetch campaign core details (Metadata - not date range dependent)
    const {
        data: campaignDetailsData,
        isLoading: isLoadingDetails,
        error: detailsError,
    } = trpc.googleAds.campaigns.getCampaignDetails.useQuery(
        { customerId, campaignId },
        { enabled: !!customerId && !!campaignId, refetchOnWindowFocus: false }
    );

    const campaignCore = campaignDetailsData?.data;

    // Fetch campaign list for metrics/insights (Date range dependent)
    const {
        data: campaignsData,
        isLoading: isLoadingCampaigns,
        error: campaignsError,
    } = trpc.googleAds.campaigns.listCampaigns.useQuery(
        { customerId, timeRange },
        { enabled: !!customerId && !!campaignId, refetchOnWindowFocus: false }
    );

    const campaignWithInsights = React.useMemo(() => {
        return (campaignsData?.data || []).find((c: any) => c.id === campaignId);
    }, [campaignsData, campaignId]);

    // Merge core info with insights
    const campaign = React.useMemo(() => {
        if (!campaignCore) return null;
        return {
            ...campaignCore,
            insights: campaignWithInsights?.insights || null
        };
    }, [campaignCore, campaignWithInsights]);

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
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: genderBreakdown, isLoading: isLoadingGender } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'gender' },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: deviceBreakdown, isLoading: isLoadingDevice } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'device' },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: regionBreakdown, isLoading: isLoadingRegion } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'region' },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: ageRangeBreakdown, isLoading: isLoadingAgeRange } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'age_range' },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: searchTermsBreakdown, isLoading: isLoadingSearchTerms } = trpc.googleAds.insights.getBreakdowns.useQuery(
        { customerId, campaignId, timeRange, breakdown: 'search_terms' },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: keywordsPerformance, isLoading: isLoadingKeywords } = trpc.googleAds.insights.getKeywordsPerformance.useQuery(
        { customerId, campaignId, timeRange },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: networkBreakdown, isLoading: isLoadingNetwork } = trpc.googleAds.insights.getNetworkBreakdown.useQuery(
        { customerId, campaignId, timeRange },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    const { data: timeOfDayBreakdown, isLoading: isLoadingTimeOfDay } = trpc.googleAds.insights.getTimeOfDayBreakdown.useQuery(
        { customerId, campaignId, timeRange },
        { enabled: !!campaignId && !!customerId, refetchOnWindowFocus: false }
    );

    // Fetch account details for account name
    const { data: accountDetails } = trpc.googleAds.accounts.getAccountDetails.useQuery(
        { customerId },
        { enabled: !!customerId, refetchOnWindowFocus: false }
    );

    React.useEffect(() => {
        if (detailsError) toast.error(detailsError.message || "Failed to load campaign details");
        if (campaignsError) toast.error(campaignsError.message || "Failed to load campaign insights");
        if (adGroupsError) toast.error(adGroupsError.message || "Failed to load ad groups");
    }, [detailsError, campaignsError, adGroupsError]);

    const currency = "USD";

    // Show spinner if we are still waiting for search params or if details are loading
    if (!customerId || (isLoadingDetails && !campaignCore)) {
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

    // Only show Not Found if customerId is present but API definitely returned nothing
    if (!campaignCore && !isLoadingDetails && !!customerId) {
        return (
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
                <div className="w-full max-w-7xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Not Found</CardTitle>
                            <CardDescription>We couldn't find the campaign details for ID: {campaignId}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate(`/agency/ad-campaigns/google-ads`)} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Overview
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

    const genderChartConfig = {
        MALE: { label: "Male", color: "var(--chart-1)" },
        FEMALE: { label: "Female", color: "var(--chart-2)" },
        UNDETERMINED: { label: "Undetermined", color: "var(--chart-3)" },
    } satisfies ChartConfig;

    const breakdownChartConfig = {
        value: { label: "Impressions" },
    } satisfies ChartConfig;

    const networkChartConfig = {
        "Search": { label: "Search", color: "var(--chart-1)" },
        "Search Partners": { label: "Search Partners", color: "var(--chart-2)" },
        "Display": { label: "Display", color: "var(--chart-3)" },
        "YouTube Search": { label: "YouTube Search", color: "var(--chart-4)" },
        "YouTube Watch": { label: "YouTube Watch", color: "var(--chart-5)" },
        "Social": { label: "Social", color: "var(--chart-1)" },
        "Content Network": { label: "Content Network", color: "var(--chart-2)" },
        "Mixed": { label: "Mixed", color: "var(--chart-3)" },
        "Unknown": { label: "Unknown", color: "var(--chart-4)" },
    } satisfies ChartConfig;

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans">
            <div className="w-full max-w-7xl mx-auto space-y-12">
                {/* Breadcrumbs & Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/agency/ad-campaigns/google-ads`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-base font-semibold tracking-tight truncate leading-none">
                                {campaign?.name || `Campaign ${campaignId}`}
                            </h1>
                            {campaign?.status && (
                                <Badge
                                    variant={getStatusStyles(campaign.status) === "destructive" ? "destructive" : "outline"}
                                    className={cn("text-[8px] px-1.5 py-0 font-bold uppercase tracking-wider rounded-full", getStatusStyles(campaign.status))}
                                >
                                    {campaign.status}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Google Ads campaign details</p>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5 opacity-60" />
                            <span>{accountDetails?.data?.accountName || formatCustomerIdDisplay(customerId)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
                            <span>
                                {formatGoogleDate(campaign?.start_date)} — {campaign?.end_date ? formatGoogleDate(campaign.end_date) : "Ongoing"}
                            </span>
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
                                    <ChartContainer config={genderChartConfig} className="h-full w-full">
                                        <PieChart>
                                            <Pie
                                                data={genderBreakdown.data
                                                    .filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || "0") > 0)
                                                    .map((item: any) => ({
                                                        name: item.gender?.toUpperCase(),
                                                        value: parseInt(item.impressions || "0"),
                                                        fill: genderChartConfig[item.gender?.toUpperCase() as keyof typeof genderChartConfig]?.color || `var(--chart-1)`
                                                    }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                paddingAngle={5}
                                            >
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
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <ChartLegend content={<ChartLegendContent />} className="-translate-y-2" />
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
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col">
                            <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Network Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-6">
                                {isLoadingNetwork ? (
                                    <Skeleton className="h-full w-full" />
                                ) : networkBreakdown?.data && networkBreakdown.data.length > 0 ? (
                                    <ChartContainer config={networkChartConfig} className="h-full w-full">
                                        <PieChart>
                                            <Pie
                                                data={networkBreakdown.data
                                                    .map((item: any, idx: number) => ({
                                                        name: item.network || 'Unknown',
                                                        value: item.impressions,
                                                        fill: networkChartConfig[item.network as keyof typeof networkChartConfig]?.color || `var(--chart-${(idx % 5) + 1})`
                                                    }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={65}
                                                innerRadius={40}
                                                paddingAngle={2}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section: Keywords & Search Intent */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Keywords & Search Intent</h2>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold opacity-40 border-dashed rounded-full px-3 uppercase">
                            Top Performing
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                            <CardContent className="p-0">
                                {isLoadingKeywords ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                    </div>
                                ) : keywordsPerformance?.data && keywordsPerformance.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-muted/60 bg-muted/20">
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60">Keyword</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-center">Match</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Impr.</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Clicks</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Spend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(keywordsPerformance?.data || []).map((kw: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-muted/40 last:border-0 hover:bg-muted/10 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{kw.keyword || "—"}</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="text-[10px] text-muted-foreground opacity-60 flex items-center gap-1 cursor-help">
                                                                                {String(kw.status || "").charAt(0).toUpperCase() + String(kw.status || "").slice(1).toLowerCase()}
                                                                                <HelpCircle className="h-2.5 w-2.5 opacity-40" />
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="right">
                                                                            <p className="text-[10px]">
                                                                                {String(kw.status || "").toUpperCase() === 'ENABLED'
                                                                                    ? "Keyword is active."
                                                                                    : "Keyword is inactive."}
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex justify-center cursor-help">
                                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full font-medium opacity-70 flex items-center gap-1">
                                                                                {String(kw.matchType || "").charAt(0).toUpperCase() + String(kw.matchType || "").slice(1).toLowerCase() || "—"}
                                                                                <HelpCircle className="h-2.5 w-2.5 opacity-40" />
                                                                            </Badge>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <div className="space-y-1 max-w-[200px]">
                                                                            <p className="font-bold border-b border-primary-foreground/20 pb-1 mb-1">{String(kw.matchType || "").charAt(0).toUpperCase() + String(kw.matchType || "").slice(1).toLowerCase()}</p>
                                                                            <p className="text-[10px]">
                                                                                {String(kw.matchType || "").toUpperCase() === 'EXACT' && "Ads may show on searches with the same meaning as your keyword."}
                                                                                {String(kw.matchType || "").toUpperCase() === 'PHRASE' && "Ads may show on searches that include the meaning of your keyword."}
                                                                                {String(kw.matchType || "").toUpperCase() === 'BROAD' && "Ads may show on searches related to your keyword."}
                                                                            </p>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-xs font-mono">{kw.impressions.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-mono">{kw.clicks.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-mono">${kw.spend}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                                        <Key className="h-8 w-8 text-muted-foreground/20 mb-3" />
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-40">No keyword data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                            <CardHeader className="pb-2 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    Hourly Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] pt-4">
                                {isLoadingTimeOfDay ? (
                                    <Skeleton className="h-full w-full" />
                                ) : timeOfDayBreakdown?.data && timeOfDayBreakdown.data.length > 0 ? (
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                        <BarChart
                                            margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
                                            data={
                                                // Group by hour and sum clicks or impressions
                                                Object.entries(
                                                    (timeOfDayBreakdown?.data || []).reduce((acc: any, curr: any) => {
                                                        const h = curr.hour;
                                                        acc[h] = (acc[h] || 0) + curr.impressions;
                                                        return acc;
                                                    }, {})
                                                ).map(([hour, val]) => ({ hour: `${hour}:00`, value: val }))
                                                    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
                                            }>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="var(--chart-4)" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                            <CardHeader className="pb-2 border-b border-muted/60 py-3">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                    <CalendarIcon className="h-3 w-3" />
                                    Day Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] pt-4">
                                {isLoadingTimeOfDay ? (
                                    <Skeleton className="h-full w-full" />
                                ) : timeOfDayBreakdown?.data && timeOfDayBreakdown.data.length > 0 ? (
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
                                        <BarChart
                                            margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
                                            data={
                                                Object.entries(
                                                    (timeOfDayBreakdown?.data || []).reduce((acc: any, curr: any) => {
                                                        const d = curr.dayOfWeek;
                                                        acc[d] = (acc[d] || 0) + curr.impressions;
                                                        return acc;
                                                    }, {})
                                                ).map(([day, val]) => ({ day: day.slice(0, 3), value: val }))
                                                    .sort((a, b) => {
                                                        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                                                        return days.indexOf(a.day) - days.indexOf(b.day);
                                                    })
                                            }>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="var(--chart-5)" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">No Data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section: Geography & Search Performance */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">
                            {(regionBreakdown?.data?.length ?? 0) > 0 ? "Geography" : "Search Performance"}
                        </h2>
                    </div>

                    <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
                        <CardHeader className="border-b border-muted/60 py-3 bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-primary/10">
                                        {regionBreakdown?.data && regionBreakdown.data.length > 0 ? (
                                            <MapPin className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Search className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">
                                            {regionBreakdown?.data && regionBreakdown.data.length > 0 ? "Top Regions" : "Top Search Terms"}
                                        </CardTitle>
                                        <CardDescription className="text-[10px] opacity-60">
                                            {regionBreakdown?.data && regionBreakdown.data.length > 0
                                                ? "Impressions by geographic region"
                                                : "What users searched to see your ads"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingRegion || isLoadingSearchTerms ? (
                                <div className="p-6 space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : regionBreakdown?.data && regionBreakdown.data.length > 0 ? (
                                <div className="p-6 h-[400px]">
                                    <ChartContainer config={breakdownChartConfig} className="h-full w-full">
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
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={24} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            ) : searchTermsBreakdown?.data && searchTermsBreakdown.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-muted/60 bg-muted/20">
                                                <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60">Search Term</th>
                                                <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Impressions</th>
                                                <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Clicks</th>
                                                <th className="px-4 py-3 text-[10px] font-bold uppercase opacity-60 text-right">Spend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchTermsBreakdown.data.map((term: any, idx: number) => (
                                                <tr key={idx} className="border-b border-muted/40 last:border-0 hover:bg-muted/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-medium">{term.term}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{term.impressions.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">{term.clicks.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono">${term.spend}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-background m-6 space-y-4">
                                    <Search className="h-10 w-10 text-muted-foreground/20" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">No Performance Data Available</p>
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
                            <p className="text-[13px] font-bold leading-none mt-1">{parseInt(adGroup.insights?.clicks || "0").toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Spend</p>
                            <p className="text-[13px] font-bold leading-none mt-1">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(parseFloat(adGroup.insights?.cost || "0"))}
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
                                value={adGroup.cpc_bid ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(adGroup.cpc_bid)) : "—"}
                            />
                            <MetricBox
                                label="Impressions"
                                value={parseInt(adGroup.insights?.impressions || "0").toLocaleString()}
                            />
                            <MetricBox
                                label="CTR"
                                value={`${parseFloat(adGroup.insights?.ctr || "0").toFixed(2)}%`}
                            />
                            <MetricBox
                                label="Conversions"
                                value={parseInt(adGroup.insights?.conversions || "0").toLocaleString()}
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

            {isExpanded && ad.insights && (
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
