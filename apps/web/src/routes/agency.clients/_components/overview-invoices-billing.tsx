"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  Receipt,
  CheckCircle2,
  FileEdit,
  Clock,
  XCircle,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BucketKey = "paid" | "draft" | "unpaid" | "cancelled" | "refunded";

const BUCKET_META: Record<
  BucketKey,
  {
    icon: React.ComponentType<{ className?: string }>;
    barClass: string;
    iconBg: string;
    iconClass: string;
    rowHover: string;
  }
> = {
  paid: {
    icon: CheckCircle2,
    barClass: "bg-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    rowHover: "hover:bg-emerald-500/5",
  },
  draft: {
    icon: FileEdit,
    barClass: "bg-slate-400",
    iconBg: "bg-slate-500/10",
    iconClass: "text-slate-600 dark:text-slate-400",
    rowHover: "hover:bg-slate-500/5",
  },
  unpaid: {
    icon: Clock,
    barClass: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    iconClass: "text-amber-600 dark:text-amber-400",
    rowHover: "hover:bg-amber-500/5",
  },
  cancelled: {
    icon: XCircle,
    barClass: "bg-rose-500",
    iconBg: "bg-rose-500/10",
    iconClass: "text-rose-600 dark:text-rose-400",
    rowHover: "hover:bg-rose-500/5",
  },
  refunded: {
    icon: RotateCcw,
    barClass: "bg-violet-500",
    iconBg: "bg-violet-500/10",
    iconClass: "text-violet-600 dark:text-violet-400",
    rowHover: "hover:bg-violet-500/5",
  },
};

function formatMoney(amount: number, currency: string) {
  const code = currency === "KES" ? "KES" : currency;
  const formatted = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount);
  if (code === "KES") return `Ksh${formatted}`;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OverviewInvoicesBilling({ clientId }: { clientId: string }) {
  const { data, isLoading, error } = trpc.clients.getInvoiceBillingSummary.useQuery(
    { userId: clientId },
    { enabled: !!clientId },
  );

  const maxBucketAmount = React.useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.buckets.map((b) => b.amount));
  }, [data]);

  const unpaidBucket = data?.buckets.find((b) => b.key === "unpaid");

  if (isLoading) {
    return (
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-sm text-destructive">
          {error.message || "Failed to load billing summary"}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const hasInvoices = data.totalInvoices > 0;
  const barSegments = data.buckets
    .filter((b) => b.amount > 0)
    .map((b) => ({
      key: b.key as BucketKey,
      width: (b.amount / data.totalAmount) * 100 || 0,
    }));

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-4 w-4 text-primary" />
              </span>
              Invoices / Billing
            </CardTitle>
            <p className="text-xs text-muted-foreground pl-10">
              All invoices billed to this client or their teams
            </p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 text-xs" asChild>
            <Link to="/agency/invoices">
              View all
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Summary stats */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-gradient-to-br from-background to-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total invoices
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {data.totalInvoices}
            </p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Combined value
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {formatMoney(data.totalAmount, data.currency)}
            </p>
          </div>
        </div>

        {!hasInvoices ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No invoices yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices linked to this client or their teams will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Stacked distribution bar */}
            {data.totalAmount > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Distribution by value</p>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {barSegments.map((seg) => (
                    <div
                      key={seg.key}
                      className={cn("h-full transition-all", BUCKET_META[seg.key].barClass)}
                      style={{ width: `${seg.width}%` }}
                      title={data.buckets.find((b) => b.key === seg.key)?.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status rows */}
            <div className="space-y-1.5">
              {data.buckets.map((bucket) => {
                const key = bucket.key as BucketKey;
                const meta = BUCKET_META[key];
                const Icon = meta.icon;
                const barPct = maxBucketAmount > 0 ? (bucket.amount / maxBucketAmount) * 100 : 0;

                return (
                  <div
                    key={bucket.key}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-colors",
                      meta.rowHover,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        meta.iconBg,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", meta.iconClass)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{bucket.label}</p>
                        <p className="text-sm font-bold tabular-nums shrink-0">
                          <span className="text-muted-foreground font-normal mr-1.5">
                            {bucket.count}
                          </span>
                          <span className="text-muted-foreground font-normal">·</span>
                          <span className="ml-1.5">{formatMoney(bucket.amount, data.currency)}</span>
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                        <div
                          className={cn("h-full rounded-full transition-all", meta.barClass)}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {unpaidBucket && unpaidBucket.count > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {unpaidBucket.count} unpaid invoice{unpaidBucket.count !== 1 ? "s" : ""} outstanding
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  Total due: {formatMoney(unpaidBucket.amount, data.currency)}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
