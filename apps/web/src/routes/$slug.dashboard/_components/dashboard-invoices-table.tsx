"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router";
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
import { invoiceUiSchema, type InvoiceUI } from "@/routes/agency.dashboard/_components/schemas";
import { FileText } from "lucide-react";

function InvoicesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getStatusBadgeVariant(status: InvoiceUI["status"]) {
  switch (status) {
    case "PAID":
      return "default";
    case "PARTIALLY_PAID":
      return "secondary";
    case "OVERDUE":
      return "destructive";
    case "SENT":
      return "outline";
    case "DRAFT":
      return "secondary";
    case "CANCELLED":
    case "WRITTEN_OFF":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusDisplayText(status: InvoiceUI["status"]) {
  switch (status) {
    case "PARTIALLY_PAID":
      return "Partially Paid";
    case "WRITTEN_OFF":
      return "Written Off";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  }
}

export function DashboardInvoicesTable() {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1];

  const { data: teamData, isLoading: isTeamLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug, staleTime: 5 * 60 * 1000 }
  );

  const {
    data,
    isLoading: isInvoicesLoading,
    isError,
    error,
    refetch,
  } = trpc.invoicing.list.useQuery(
    { limit: 50, offset: 0, teamId: teamData?.id ?? undefined },
    { enabled: !!teamData?.id }
  );

  const isLoading = isTeamLoading || isInvoicesLoading;

  if (isLoading) {
    return <InvoicesTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <span className="text-sm font-medium mb-1 block">Failed to load invoices</span>
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

  const invoices: InvoiceUI[] = data.invoices.map((invoice) =>
    invoiceUiSchema.parse({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    })
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">No invoices found</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Invoices issued to your company will appear here.
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Link
                    href={`/${teamSlug}/invoices/${invoice.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.customerName || "—"}</span>
                    {invoice.customerEmail && (
                      <span className="text-sm text-muted-foreground">{invoice.customerEmail}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {getStatusDisplayText(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.amount
                    ? `${invoice.currency} ${parseFloat(invoice.amount).toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell>
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

