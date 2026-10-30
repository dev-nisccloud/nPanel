"use client";

import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Layers, RefreshCw, Target } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const performanceChartConfig = {
  impressions: { label: "Impressions", color: "var(--chart-1)" },
  clicks: { label: "Clicks", color: "var(--chart-2)" },
  spend: { label: "Spend", color: "var(--chart-3)" },
} satisfies ChartConfig;

const breakdownChartConfig = {
  impressions: { label: "Impressions", color: "var(--chart-1)" },
} satisfies ChartConfig;

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
}

function formatMoney(value: number | null | undefined, currency: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatCtr(value: string | null | undefined): string {
  const parsed = Number.parseFloat(value ?? "");
  if (!Number.isFinite(parsed)) return "—";
  return `${parsed.toFixed(2)}%`;
}

function humanize(value?: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function statusStyles(status?: string | null) {
  const upper = (status ?? "").toUpperCase();
  if (upper === "ACTIVE") {
    return {
      variant: "outline" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    };
  }
  if (upper === "PAUSED") {
    return {
      variant: "outline" as const,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
    };
  }
  return { variant: "secondary" as const, className: undefined };
}

function DetailCells({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <div className="mt-1 text-sm font-medium text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function MetricGrid({
  currency,
  insights,
}: {
  currency: string;
  insights: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: string;
    cpc: number | null;
    conversions: number;
    costPerResult: number | null;
  };
}) {
  const items = [
    { label: "Impressions", value: formatNumber(insights.impressions) },
    { label: "Clicks", value: formatNumber(insights.clicks) },
    { label: "Spend", value: formatMoney(insights.spend, currency) },
    { label: "CTR", value: formatCtr(insights.ctr) },
    { label: "CPC", value: formatMoney(insights.cpc, currency) },
    { label: "Conversions", value: formatNumber(insights.conversions) },
    { label: "Cost / conversion", value: formatMoney(insights.costPerResult, currency) },
  ];
  return <DetailCells items={items} />;
}

function BreakdownChart({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; impressions: number; clicks: number; spend: number }>;
}) {
  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">No data for this period.</p>
        ) : (
          <ChartContainer config={breakdownChartConfig} className="h-[220px] w-full">
            <BarChart data={rows.slice(0, 8)} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="impressions" fill="var(--color-impressions)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function GoogleCampaignDetailsPage() {
  const navigate = useNavigate();
  const { campaignId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get("assetId") ?? "";
  const utils = trpc.useUtils();
  const [pickedRange, setPickedRange] = React.useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const queryTimeRange =
    pickedRange?.from && pickedRange?.to
      ? { since: format(pickedRange.from, "yyyy-MM-dd"), until: format(pickedRange.to, "yyyy-MM-dd") }
      : undefined;

  const detailsQuery = trpc.customerOAuth.google.getDetails.useQuery(
    { assetId, campaignId, timeRange: queryTimeRange },
    { enabled: Boolean(assetId && campaignId), placeholderData: (previous) => previous },
  );
  const chartsQuery = trpc.customerOAuth.google.getCharts.useQuery(
    { assetId, campaignId, timeRange: queryTimeRange },
    { enabled: Boolean(assetId && campaignId), placeholderData: (previous) => previous },
  );

  const details = detailsQuery.data;
  const campaign = details?.campaign;
  const currency = details?.currency || "USD";
  const shownRange: DateRange | undefined = pickedRange?.from
    ? pickedRange
    : details?.timeRange
      ? { from: parseISO(details.timeRange.since), to: parseISO(details.timeRange.until) }
      : undefined;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.customerOAuth.google.getDetails.invalidate({ assetId, campaignId, timeRange: queryTimeRange }),
        utils.customerOAuth.google.getCharts.invalidate({ assetId, campaignId, timeRange: queryTimeRange }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!assetId) {
    return <div className="px-6 py-16 text-center text-sm text-muted-foreground">Open this campaign from a Google Ads account.</div>;
  }

  if (detailsQuery.isLoading && !details) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (detailsQuery.isError && !details) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm text-destructive">{detailsQuery.error.message}</p>
        <Button className="mt-4" variant="outline" onClick={() => void detailsQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const charts = chartsQuery.data;
  const chartsPending = chartsQuery.isLoading && !charts;
  const daily = (charts?.daily ?? []).map((point) => ({
    ...point,
    dateLabel: format(parseISO(point.date), "MMM dd"),
  }));

  return (
    <div className="@container/main flex flex-col gap-6 px-4 py-4 font-sans text-foreground md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mt-0.5 shrink-0"
              onClick={() =>
                navigate(assetId ? `/agency/social-media-ads/google?assetId=${assetId}` : "/agency/social-media-ads/google")
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{campaign?.name || "Campaign"}</h1>
              <p className="text-xs text-muted-foreground">{details?.accountName || "Google Ads account"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full">
                  <CalendarIcon className="h-4 w-4" />
                  {shownRange?.from && shownRange.to
                    ? `${format(shownRange.from, "MMM d, yyyy")} – ${format(shownRange.to, "MMM d, yyyy")}`
                    : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={shownRange?.from}
                  selected={shownRange}
                  onSelect={(range) => {
                    setPickedRange(range);
                    if (range?.from && range?.to) setIsDatePickerOpen(false);
                  }}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full" onClick={() => void handleRefresh()} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Campaign
            </CardTitle>
            <CardDescription className="text-xs">Schedule, budget, and performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <DetailCells
                items={[
                  {
                    label: "Status",
                    value: campaign?.status ? (
                      <Badge variant={statusStyles(campaign.status).variant} className={statusStyles(campaign.status).className}>
                        {campaign.status}
                      </Badge>
                    ) : (
                      "—"
                    ),
                  },
                  { label: "Channel", value: humanize(campaign?.objective) },
                  { label: "Start", value: campaign?.startTime ? format(new Date(campaign.startTime), "MMM d, yyyy") : "—" },
                  { label: "End", value: campaign?.stopTime ? format(new Date(campaign.stopTime), "MMM d, yyyy") : "Ongoing" },
                  { label: "Budget", value: formatMoney(campaign?.dailyBudget, currency) },
                  { label: "Budget period", value: humanize(campaign?.budgetPeriod) },
                  { label: "Ad account", value: details?.accountName || "—" },
                  { label: "Campaign id", value: campaign?.id || "—" },
                ]}
              />
              {campaign?.insights ? <MetricGrid currency={currency} insights={campaign.insights} /> : null}
              {campaign?.targeting.length ? (
                <div className="space-y-3 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Targeting</p>
                  {campaign.targeting.map((section) => (
                    <div key={section.label}>
                      <p className="text-xs text-muted-foreground">{section.label}</p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">{section.values}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Performance Trends</h2>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Daily breakdown
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily activity</CardTitle>
                <CardDescription className="text-xs">Impressions and clicks</CardDescription>
              </CardHeader>
              <CardContent>
                {chartsPending ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : daily.length === 0 ? (
                  <p className="py-16 text-center text-xs text-muted-foreground">No daily activity for this period.</p>
                ) : (
                  <ChartContainer config={performanceChartConfig} className="h-[250px] w-full">
                    <AreaChart data={daily} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area dataKey="impressions" stroke="var(--color-impressions)" fill="var(--color-impressions)" fillOpacity={0.15} />
                      <Area dataKey="clicks" stroke="var(--color-clicks)" fill="var(--color-clicks)" fillOpacity={0.15} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily spend</CardTitle>
                <CardDescription className="text-xs">Amount spent each day</CardDescription>
              </CardHeader>
              <CardContent>
                {chartsPending ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : daily.length === 0 ? (
                  <p className="py-16 text-center text-xs text-muted-foreground">No spend for this period.</p>
                ) : (
                  <ChartContainer config={performanceChartConfig} className="h-[250px] w-full">
                    <AreaChart data={daily} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area dataKey="spend" stroke="var(--color-spend)" fill="var(--color-spend)" fillOpacity={0.15} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {chartsPending ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[260px] w-full" />)
            ) : (
              <>
                <BreakdownChart title="Device" rows={charts?.device ?? []} />
                <BreakdownChart title="Network" rows={charts?.network ?? []} />
                <BreakdownChart title="Age" rows={charts?.age ?? []} />
                <BreakdownChart title="Gender" rows={charts?.gender ?? []} />
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{details?.structure === "asset_groups" ? "Asset groups" : "Ad groups"}</h2>
            <p className="text-xs text-muted-foreground">
              {details?.structure === "asset_groups"
                ? "Assets and performance for each asset group"
                : "Ads and performance for each ad group"}
            </p>
          </div>
          {(details?.adSets ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {details?.structure === "asset_groups"
                ? "No asset groups found for this campaign."
                : "No ad groups found for this campaign."}
            </p>
          ) : (
            details?.adSets.map((adSet) => (
              <Card key={adSet.id} className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b bg-muted/30 px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    {adSet.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {adSet.id}
                    {adSet.unitCost != null ? ` · ${formatMoney(adSet.unitCost, currency)} bid` : ""}
                    {adSet.finalUrl ? ` · ${adSet.finalUrl}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0 p-0">
                  <div className="divide-y">
                    <DetailCells
                      items={[
                        {
                          label: "Status",
                          value: (
                            <Badge variant={statusStyles(adSet.status).variant} className={statusStyles(adSet.status).className}>
                              {adSet.status}
                            </Badge>
                          ),
                        },
                        ...(adSet.unitCost != null
                          ? [{ label: "Bid", value: formatMoney(adSet.unitCost, currency) }]
                          : []),
                        {
                          label: details?.structure === "asset_groups" ? "Assets" : "Ads",
                          value: String(adSet.ads.length),
                        },
                        {
                          label: details?.structure === "asset_groups" ? "Asset group id" : "Ad group id",
                          value: adSet.id,
                        },
                      ]}
                    />
                    {adSet.insights ? <MetricGrid currency={currency} insights={adSet.insights} /> : null}
                    <div className="space-y-3 px-4 py-4">
                      <p className="text-xs text-muted-foreground">{details?.structure === "asset_groups" ? "Assets" : "Ads"}</p>
                      {adSet.ads.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {details?.structure === "asset_groups"
                            ? "No assets found for this asset group."
                            : "No ads found for this ad group."}
                        </p>
                      ) : (
                        adSet.ads.map((ad) => (
                          <div key={ad.id} className="rounded-md border">
                            <div className="flex items-start justify-between gap-3 px-3 py-3">
                              <div className="flex min-w-0 items-start gap-3">
                                {ad.media ? (
                                  <a
                                    href={ad.media.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-md border bg-muted"
                                  >
                                    <img
                                      src={ad.media.previewUrl}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="h-full w-full object-cover"
                                    />
                                    {ad.media.kind === "video" ? (
                                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-[10px] font-semibold uppercase tracking-wide text-white">
                                        Video
                                      </span>
                                    ) : null}
                                  </a>
                                ) : null}
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm font-medium text-foreground">{ad.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {ad.id}
                                    {ad.type ? ` · ${humanize(ad.type)}` : ""}
                                    {ad.finalUrl ? ` · ${ad.finalUrl}` : ""}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={statusStyles(ad.status).variant} className={statusStyles(ad.status).className}>
                                {ad.status}
                              </Badge>
                            </div>
                            {ad.insights ? <MetricGrid currency={currency} insights={ad.insights} /> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
