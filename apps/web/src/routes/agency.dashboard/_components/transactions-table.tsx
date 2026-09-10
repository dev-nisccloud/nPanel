"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { paymentTransactionUiSchema, type PaymentTransactionUI } from "./schemas";

function TransactionsTableSkeleton() {
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
    case "JENGA":
      return "Card (Jenga)";
    case "OTHER":
      return "Other / Manual";
    case "STRIPE":
      return "Stripe";
    case "PAYPAL":
      return "PayPal";
    case "FLUTTERWAVE":
      return "Flutterwave";
    default:
      return gateway;
  }
}

function getStatusBadgeClass(status: PaymentTransactionUI["status"]) {
  if (status === "SUCCESS") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
  }
  return "";
}

export function TransactionsTable() {
  const { data, isLoading, isError, refetch } = trpc.paymentTransactions.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-8 text-center">
        <p className="mb-4 text-sm text-muted-foreground">Failed to load transactions</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const transactions: PaymentTransactionUI[] = data.transactions.map((transaction) =>
    paymentTransactionUiSchema.parse({
      id: transaction.id,
      userId: transaction.userId,
      teamId: transaction.teamId ?? null,
      userName: transaction.userName ?? null,
      gateway: transaction.gateway,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      accountReference: transaction.accountReference ?? null,
      transactionDesc: transaction.transactionDesc ?? null,
      receiptNumber: transaction.receiptNumber ?? null,
      initiatedAt: transaction.initiatedAt,
      processedAt: transaction.processedAt ?? null,
      failedAt: transaction.failedAt ?? null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })
  );

  return (
    <CleanList
      emptyMessage="No transactions found"
      columns={[
        { key: "reference", label: "Reference" },
        { key: "gateway", label: "Gateway", className: "w-32", hideBelow: "@lg" },
        { key: "amount", label: "Amount", className: "w-40", hideBelow: "@xl" },
      ]}
    >
      {transactions.map((transaction) => {
        const dateValue = transaction.processedAt
          ? new Date(transaction.processedAt)
          : new Date(transaction.initiatedAt);

        return (
          <CleanListRow
            key={transaction.id}
            title={
              transaction.accountReference ||
              transaction.receiptNumber ||
              transaction.id.slice(0, 8)
            }
            description={
              <Badge
                variant={
                  transaction.status === "SUCCESS"
                    ? "outline"
                    : getStatusBadgeVariant(transaction.status)
                }
                className={getStatusBadgeClass(transaction.status)}
              >
                {getStatusDisplayText(transaction.status)}
              </Badge>
            }
            cells={{
              gateway: (
                <CleanListCell>{getGatewayDisplayText(transaction.gateway)}</CleanListCell>
              ),
              amount: (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {transaction.currency} {parseFloat(transaction.amount).toLocaleString()}
                  </p>
                  <CleanListCell>
                    {Number.isNaN(dateValue.getTime()) ? "—" : dateValue.toLocaleDateString()}
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
