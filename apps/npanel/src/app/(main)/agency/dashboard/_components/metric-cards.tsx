"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ShoppingCart, FileText, MessageSquare } from "lucide-react";

export function MetricCards() {
  // Mock data
  const domainsData = {
    total: 1250,
    active: 1180,
    expired: 70,
  };

  const ordersData = {
    total: 342,
    processed: 320,
    failed: 22,
  };

  const invoicesData = {
    total: 856,
    paid: 780,
    unpaid: 76,
  };

  const ticketsData = {
    total: 234,
    completed: 198,
    noResponse: 36,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Domains Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domains
          </CardTitle>
          <CardDescription>Total domains: {domainsData.total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {domainsData.active}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expired</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {domainsData.expired}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Orders Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders
          </CardTitle>
          <CardDescription>Total orders: {ordersData.total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processed</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {ordersData.processed}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Failed</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {ordersData.failed}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
          <CardDescription>Total invoices: {invoicesData.total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {invoicesData.paid}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unpaid</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {invoicesData.unpaid}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tickets
          </CardTitle>
          <CardDescription>Total tickets: {ticketsData.total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {ticketsData.completed}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">No Response</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {ticketsData.noResponse}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
