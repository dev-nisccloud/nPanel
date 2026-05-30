"use client";

import * as React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import {
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  CreditCard,
  EllipsisVertical,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NON_DELETABLE_STATUSES = new Set(["COMPLETED", "FAILED"]);

function canDeleteTransferRequest(status: string): boolean {
  return !NON_DELETABLE_STATUSES.has(status);
}

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
  OUTGOING_PENDING: {
    label: "Transferring out",
    variant: "outline",
    className: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    icon: <ArrowUpRight className="h-3 w-3 mr-1 shrink-0" />,
  },
};

type TransferDirection = "incoming" | "outgoing";

const DIRECTION_CONFIG: Record<
  TransferDirection,
  { label: string; className: string; icon: React.ReactNode }
> = {
  incoming: {
    label: "Incoming",
    className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
    icon: <ArrowDownLeft className="h-3 w-3 mr-1 shrink-0" />,
  },
  outgoing: {
    label: "Outgoing",
    className: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    icon: <ArrowUpRight className="h-3 w-3 mr-1 shrink-0" />,
  },
};

function formatPrice(amount: string | null, currency: string | null): string {
  if (amount == null || currency == null) return "-";
  const symbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] ?? currency;
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return "-";
  return `${symbol} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function orderStatusHint(
  requestStatus: string,
  niscOrderStatus: string | null | undefined,
  direction?: TransferDirection,
): string | null {
  if (direction === "outgoing") {
    return "Domain is transferring away from Nisc Cloud to another registrar.";
  }
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

type TransferRequestsListProps = {
  /** Agency table: order column, created by, and row actions menu. */
  variant?: "agency" | "customer";
};

export function TransferRequestsList({ variant = "customer" }: TransferRequestsListProps) {
  const isAgency = variant === "agency";
  const navigate = useNavigate();
  const openForTransfer = useGlobalBuyNowStore((s) => s.openForTransfer);
  const [resumingRequestId, setResumingRequestId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    domainName: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: requests = [], isLoading, error, isFetching, refetch } =
    trpc.domainTransfer.listTransferRequests.useQuery(undefined);

  const { data: transferProduct } = trpc.clientSubscriptions.getTransferProductId.useQuery();
  const { data: domainsProductIdFallback } = trpc.clientSubscriptions.getDomainsProductId.useQuery(
    undefined,
    { enabled: transferProduct === null },
  );
  const domainsProductId = transferProduct?.id ?? domainsProductIdFallback ?? null;
  const getCheckoutResume = trpc.domainTransfer.getCheckoutResumeContext.useMutation();
  const deleteTransferRequest = trpc.domainTransfer.deleteTransferRequest.useMutation({
    onSuccess: () => {
      toast.success("Transfer request deleted");
      void utils.domainTransfer.listTransferRequests.invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error("Could not delete transfer request", {
        description: err.message ?? "Please try again.",
      });
    },
  });

  const handleCompletePayment = async (requestId: string) => {
    if (!domainsProductId) {
      toast.error("Domains product not available", {
        description: "Please try again or contact support.",
      });
      return;
    }

    setResumingRequestId(requestId);
    try {
      const resume = await getCheckoutResume.mutateAsync({ id: requestId });
      openForTransfer({
        domain: resume.domainName,
        authCode: resume.authCode,
        price: resume.price,
        currency: resume.currency,
        productId: domainsProductId,
        productName: "Domains",
        domainTransferRequestId: resume.id,
        provider: resume.provider,
        teamId: resume.teamId ?? undefined,
      });
    } catch (err) {
      toast.error("Could not open checkout", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setResumingRequestId(null);
    }
  };

  const handleViewOrder = (niscOrderId: string | null) => {
    if (!niscOrderId) {
      toast.error("No order linked", {
        description: "This transfer does not have a service order yet.",
      });
      return;
    }
    navigate(`/agency/nisc-service-orders?order=${encodeURIComponent(niscOrderId)}`);
  };

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

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => void refetch()}
          disabled={isFetching}
          title="Refresh transfer requests"
          aria-label="Refresh transfer requests"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-sm font-bold">Domain</TableHead>
              {isAgency ? <TableHead className="text-sm font-bold">Direction</TableHead> : null}
              <TableHead className="text-sm font-bold">Status</TableHead>
              {isAgency ? <TableHead className="text-sm font-bold">Order</TableHead> : null}
              <TableHead className="text-sm font-bold text-right">Price</TableHead>
              <TableHead className="text-sm font-bold">Submitted</TableHead>
              {isAgency ? <TableHead className="text-sm font-bold">Created by</TableHead> : null}
              <TableHead className="text-sm font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {requests.map((row) => {
              const direction = (row.direction ?? "incoming") as TransferDirection;
              const directionConfig = DIRECTION_CONFIG[direction];
              const statusConfig = STATUS_CONFIG[row.status] ?? {
                label: row.status,
                variant: "secondary" as const,
                className: "",
                icon: null,
              };
              const hint = orderStatusHint(row.status, row.niscOrderStatus, direction);
              const isResuming = resumingRequestId === row.id;
              const showCompletePayment = row.status === "AWAITING_PAYMENT";
              const isOutgoingProviderRow = direction === "outgoing";
              const showDelete = isAgency && canDeleteTransferRequest(row.status) && !isOutgoingProviderRow;
              const showAgencyMenu =
                isAgency && !isOutgoingProviderRow && (Boolean(row.niscOrderId) || showDelete);
              const hasRowActions = showCompletePayment || showAgencyMenu;

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
                  {isAgency ? (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs flex items-center w-fit",
                          directionConfig.className,
                        )}
                      >
                        {directionConfig.icon}
                        {directionConfig.label}
                      </Badge>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Badge
                      variant={statusConfig.variant}
                      className={cn("text-xs flex items-center w-fit", statusConfig.className)}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  {isAgency ? (
                    <TableCell className="text-muted-foreground">
                      {row.niscOrderNumber ? (
                        <span className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs">{row.niscOrderNumber}</span>
                          {row.niscOrderStatus ? (
                            <span className="text-xs capitalize">{row.niscOrderStatus.toLowerCase()}</span>
                          ) : null}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.customerPriceAmount, row.customerPriceCurrency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.submittedToProviderAt
                      ? format(new Date(row.submittedToProviderAt), "MMM d, yyyy HH:mm")
                      : "-"}
                  </TableCell>
                  {isAgency ? (
                    <TableCell className="text-muted-foreground">
                      {row.createdBy?.name ?? row.createdBy?.email ?? "-"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    {hasRowActions ? (
                      <div className="flex items-center justify-end gap-1">
                        {showCompletePayment ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={isResuming || getCheckoutResume.isPending}
                            onClick={() => void handleCompletePayment(row.id)}
                          >
                            {isResuming ? (
                              <>
                                <Spinner size={14} className="mr-1.5 shrink-0" />
                                Opening…
                              </>
                            ) : (
                              "Complete payment"
                            )}
                          </Button>
                        ) : null}
                        {showAgencyMenu ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label="More actions"
                              >
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                disabled={!row.niscOrderId}
                                onSelect={() => handleViewOrder(row.niscOrderId)}
                              >
                                View order
                              </DropdownMenuItem>
                              {showDelete ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() =>
                                      setDeleteTarget({
                                        id: row.id,
                                        domainName: row.domainName,
                                      })
                                    }
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transfer request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the transfer request for{" "}
              <span className="font-medium text-foreground">{deleteTarget?.domainName}</span>.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTransferRequest.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTransferRequest.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleteTarget) return;
                deleteTransferRequest.mutate({ id: deleteTarget.id });
              }}
            >
              {deleteTransferRequest.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
