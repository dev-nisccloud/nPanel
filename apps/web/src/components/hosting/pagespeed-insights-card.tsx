"use client";

import * as React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import { cn } from "@/lib/utils";

interface PageSpeedInsightsCardProps {
  domainName: string;
}

type Strategy = "mobile" | "desktop";

type MetricCell = {
  value: number | null;
  displayValue?: string | null;
  score: number | null;
} | null;

type PageSpeedData = {
  performance?: {
    score: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics?: {
    lcp: MetricCell;
    fid: MetricCell;
    cls: MetricCell;
    fcp: MetricCell;
    tbt: MetricCell;
    si: MetricCell;
    tti: MetricCell;
  };
  timestamp?: string;
  cached?: boolean;
};

function formatPageSpeedErrorMessage(message: string | undefined): string {
  if (!message) return "Failed to load PageSpeed Insights data";
  if (
    /service unavailable/i.test(message) ||
    /not valid JSON/i.test(message) ||
    /unexpected token/i.test(message)
  ) {
    return "PageSpeed Insights is temporarily unavailable. Please try again.";
  }
  return message;
}

function scoreStroke(score: number | null): string {
  if (score === null) return "stroke-muted-foreground/40";
  if (score >= 70) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-red-500";
}

function scoreText(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function metricTone(score: number | null | undefined): string {
  if (score == null) return "text-primary";
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function ScoreRing({
  score,
  loading,
  size = "md",
}: {
  score: number | null;
  loading?: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? 44 : 52;
  const radius = size === "sm" ? 17 : 21;
  const stroke = size === "sm" ? 4.5 : 5.5;
  const view = size === "sm" ? 44 : 56;
  const center = view / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score ?? 0;
  const offset = circumference - (pct / 100) * circumference;

  if (loading) {
    return (
      <Skeleton
        className="rounded-full"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg
        className="-rotate-90"
        width={dim}
        height={dim}
        viewBox={`0 0 ${view} ${view}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={scoreStroke(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={score === null ? circumference : offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "font-semibold tabular-nums",
            size === "sm" ? "text-xs" : "text-base",
            scoreText(score),
          )}
        >
          {score === null ? "" : score}
        </span>
      </div>
    </div>
  );
}

function formatScannedAt(timestamp: string | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function metricDisplay(metric: MetricCell): string {
  if (!metric) return "";
  if (metric.displayValue) return metric.displayValue;
  if (metric.value == null) return "";
  if (metric.value < 1000) return `${Math.round(metric.value)} ms`;
  return `${(metric.value / 1000).toFixed(2)} s`;
}

function categoryDisplay(score: number | null | undefined): string {
  return score == null ? "" : String(score);
}

function StrategySummary({
  label,
  data,
  loading,
  error,
  selected,
  onSelect,
}: {
  label: string;
  data: PageSpeedData | undefined;
  loading: boolean;
  error: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const score = data?.performance?.score ?? null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <ScoreRing score={error ? null : score} loading={loading} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          Last scanned:{" "}
          <span className="text-muted-foreground">
            {loading
              ? "Running…"
              : error
                ? "Failed"
                : formatScannedAt(data?.timestamp)}
          </span>
        </p>
      </div>
    </button>
  );
}

function CategoryPie({
  label,
  score,
  loading,
}: {
  label: string;
  score: number | null;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 py-1.5">
      <ScoreRing score={score} loading={loading} size="sm" />
      <p className="text-center text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function MetricRow({
  label,
  desktop,
  mobile,
  desktopScore,
  mobileScore,
}: {
  label: string;
  desktop: string;
  mobile: string;
  desktopScore?: number | null;
  mobileScore?: number | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(7rem,1.1fr)_1fr_1fr] items-center gap-2 px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "truncate text-sm font-medium tabular-nums",
          metricTone(desktopScore),
        )}
      >
        {desktop}
      </span>
      <span
        className={cn(
          "truncate text-sm font-medium tabular-nums",
          metricTone(mobileScore),
        )}
      >
        {mobile}
      </span>
    </div>
  );
}

type PageSpeedSiteResult = {
  desktop?: PageSpeedData | null;
  mobile?: PageSpeedData | null;
  desktopError?: string;
  mobileError?: string;
  cached?: boolean;
};

function toastPageSpeedError(error: {
  data?: { code?: string };
  message?: string;
} | null | undefined) {
  if (!error) return;
  if (error.data?.code === "TOO_MANY_REQUESTS") {
    toast.error("Rate limit exceeded. Please try again later.");
  } else if (error.data?.code === "UNAUTHORIZED") {
    toast.error("PageSpeed Insights API authentication failed.");
  } else {
    toast.error(formatPageSpeedErrorMessage(error.message));
  }
}

export function PageSpeedInsightsCard({ domainName }: PageSpeedInsightsCardProps) {
  const [selectedStrategy, setSelectedStrategy] =
    React.useState<Strategy>("mobile");
  const utils = trpc.useUtils();

  const domainUrl = React.useMemo(() => {
    if (!domainName) return null;
    const normalizedInput = domainName.trim();
    if (!normalizedInput) return null;

    const candidate = /^https?:\/\//i.test(normalizedInput)
      ? normalizedInput
      : `https://${normalizedInput}`;

    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname || parsed.hostname.includes(" ")) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }, [domainName]);

  const pageSpeedQuery = trpc.pagespeedInsights.getPageSpeed.useQuery(
    { url: domainUrl || "" },
    {
      enabled: !!domainUrl,
      staleTime: Infinity,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const runPageSpeed = trpc.pagespeedInsights.runPageSpeed.useMutation({
    onSuccess: (data) => {
      if (!domainUrl) return;
      utils.pagespeedInsights.getPageSpeed.setData({ url: domainUrl }, data);
      if (data.desktopError || data.mobileError) {
        toast.error(
          formatPageSpeedErrorMessage(data.desktopError || data.mobileError),
        );
      }
    },
    onError: (error) => {
      toastPageSpeedError(error);
    },
  });

  React.useEffect(() => {
    toastPageSpeedError(pageSpeedQuery.error);
  }, [pageSpeedQuery.error]);

  const handleRunBoth = React.useCallback(() => {
    if (!domainUrl || runPageSpeed.isPending) return;
    captureEvent("pagespeed_test_run", {
      url: domainUrl,
      device: "both",
    });
    runPageSpeed.mutate({ url: domainUrl });
  }, [domainUrl, runPageSpeed]);

  const result = pageSpeedQuery.data as PageSpeedSiteResult | undefined;
  const isRefreshing = runPageSpeed.isPending;
  const isLoading = pageSpeedQuery.isLoading && !result;
  const hasAnyData = !!(result?.desktop || result?.mobile);
  const bothFailed = !!pageSpeedQuery.error && !hasAnyData && !isRefreshing;

  if (!domainUrl) return null;

  if (!hasAnyData && (isLoading || isRefreshing)) {
    return (
      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-3">
          <CardTitle className="text-sm font-semibold">Performance</CardTitle>
          <Skeleton className="h-8 w-28" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="h-13 w-13 rounded-full size-[52px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="h-13 w-13 rounded-full size-[52px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bothFailed) {
    return (
      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-3">
          <CardTitle className="text-sm font-semibold">Performance</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunBoth}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("mr-2 h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            Run again
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {formatPageSpeedErrorMessage(pageSpeedQuery.error?.message)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const desktop = result?.desktop ?? undefined;
  const mobile = result?.mobile ?? undefined;
  const active = selectedStrategy === "mobile" ? mobile : desktop;
  const activeLoading = (isLoading || isRefreshing) && !active;

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <CardTitle className="text-sm font-semibold">Performance</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRunBoth}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("mr-2 h-3.5 w-3.5", isRefreshing && "animate-spin")}
          />
          Run again
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* Overall Desktop / Mobile pies  click to focus category scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <StrategySummary
            label="Desktop"
            data={desktop}
            loading={(isLoading || isRefreshing) && !desktop}
            error={!!result?.desktopError && !desktop}
            selected={selectedStrategy === "desktop"}
            onSelect={() => setSelectedStrategy("desktop")}
          />
          <StrategySummary
            label="Mobile"
            data={mobile}
            loading={(isLoading || isRefreshing) && !mobile}
            error={!!result?.mobileError && !mobile}
            selected={selectedStrategy === "mobile"}
            onSelect={() => setSelectedStrategy("mobile")}
          />
        </div>

        {/* Category scores as pies (replaces old progress bar) */}
        <div className="border-t px-2 pb-1">
          <p className="px-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Category scores · {selectedStrategy === "mobile" ? "Mobile" : "Desktop"}
          </p>
          <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
            <CategoryPie
              label="Performance"
              score={active?.performance?.score ?? null}
              loading={activeLoading && !active}
            />
            <CategoryPie
              label="Accessibility"
              score={active?.performance?.accessibility ?? null}
              loading={activeLoading && !active}
            />
            <CategoryPie
              label="Best Practices"
              score={active?.performance?.bestPractices ?? null}
              loading={activeLoading && !active}
            />
            <CategoryPie
              label="SEO"
              score={active?.performance?.seo ?? null}
              loading={activeLoading && !active}
            />
          </div>
        </div>

        {/* Detailed metrics behind Show more */}
        <Accordion type="single" collapsible className="border-t">
          <AccordionItem value="metrics" className="border-0">
            <AccordionTrigger className="px-4 py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              Show more
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="divide-y divide-border border-t">
                <div className="grid grid-cols-[minmax(7rem,1.1fr)_1fr_1fr] gap-2 bg-muted/20 px-4 py-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Metric
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Desktop
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Mobile
                  </span>
                </div>

                <MetricRow
                  label="Performance"
                  desktop={categoryDisplay(desktop?.performance?.score)}
                  mobile={categoryDisplay(mobile?.performance?.score)}
                  desktopScore={desktop?.performance?.score}
                  mobileScore={mobile?.performance?.score}
                />
                <MetricRow
                  label="LCP"
                  desktop={metricDisplay(desktop?.metrics?.lcp ?? null)}
                  mobile={metricDisplay(mobile?.metrics?.lcp ?? null)}
                  desktopScore={desktop?.metrics?.lcp?.score}
                  mobileScore={mobile?.metrics?.lcp?.score}
                />
                <MetricRow
                  label="CLS"
                  desktop={metricDisplay(desktop?.metrics?.cls ?? null)}
                  mobile={metricDisplay(mobile?.metrics?.cls ?? null)}
                  desktopScore={desktop?.metrics?.cls?.score}
                  mobileScore={mobile?.metrics?.cls?.score}
                />
                <MetricRow
                  label="TBT"
                  desktop={metricDisplay(desktop?.metrics?.tbt ?? null)}
                  mobile={metricDisplay(mobile?.metrics?.tbt ?? null)}
                  desktopScore={desktop?.metrics?.tbt?.score}
                  mobileScore={mobile?.metrics?.tbt?.score}
                />
                <MetricRow
                  label="FCP"
                  desktop={metricDisplay(desktop?.metrics?.fcp ?? null)}
                  mobile={metricDisplay(mobile?.metrics?.fcp ?? null)}
                  desktopScore={desktop?.metrics?.fcp?.score}
                  mobileScore={mobile?.metrics?.fcp?.score}
                />
                <MetricRow
                  label="Speed Index"
                  desktop={metricDisplay(desktop?.metrics?.si ?? null)}
                  mobile={metricDisplay(mobile?.metrics?.si ?? null)}
                  desktopScore={desktop?.metrics?.si?.score}
                  mobileScore={mobile?.metrics?.si?.score}
                />
                <MetricRow
                  label="Accessibility"
                  desktop={categoryDisplay(desktop?.performance?.accessibility)}
                  mobile={categoryDisplay(mobile?.performance?.accessibility)}
                  desktopScore={desktop?.performance?.accessibility}
                  mobileScore={mobile?.performance?.accessibility}
                />
                <MetricRow
                  label="Best Practices"
                  desktop={categoryDisplay(desktop?.performance?.bestPractices)}
                  mobile={categoryDisplay(mobile?.performance?.bestPractices)}
                  desktopScore={desktop?.performance?.bestPractices}
                  mobileScore={mobile?.performance?.bestPractices}
                />
                <MetricRow
                  label="SEO"
                  desktop={categoryDisplay(desktop?.performance?.seo)}
                  mobile={categoryDisplay(mobile?.performance?.seo)}
                  desktopScore={desktop?.performance?.seo}
                  mobileScore={mobile?.performance?.seo}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
