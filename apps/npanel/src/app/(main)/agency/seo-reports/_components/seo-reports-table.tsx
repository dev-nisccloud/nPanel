"use client";

import * as React from "react";
import { BarChart3, Calendar, EllipsisVertical, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { seoReportListRowSchema, type SeoReportListRow } from "./schema";
import { MONTH_LABELS } from "./schema";

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function SeoReportCardActions({
  report,
  onDeleted,
  onEdit,
}: {
  report: SeoReportListRow;
  onDeleted?: () => void;
  onEdit?: (id: string) => void;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.seoReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      utils.seoReports.list.invalidate();
      onDeleted?.();
      setIsDeleteOpen(false);
    },
    onError: (e) => toast.error(e.message || "Failed to delete report"),
  });

  const period = `${MONTH_LABELS[report.reportMonth] ?? report.reportMonth} ${report.reportYear}`;
  const displayName = report.reportName || report.websiteUrl || "—";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setIsDeleteOpen(false);
      await deleteMutation.mutateAsync({ id: report.id });
    } catch {
      /* handled in mutation */
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(report.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteOpen(true);
            }}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the report <strong>{displayName}</strong> ({period})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SeoReportsTable({
  searchQuery,
  onRowClick,
  onEditClick,
}: {
  searchQuery: string;
  onRowClick: (id: string) => void;
  onEditClick?: (id: string) => void;
}) {
  const { data, isLoading, isError, error } = trpc.seoReports.list.useQuery(
    { limit: 50, offset: 0, search: searchQuery || undefined },
    { placeholderData: (prev) => prev }
  );

  const rows: SeoReportListRow[] = React.useMemo(() => {
    if (!data?.reports) return [];
    return data.reports.map((r) =>
      seoReportListRowSchema.parse({
        ...r,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }, [data?.reports]);

  const period = (r: SeoReportListRow) =>
    `${MONTH_LABELS[r.reportMonth] ?? r.reportMonth} ${r.reportYear}`;

  const getStatusVariant = (status: string): "default" | "secondary" => {
    return status === "FINAL" ? "default" : "secondary";
  };

  const formatMetric = (value: string | null | undefined): string => {
    if (value == null || value === "") return "—";
    const num = parseFloat(String(value));
    if (Number.isNaN(num)) return value;
    if (num % 1 === 0) return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasAnyMetric = (r: SeoReportListRow) => {
    const filled = (x: string | null | undefined) => x != null && x !== "";
    return (
      filled(r.sessions) ||
      filled(r.totalWebTraffic) ||
      filled(r.users) ||
      filled(r.impressions) ||
      filled(r.clicks) ||
      filled(r.conversions)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Loading SEO reports…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {error?.message || "Failed to load reports"}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>
          {rows.length} {rows.length === 1 ? "report" : "reports"} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No reports found. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => (
              <Card
                key={r.id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onRowClick(r.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Status and actions row */}
                    <div className="flex items-start justify-between gap-2">
                      {r.status && (
                        <Badge variant={getStatusVariant(r.status)}>
                          {r.status}
                        </Badge>
                      )}
                      <SeoReportCardActions report={r} onEdit={onEditClick} />
                    </div>

                    {/* Report name — 2 rows max with ellipsis */}
                    <div className="font-medium line-clamp-2 min-h-[2.5rem]">
                      {r.reportName || r.websiteUrl || "—"}
                    </div>

                    {/* Period */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {period(r)}
                      </span>
                    </div>

                    {/* Website (if present) */}
                    {r.websiteUrl && (
                      <div className="text-xs text-muted-foreground truncate" title={r.websiteUrl}>
                        {r.websiteUrl}
                      </div>
                    )}

                    {/* Created */}
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(r.createdAt).toLocaleDateString()}
                    </div>

                    {/* Metrics Section — divider then color-coded metric cards */}
                    <div className="mt-4 pt-4 border-t">
                      {hasAnyMetric(r) ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                            <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-0.5">Sessions</div>
                            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                              {formatMetric(r.sessions)}
                            </div>
                          </div>
                          <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mb-0.5">Traffic</div>
                            <div className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                              {formatMetric(r.totalWebTraffic)}
                            </div>
                          </div>
                          <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                            <div className="text-[10px] text-green-700 dark:text-green-300 font-medium mb-0.5">Users</div>
                            <div className="text-xs font-semibold text-green-900 dark:text-green-100">
                              {formatMetric(r.users)}
                            </div>
                          </div>
                          <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                            <div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium mb-0.5">Impressions</div>
                            <div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                              {formatMetric(r.impressions)}
                            </div>
                          </div>
                          <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mb-0.5">Clicks</div>
                            <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
                              {formatMetric(r.clicks)}
                            </div>
                          </div>
                          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mb-0.5">Conversions</div>
                            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                              {formatMetric(r.conversions)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <BarChart3 className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                          <p className="text-xs text-muted-foreground">
                            No metrics yet
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Edit the report to add session and traffic data
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
