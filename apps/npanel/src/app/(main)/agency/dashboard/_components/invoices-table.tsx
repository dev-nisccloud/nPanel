"use client";

import * as React from "react";
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
import { trpc } from "@/utils/trpc";
import { invoiceUiSchema, type InvoiceUI } from "./schemas";
import Link from "next/link";

function InvoicesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
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

export function InvoicesTable() {
  const { data, isLoading, isError } = trpc.invoicing.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <InvoicesTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">Failed to load invoices</p>
        </div>
      </div>
    );
  }

  // Transform API data to UI schema
  // Schema handles date string to Date conversion automatically via preprocess
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
            <TableHead className="pl-6">Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="pl-6">
                  <Link
                    href={`/agency/invoices/${invoice.id}`}
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
