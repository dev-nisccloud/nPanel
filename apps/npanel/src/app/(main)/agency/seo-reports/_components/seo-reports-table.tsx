"use client";

import * as React from "react";
import { EllipsisVertical, Loader2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Website</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12 pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="pr-6" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SeoReportRowActions({ report, onDeleted }: { report: SeoReportListRow; onDeleted?: () => void }) {
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
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
              Are you sure you want to delete the report for <strong>{report.websiteUrl}</strong> ({period})? This cannot be undone.
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
}: {
  searchQuery: string;
  onRowClick: (id: string) => void;
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

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm p-6 text-center text-destructive">
        {error?.message || "Failed to load reports"}
      </div>
    );
  }

  const period = (r: SeoReportListRow) =>
    `${MONTH_LABELS[r.reportMonth] ?? r.reportMonth} ${r.reportYear}`;

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Website</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12 pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No reports found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(r.id)}
              >
                <TableCell className="pl-6 font-medium">{r.websiteUrl}</TableCell>
                <TableCell>{period(r)}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "FINAL" ? "default" : "secondary"}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
                  <SeoReportRowActions report={r} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
