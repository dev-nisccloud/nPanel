"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Package, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSubscriptionRow } from "./dashboard-subscriptions-schema";

function SubscriptionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-14" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  const isSuspendedOrExpired = status === "SUSPENDED" || status === "EXPIRED";
  const Icon = isActive
    ? CheckCircle2
    : isSuspendedOrExpired
      ? XCircle
      : status === "PENDING"
        ? Clock
        : AlertCircle;

  return (
    <Badge
      variant={isActive ? "default" : isSuspendedOrExpired ? "destructive" : "outline"}
      className={cn(
        "flex w-fit items-center gap-1",
        isActive && "border-green-600 bg-green-600 text-white hover:bg-green-600/90",
        isSuspendedOrExpired && "border-red-600 bg-red-600 text-white hover:bg-red-600/90",
      )}
    >
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function displayServiceName(
  productName: string,
  productPlanName: string | null,
  subscriptionName: string | null,
): string {
  const base = productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
  return subscriptionName?.trim() ? `${base} (${subscriptionName})` : base;
}

/** Map clientSubscriptions.listForTeam item to dashboard-local row type. API dates may be ISO strings over the wire. */
function toDashboardRow(
  sub: {
    id: string;
    productName: string;
    productPlanName: string | null;
    subscriptionName?: string | null;
    subscriptionDate: Date | string | null;
    nextRenewalDate: Date | string | null;
    expiryDate: Date | string | null;
    status: string;
  }
): DashboardSubscriptionRow {
  const subDate = sub.subscriptionDate
    ? sub.subscriptionDate instanceof Date
      ? sub.subscriptionDate
      : new Date(sub.subscriptionDate)
    : null;
  const nextDate = sub.nextRenewalDate ?? sub.expiryDate;
  const nextRenewal = nextDate
    ? nextDate instanceof Date
      ? nextDate
      : new Date(nextDate)
    : null;
  const label = displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName ?? null);
  return {
    id: sub.id,
    planName: label,
    planType: sub.productName,
    subscriptionDate: subDate,
    nextRenewalDate: nextRenewal,
    status: sub.status as DashboardSubscriptionRow["status"],
  };
}

export function DashboardSubscriptionsTable() {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1];

  const {
    data: apiSubscriptions,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.clientSubscriptions.listForTeam.useQuery(
    { teamSlug: teamSlug ?? "" },
    { enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
  );

  const subscriptions: DashboardSubscriptionRow[] = React.useMemo(
    () => (apiSubscriptions ?? []).map(toDashboardRow),
    [apiSubscriptions]
  );

  if (isLoading) {
    return <SubscriptionsTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-12 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <span className="mb-1 block text-sm font-medium">Failed to load subscriptions</span>
        <span className="mb-4 block text-sm text-muted-foreground">
          {error?.message ?? "Something went wrong. Please try again."}
        </span>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <CleanList
      emptyMessage="No subscriptions found. Subscriptions for your company will appear here."
      columns={[
        { key: "name", label: "Service" },
        { key: "planType", label: "Plan type", className: "w-40", hideBelow: "@lg" },
        { key: "dates", label: "Dates", className: "w-56", hideBelow: "@xl" },
      ]}
    >
      {subscriptions.map((sub) => {
        const subscribed = formatDate(sub.subscriptionDate);
        const renews = formatDate(sub.nextRenewalDate);

        return (
          <CleanListRow
            key={sub.id}
            title={sub.planName ?? "—"}
            description={<StatusBadge status={sub.status} />}
            cells={{
              planType: <CleanListCell>{sub.planType ?? "—"}</CleanListCell>,
              dates: (
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {subscribed ? `Subscribed ${subscribed}` : "—"}
                  </p>
                  <CleanListCell>
                    {renews ? `Expires ${renews}` : "—"}
                  </CleanListCell>
                </div>
              ),
            }}
          />
        );
      })}
    </CleanList>
  );
}
