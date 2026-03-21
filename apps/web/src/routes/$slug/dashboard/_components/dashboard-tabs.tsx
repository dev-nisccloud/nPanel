"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardInvoicesTable } from "./dashboard-invoices-table";
import { DashboardSubscriptionsTable } from "./dashboard-subscriptions-table";
import { FileText, Package } from "lucide-react";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="invoices" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Invoices
        </TabsTrigger>
        <TabsTrigger value="subscriptions" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Subscriptions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invoices" className="mt-6">
        <DashboardInvoicesTable />
      </TabsContent>

      <TabsContent value="subscriptions" className="mt-6">
        <DashboardSubscriptionsTable />
      </TabsContent>
    </Tabs>
  );
}
