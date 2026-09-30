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
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BucketKey = "paid" | "draft" | "unpaid" | "cancelled" | "refunded";

const BUCKET_META: Record<
  BucketKey,
  {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    iconClassName: string;
    amountClassName: string;
  }
> = {
  paid: {
    icon: CheckCircle2,
    iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    amountClassName: "text-emerald-600 dark:text-emerald-400",
  },
  draft: {
    icon: FileEdit,
    iconClassName: "bg-muted text-muted-foreground",
    amountClassName: "text-foreground",
  },
  unpaid: {
    icon: Clock,
    iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    amountClassName: "text-amber-600 dark:text-amber-400",
  },
  cancelled: {
    icon: XCircle,
    iconClassName: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    amountClassName: "text-rose-600 dark:text-rose-400",
  },
  refunded: {
    icon: RotateCcw,
    iconClassName: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    amountClassName: "text-violet-600 dark:text-violet-400",
  },
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
}

export function OverviewInvoicesBilling({ clientId }: { clientId: string }) {
  const { data, isLoading, error } = trpc.clients.getInvoiceBillingSummary.useQuery(
    { userId: clientId },
    { enabled: !!clientId },
  );

  if (isLoading) {
    return (
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-5 py-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <Skeleton className="h-48 rounded-lg" />
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

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center gap-3 border-b px-5 pt-4 pb-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <Receipt className="size-4" />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-sm">Invoices</CardTitle>
          <CardDescription className="text-xs">
            Billed to this client or their organizations
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="inline-flex rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Receipt className="size-5" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Total invoices</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{data.totalInvoices}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Combined value</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {formatMoney(data.totalAmount, data.currency)}
            </p>
          </div>
        </div>

        {!hasInvoices ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center">
            <p className="text-sm font-medium">No invoices yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Invoices for this client will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {data.buckets.map((bucket) => {
              const key = bucket.key as BucketKey;
              const meta = BUCKET_META[key];
              const Icon = meta.icon;
              return (
                <li key={bucket.key} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("inline-flex rounded-lg p-2", meta.iconClassName)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm">{bucket.label}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-sm font-medium tabular-nums whitespace-nowrap", meta.amountClassName)}>
                      {formatMoney(bucket.amount, data.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{bucket.count}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <div className="border-t px-3 py-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link to="/agency/invoices">View invoices</Link>
        </Button>
      </div>
    </Card>
  );
}
