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
import { invoiceTransactionUiSchema, type InvoiceTransactionUI } from "./schemas";

function TransactionLogsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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

function getStatusBadgeVariant(status: InvoiceTransactionUI["status"]) {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "outline";
    case "FAILED":
      return "destructive";
    case "REFUNDED":
      return "secondary";
    default:
      return "outline";
  }
}

function getMethodDisplayText(method: InvoiceTransactionUI["method"]) {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "MPESA":
      return "M-Pesa";
    default:
      return method;
  }
}

export function TransactionLogsTable() {
  const { data, isLoading, isError } = trpc.invoicing.listTransactions.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <TransactionLogsTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">Failed to load transaction logs</p>
        </div>
      </div>
    );
  }

  // Transform API data to UI schema
  // Schema handles date string to Date conversion automatically via preprocess
  const transactions: InvoiceTransactionUI[] = data.transactions.map((transaction) =>
    invoiceTransactionUiSchema.parse({
      id: transaction.id,
      invoiceId: transaction.invoiceId,
      invoiceNumber: transaction.invoiceNumber,
      reference: transaction.reference,
      providerReference: transaction.providerReference,
      status: transaction.status,
      method: transaction.method,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt: transaction.paidAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No transaction logs found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <span className="font-medium">
                    {transaction.invoiceNumber || `Invoice ${transaction.invoiceId.slice(0, 8)}`}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.reference || transaction.providerReference || "- "}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getMethodDisplayText(transaction.method)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.currency} {parseFloat(transaction.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  {transaction.paidAt
                    ? new Date(transaction.paidAt).toLocaleDateString()
                    : new Date(transaction.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
