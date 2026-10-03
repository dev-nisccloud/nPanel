"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { MockCampaign } from "./mock-data";

function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? Number.parseFloat(num) : num;
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(num: number | string, currency: string): string {
  const value = typeof num === "string" ? Number.parseFloat(num) : num;
  if (!Number.isFinite(value)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatCtr(ctr?: string) {
  if (!ctr || ctr === "0") return "0%";
  const ctrNum = Number.parseFloat(ctr);
  if (!Number.isFinite(ctrNum)) return "0%";
  return ctrNum < 1 ? `${(ctrNum * 100).toFixed(2)}%` : `${ctrNum.toFixed(2)}%`;
}

function getCampaignStatusStyles(status?: string) {
  if (!status) return { variant: "secondary" as const, className: undefined };
  const upperStatus = status.toUpperCase();
  if (upperStatus === "ACTIVE") {
    return {
      variant: "outline" as const,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (upperStatus === "PAUSED") {
    return {
      variant: "outline" as const,
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  if (upperStatus === "DELETED") return { variant: "destructive" as const, className: undefined };
  return { variant: "secondary" as const, className: undefined };
}

function parseObjective(objective?: string): string {
  if (!objective) return "";
  if (objective.startsWith("OUTCOME_")) return objective.replace("OUTCOME_", "").replace(/_/g, " ");
  return objective.replace(/_/g, " ");
}

export function FacebookCampaignCard({
  campaign,
  currency,
}: {
  campaign: MockCampaign;
  currency: string;
}) {
  const statusStyles = getCampaignStatusStyles(campaign.status);
  const insights = campaign.insights;
  const budgetProgress = campaign.budget && insights?.spend ? (insights.spend / campaign.budget) * 100 : 0;

  return (
    <article className="group cursor-pointer rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary">
            {campaign.name || `Campaign ${campaign.id}`}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium capitalize text-muted-foreground">
            {parseObjective(campaign.objective)}
          </p>
        </div>
        <Badge
          variant={statusStyles.variant}
          className={cn("shrink-0 px-2 py-0.5 text-[10px] font-semibold", statusStyles.className)}
        >
          {campaign.status}
        </Badge>
      </div>

      {insights ? (
        <>
          {/* Budget Progress */}
          {campaign.budget && (
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between text-[11px]">
                <span className="font-medium text-foreground">
                  {formatCurrency(insights.spend, currency)}
                  <span className="text-muted-foreground"> / {formatCurrency(campaign.budget, currency)}</span>
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    budgetProgress > 90 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
                  )}
                >
                  {budgetProgress.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={budgetProgress}
                className={cn("h-1.5", budgetProgress > 90 && "[&>div]:bg-amber-500")}
              />
            </div>
          )}

          {/* Metrics Grid */}
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <MetricCompact label="Reach" value={formatNumber(insights.reach || 0)} />
            <MetricCompact label="Impr." value={formatNumber(insights.impressions || 0)} />
            <MetricCompact label="Clicks" value={formatNumber(insights.clicks || 0)} />
            <MetricCompact label="CTR" value={formatCtr(insights.ctr)} highlight />
            {insights.results !== undefined && (
              <>
                <MetricCompact label="Results" value={formatNumber(insights.results)} highlight />
                <MetricCompact
                  label="Cost/Result"
                  value={formatCurrency(insights.costPerResult || 0, currency)}
                  highlight
                />
              </>
            )}
          </dl>
        </>
      ) : (
        <p className="mt-3 text-xs italic text-muted-foreground">No performance data for this period</p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          {campaign.start_time ? format(new Date(campaign.start_time), "MMM dd") : "No start"}
          {" – "}
          {campaign.stop_time ? format(new Date(campaign.stop_time), "MMM dd") : "Ongoing"}
        </span>
        <span className="hidden items-center gap-0.5 font-medium text-primary group-hover:inline-flex">
          View
          <TrendingUp className="h-3 w-3" />
        </span>
      </div>
    </article>
  );
}

function MetricCompact({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-md border px-2 py-1.5", highlight ? "border-primary/20 bg-primary/5" : "bg-muted/30")}>
      <dt className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-xs font-semibold", highlight && "text-primary")}>{value}</dd>
    </div>
  );
}
