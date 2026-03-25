"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { TransactionsTable } from "./agency.transactions/_components/transactions-table";
import { TransactionViewSheet } from "./agency.transactions/_components/transaction-view-sheet";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewingTransactionId, setViewingTransactionId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const utils = trpc.useUtils();
  const { isFetching } = trpc.paymentTransactions.list.useQuery(
    { limit: 50, offset: 0 },
    { placeholderData: (prev) => prev }
  );

  const handleRefresh = React.useCallback(() => {
    utils.paymentTransactions.list.invalidate();
  }, [utils]);

  const handleViewTransaction = React.useCallback((id: string) => {
    setViewingTransactionId(id);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = React.useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setViewingTransactionId(null);
  }, []);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Transactions</h1>
          <p className="text-xs text-muted-foreground">
            View and track payment transactions across your agency.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by reference, amount, gateway..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <TransactionsTable
            searchQuery={searchQuery}
            onViewTransaction={handleViewTransaction}
          />
        </div>
      </div>

      <TransactionViewSheet
        transactionId={viewingTransactionId}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
