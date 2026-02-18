"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsTable } from "./transactions-table";
import { InvoicesTable } from "./invoices-table";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="w-fit">
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>

      <TabsContent value="invoices" className="mt-6">
        <InvoicesTable />
      </TabsContent>

      <TabsContent value="transactions" className="mt-6">
        <TransactionsTable />
      </TabsContent>
    </Tabs>
  );
}
