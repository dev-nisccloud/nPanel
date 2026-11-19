"use client";

import * as React from "react";
import { Link } from "react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";

type UnmatchedPayment = RouterOutputs["paymentTransactions"]["listUnmatched"][number];
type PendingAction = { kind: "complete" | "REFUND_NEEDED" | "DISMISSED"; row: UnmatchedPayment };

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-KE")}`;
}

function formatWhen(value: Date | string) {
  return new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export default function UnmatchedPaymentsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.paymentTransactions.listUnmatched.useQuery();
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [note, setNote] = React.useState("");

  const close = () => {
    setPending(null);
    setNote("");
  };
  const onDone = async (message: string) => {
    toast.success(message);
    close();
    await utils.paymentTransactions.listUnmatched.invalidate();
  };
  const complete = trpc.paymentTransactions.completeUnmatched.useMutation({
    onSuccess: () => onDone("Order created and sent for processing."),
    onError: (err) => toast.error(err.message || "Could not create the order."),
  });
  const resolve = trpc.paymentTransactions.resolveUnmatched.useMutation({
    onSuccess: () => onDone("Payment updated."),
    onError: (err) => toast.error(err.message || "Could not update the payment."),
  });
  const busy = complete.isPending || resolve.isPending;

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === "complete") {
      complete.mutate({ transactionId: pending.row.id });
    } else {
      resolve.mutate({
        transactionId: pending.row.id,
        action: pending.kind,
        note: note.trim() || undefined,
      });
    }
  };

  const rows = data ?? [];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          to="/hq/transactions"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Transactions
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Unmatched payments</h1>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Payments that went through but never produced an order, usually because the customer
              closed the page or lost connection after paying. Creating the order uses the cart saved
              when they started paying, so nothing is re-priced. Payments appear here 10 minutes after
              they succeed.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-xs text-destructive">
              {(error as Error)?.message || "Could not load unmatched payments."}
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              Nothing to review. Every successful payment has an order.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paid</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="align-top text-xs">
                        <div>{formatWhen(row.paidAt)}</div>
                        <div className="text-muted-foreground">
                          {row.gateway} · {row.reference ?? "no reference"}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        <div className="font-medium">{row.customerName ?? "Unknown"}</div>
                        <div className="text-muted-foreground">{row.customerEmail}</div>
                        {row.organization ? (
                          <div className="text-muted-foreground">{row.organization}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        {row.lines.length === 0
                          ? "No order details saved"
                          : row.lines.map((line, i) => (
                              <div key={i}>
                                {line.product}
                                {line.detail ? (
                                  <span className="text-muted-foreground"> · {line.detail}</span>
                                ) : null}
                              </div>
                            ))}
                      </TableCell>
                      <TableCell className="align-top text-right text-xs">
                        <div className="font-medium">{formatMoney(row.currency, row.paidAmount)}</div>
                        {row.expectedAmount != null ? (
                          <div
                            className={
                              row.paidAmount < row.expectedAmount
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            Order total {formatMoney(row.currency, row.expectedAmount)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={!row.canComplete}
                            title={
                              row.canComplete
                                ? undefined
                                : "The payment is less than the order total or no order details were saved. Create the order manually."
                            }
                            onClick={() => setPending({ kind: "complete", row })}
                          >
                            Complete order
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPending({ kind: "REFUND_NEEDED", row })}
                          >
                            Needs refund
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPending({ kind: "DISMISSED", row })}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={pending != null} onOpenChange={(open) => (!open && !busy ? close() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "complete"
                ? "Create this order?"
                : pending?.kind === "REFUND_NEEDED"
                  ? "Mark as needing a refund?"
                  : "Dismiss this payment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "complete"
                ? `This creates the order for ${pending.row.customerName ?? "the customer"} from the payment of ${formatMoney(pending.row.currency, pending.row.paidAmount)} and sends it for processing. The customer gets the usual order emails.`
                : pending?.kind === "REFUND_NEEDED"
                  ? "No order is created. The payment leaves this list and is flagged in its history so the refund can be sent from M-Pesa or the bank."
                  : "No order is created and nothing is flagged. Use this only when the payment has been dealt with elsewhere."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pending && pending.kind !== "complete" ? (
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Note (optional)"
              aria-label="Note"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button onClick={confirm} disabled={busy}>
              {busy ? "Working…" : "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
