"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsTable } from "./transactions-table";
import { InvoicesTable } from "./invoices-table";
import { TransactionLogsTable } from "./transaction-logs-table";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="transactions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="transaction-logs">Transaction Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="transactions" className="mt-6">
        <TransactionsTable />
      </TabsContent>

      <TabsContent value="invoices" className="mt-6">
        <InvoicesTable />
      </TabsContent>

      <TabsContent value="transaction-logs" className="mt-6">
        <TransactionLogsTable />
      </TabsContent>
    </Tabs>
  );
}
