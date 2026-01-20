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
import { paymentTransactionUiSchema, type PaymentTransactionUI } from "./schemas";

function TransactionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
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

function getStatusBadgeVariant(status: PaymentTransactionUI["status"]) {
  switch (status) {
    case "SUCCESS":
      return "default";
    case "PROCESSING":
      return "secondary";
    case "PENDING":
      return "outline";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusDisplayText(status: PaymentTransactionUI["status"]) {
  switch (status) {
    case "PARTIALLY_REFUNDED":
      return "Partially Refunded";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function getGatewayDisplayText(gateway: PaymentTransactionUI["gateway"]) {
  switch (gateway) {
    case "MPESA":
      return "M-Pesa";
    default:
      return gateway;
  }
}

export function TransactionsTable() {
  const { data, isLoading, isError } = trpc.paymentTransactions.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">Failed to load transactions</p>
        </div>
      </div>
    );
  }

  // Transform API data to UI schema
  // Schema handles date string to Date conversion automatically via preprocess
  const transactions: PaymentTransactionUI[] = data.transactions.map((transaction) =>
    paymentTransactionUiSchema.parse({
      id: transaction.id,
      userId: transaction.userId,
      teamId: transaction.teamId,
      gateway: transaction.gateway,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      accountReference: transaction.accountReference,
      transactionDesc: transaction.transactionDesc,
      receiptNumber: transaction.receiptNumber,
      initiatedAt: transaction.initiatedAt,
      processedAt: transaction.processedAt,
      failedAt: transaction.failedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.accountReference || transaction.receiptNumber || transaction.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getGatewayDisplayText(transaction.gateway)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(transaction.status)}>
                    {getStatusDisplayText(transaction.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.currency} {parseFloat(transaction.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  {transaction.processedAt
                    ? new Date(transaction.processedAt).toLocaleDateString()
                    : new Date(transaction.initiatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
