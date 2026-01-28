"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { Package, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function SubscriptionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Expiry / Renewal Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  HOSTING: "Hosting",
  SEO: "SEO",
  VIDEOGRAPHY: "Videography",
  VISUAL_CREATIVE: "Visual Creative",
  SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
  PAY_PER_CLICK_ADVERTISING: "Pay Per Click",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  const isSuspendedOrExpired = status === "SUSPENDED" || status === "EXPIRED";
  const Icon = isActive ? CheckCircle2 : isSuspendedOrExpired ? XCircle : status === "PENDING" ? Clock : AlertCircle;

  return (
    <Badge
      variant={isActive ? "default" : isSuspendedOrExpired ? "destructive" : "outline"}
      className={cn(
        "flex items-center gap-1 w-fit",
        isActive && "bg-green-600 hover:bg-green-600/90 text-white border-green-600",
        isSuspendedOrExpired && "bg-red-600 hover:bg-red-600/90 text-white border-red-600"
      )}
    >
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function DashboardSubscriptionsTable() {
  const pathname = usePathname();
  const teamSlug = pathname.split("/")[1];

  const { data: teamData, isLoading: isTeamLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
  );

  const {
    data: subscriptions,
    isLoading: isSubsLoading,
    isError,
    error,
    refetch,
  } = trpc.serviceSubscriptions.getAll.useQuery(
    { teamId: teamData?.id ?? undefined },
    { enabled: !!teamData?.id }
  );

  const isLoading = isTeamLoading || isSubsLoading;

  if (isLoading) {
    return <SubscriptionsTableSkeleton />;
  }

  if (isError || subscriptions === undefined) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <span className="text-sm font-medium mb-1 block">Failed to load subscriptions</span>
          <span className="text-sm text-muted-foreground mb-4 block">
            {error?.message ?? "Something went wrong. Please try again."}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Expiry / Renewal Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">No subscriptions found</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Subscriptions for your team will appear here.
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.planName ?? "—"}</TableCell>
                <TableCell>
                  {PLAN_TYPE_LABELS[sub.planType] ?? sub.planType}
                  {sub.hostingSubType && (
                    <span className="text-muted-foreground ml-1">({sub.hostingSubType.replace(/_/g, " ")})</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(sub.subscriptionDate)}</TableCell>
                <TableCell>{formatDate(sub.nextRenewalDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={sub.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
