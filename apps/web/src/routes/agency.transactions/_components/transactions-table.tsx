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
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { Eye } from "lucide-react";
import {
  paymentTransactionUiSchema,
  type PaymentTransactionUI,
} from "@/routes/agency.dashboard/_components/schemas";

function TransactionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Reference</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="pr-4">Date</TableHead>
            <TableHead className="pr-4 w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-4 w-16" />
              </TableCell>
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

export function TransactionsTable({
  searchQuery,
  onViewTransaction,
}: {
  searchQuery?: string;
  onViewTransaction?: (id: string) => void;
}) {
  const { data, isLoading, isError } = trpc.paymentTransactions.list.useQuery({
    limit: 50,
    offset: 0,
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

    if (!searchQuery?.trim()) return parsed;
    const q = searchQuery.toLowerCase().trim();
    return parsed.filter((t) => {
      const ref =
        t.accountReference ||
        t.receiptNumber ||
        t.id.slice(0, 8) ||
        "";
      const desc = t.transactionDesc || "";
      const amt = t.amount || "";
      return (
        ref.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        amt.includes(q) ||
        t.gateway.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    });
  }, [data?.transactions, searchQuery]);

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Reference</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="pr-4">Date</TableHead>
            <TableHead className="pr-4 w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 px-4 text-muted-foreground"
              >
                {searchQuery?.trim()
                  ? `No transactions match "${searchQuery}"`
                  : "No transactions found"}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell
                  className="pl-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onViewTransaction?.(transaction.id)}
                >
                  {transaction.accountReference ||
                    transaction.receiptNumber ||
                    transaction.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.userName ?? "- "}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getGatewayDisplayText(transaction.gateway)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.status === "SUCCESS" ? "outline" : getStatusBadgeVariant(transaction.status)}
                    className={
                      transaction.status === "SUCCESS"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                        : ""
                    }
                  >
                    {getStatusDisplayText(transaction.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.currency}{" "}
                  {parseFloat(transaction.amount).toLocaleString()}
                </TableCell>
                <TableCell className="pr-4">
                  {transaction.processedAt
                    ? new Date(transaction.processedAt).toLocaleDateString()
                    : new Date(transaction.initiatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="pr-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => onViewTransaction?.(transaction.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

