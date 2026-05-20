"use client";

import * as React from "react";
import { format } from "date-fns";
import { Globe, Clock, CheckCircle, XCircle, AlertCircle, Send, CreditCard } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set(["AWAITING_PAYMENT", "PENDING", "SUBMITTED_TO_PROVIDER"]);

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string; icon: React.ReactNode }
> = {
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    variant: "outline",
    className: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    icon: <CreditCard className="h-3 w-3 mr-1 shrink-0" />,
  },
  PENDING: {
    label: "Processing",
    variant: "secondary",
    className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    icon: <Clock className="h-3 w-3 mr-1 shrink-0" />,
  },
  SUBMITTED_TO_PROVIDER: {
    label: "Submitted",
    variant: "default",
    className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    icon: <Send className="h-3 w-3 mr-1 shrink-0" />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "default",
    className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    icon: <CheckCircle className="h-3 w-3 mr-1 shrink-0" />,
  },
  FAILED: {
    label: "Failed",
    variant: "destructive",
    className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    icon: <XCircle className="h-3 w-3 mr-1 shrink-0" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
    className: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
    icon: <AlertCircle className="h-3 w-3 mr-1 shrink-0" />,
  },
};

function formatPrice(amount: string | null, currency: string | null): string {
  if (amount == null || currency == null) return "—";
  const symbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] ?? currency;
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return "—";
  return `${symbol} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function orderStatusHint(
  requestStatus: string,
  niscOrderStatus: string | null | undefined,
): string | null {
  if (requestStatus === "AWAITING_PAYMENT") {
    return "Complete payment in checkout to continue.";
  }
  if (requestStatus === "PENDING" && niscOrderStatus) {
    if (niscOrderStatus === "PROCESSING") return "Order is being provisioned…";
    if (niscOrderStatus === "PENDING") return "Payment received; queued for processing.";
    if (niscOrderStatus === "FAILED") return "Order processing failed.";
    if (niscOrderStatus === "PARTIAL") return "Order partially completed.";
    if (niscOrderStatus === "COMPLETED") return "Order completed; finalizing transfer.";
  }
  if (requestStatus === "SUBMITTED_TO_PROVIDER") {
    return "Transfer submitted to the registry.";
  }
  return null;
}

export function TransferRequestsList() {
  const { data: requests = [], isLoading, error, isFetching } =
    trpc.domainTransfer.listTransferRequests.useQuery(undefined, {
      refetchInterval: (query) => {
        const rows = query.state.data ?? [];
        return rows.some((r) => ACTIVE_STATUSES.has(r.status)) ? 3000 : false;
      },
      refetchIntervalInBackground: true,
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {error.message ?? "Failed to load transfer requests."}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">No transfer requests yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            When you start a transfer from the Transfer domain tab, it will appear here and update as payment and provisioning progress.
          </p>
        </div>
      </div>
    );
  }

  const hasActive = requests.some((r) => ACTIVE_STATUSES.has(r.status));

  return (
    <div className="space-y-2">
      {hasActive && isFetching && (
        <p className="text-xs text-muted-foreground flex items-center gap-2 px-1">
          <Spinner size={14} className="shrink-0" />
          Updating transfer status…
        </p>
      )}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-sm font-bold">Domain</TableHead>
              <TableHead className="text-sm font-bold">Provider</TableHead>
              <TableHead className="text-sm font-bold">Status</TableHead>
              <TableHead className="text-sm font-bold">Order</TableHead>
              <TableHead className="text-sm font-bold text-right">Customer price</TableHead>
              <TableHead className="text-sm font-bold">Submitted</TableHead>
              <TableHead className="text-sm font-bold">Created</TableHead>
              <TableHead className="text-sm font-bold">Created by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {requests.map((row) => {
              const statusConfig = STATUS_CONFIG[row.status] ?? {
                label: row.status,
                variant: "secondary" as const,
                className: "",
                icon: null,
              };
              const hint = orderStatusHint(row.status, row.niscOrderStatus);
              return (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        {row.domainName}
                      </span>
                      {hint ? (
                        <span className="text-xs text-muted-foreground font-normal pl-6">{hint}</span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.provider}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig.variant}
                      className={cn("text-xs flex items-center w-fit", statusConfig.className)}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.niscOrderNumber ? (
                      <span className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs">{row.niscOrderNumber}</span>
                        {row.niscOrderStatus ? (
                          <span className="text-xs capitalize">{row.niscOrderStatus.toLowerCase()}</span>
                        ) : null}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.customerPriceAmount, row.customerPriceCurrency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.submittedToProviderAt
                      ? format(new Date(row.submittedToProviderAt), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(row.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.createdBy?.name ?? row.createdBy?.email ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
