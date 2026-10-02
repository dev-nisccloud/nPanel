"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
  SearchableCleanList,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { trpc } from "@/utils/trpc";
import {
  paymentTransactionUiSchema,
  type PaymentTransactionUI,
} from "@/routes/agency.dashboard/_components/schemas";

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

export function TransactionsTable({
  onViewTransaction,
  teamId,
  unassignedOnly,
}: {
  onViewTransaction?: (id: string) => void;
  teamId?: string;
  unassignedOnly?: boolean;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.paymentTransactions.list.useQuery({
      limit: 200,
      offset: 0,
      teamId,
      unassignedOnly,
    });

  const transactions: PaymentTransactionUI[] = React.useMemo(() => {
    if (!data?.transactions) return [];
    const parsed = data.transactions
      .map((t) => {
        try {
          return paymentTransactionUiSchema.parse({
            id: t.id,
            userId: t.userId,
            teamId: t.teamId,
            userName: t.userName ?? null,
            teamName: t.teamName ?? null,
            gateway: t.gateway,
            status: t.status,
            amount: t.amount,
            currency: t.currency,
            accountReference: t.accountReference,
            transactionDesc: t.transactionDesc,
            receiptNumber: t.receiptNumber,
            initiatedAt: t.initiatedAt,
            processedAt: t.processedAt,
            failedAt: t.failedAt,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          });
        } catch {
          return null;
        }
      })
      .filter((t): t is PaymentTransactionUI => t != null);

    if (!searchQuery.trim()) return parsed;
    const q = searchQuery.toLowerCase().trim();
    return parsed.filter((t) => {
      const ref =
        t.accountReference || t.receiptNumber || t.id.slice(0, 8) || "";
      const desc = t.transactionDesc || "";
      const amt = t.amount || "";
      const name = t.userName || "";
      return (
        ref.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        amt.includes(q) ||
        name.toLowerCase().includes(q) ||
        t.gateway.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    });
  }, [data?.transactions, searchQuery]);

  const items: SearchableCleanListItem[] = transactions.map((transaction) => {
    const reference =
      transaction.accountReference ||
      transaction.receiptNumber ||
      transaction.id.slice(0, 8);
    const dateValue = transaction.processedAt
      ? new Date(transaction.processedAt)
      : new Date(transaction.initiatedAt);
    const amountLabel = `${transaction.currency} ${parseFloat(transaction.amount).toLocaleString()}`;

    return {
      key: transaction.id,
      title: <span className="text-foreground hover:underline">{reference}</span>,
      description: (
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
      ),
      cells: {
        customer: (
          <CleanListCell className="text-sm font-medium text-foreground">
            {transaction.userName ?? ""}
          </CleanListCell>
        ),
        gateway: (
          <CleanListCell>
            {getGatewayDisplayText(transaction.gateway)}
          </CleanListCell>
        ),
        amount: (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{amountLabel}</p>
            <CleanListCell>
              {Number.isNaN(dateValue.getTime()) ? "" : dateValue.toLocaleDateString()}
            </CleanListCell>
          </div>
        ),
      },
      onClick: onViewTransaction
        ? () => onViewTransaction(transaction.id)
        : undefined,
      actions: onViewTransaction ? (
        <ViewDetailsButton onClick={() => onViewTransaction(transaction.id)} />
      ) : undefined,
    };
  });

  return (
    <SearchableCleanList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={data?.transactions.length ?? 0}
      isLoading={isLoading}
      isError={isError}
      error={(error as Error) ?? null}
      onRetry={() => refetch()}
      searchPlaceholder="Search by reference, name, amount, gateway..."
      errorTitle="Failed to load transactions"
      emptyMessage={
        searchQuery.trim()
          ? `No transactions match "${searchQuery}"`
          : "No transactions found"
      }
      columns={[
        { key: "reference", label: "Reference" },
        { key: "customer", label: "Name", className: "w-44", hideBelow: "@lg" },
        { key: "gateway", label: "Gateway", className: "w-32", hideBelow: "@xl" },
        { key: "amount", label: "Amount", className: "w-40", hideBelow: "@2xl" },
        { key: "actions", label: "Actions", align: "end" },
      ]}
      toolbarActions={
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      }
    />
  );
}
