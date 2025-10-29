"use client";

import * as React from "react";
import { Plus, Trash, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { invoiceSchema } from "./schema";
import { createInvoiceColumns } from "./columns";
import { AddInvoiceSheet } from "./add-invoice-sheet";
import { UpdateInvoiceSheet } from "./update-invoice-sheet";

interface InvoicesDataTableProps {
  data: z.infer<typeof invoiceSchema>[];
}

export function InvoicesDataTable({ data: initialData }: InvoicesDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = React.useState(false);
  const [isUpdateInvoiceOpen, setIsUpdateInvoiceOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<z.infer<typeof invoiceSchema> | null>(null);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const handleEditInvoice = (invoice: z.infer<typeof invoiceSchema>) => {
    setSelectedInvoice(invoice);
    setIsUpdateInvoiceOpen(true);
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    setData(prev => prev.filter(invoice => invoice.id !== invoiceId));
  };

  const columns = createInvoiceColumns({
    onEditInvoice: handleEditInvoice,
    onDeleteInvoice: handleDeleteInvoice,
  });

  const table = useDataTableInstance({ 
    data: filteredData, 
    columns, 
    getRowId: (row) => row.id.toString() 
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleDeleteSelected = () => {
    const selectedIds = selectedRows.map(row => row.original.id);
    setData(prev => prev.filter(item => !selectedIds.includes(item.id)));
    table.resetRowSelection();
  };

  const handleAddInvoice = (invoice: Omit<z.infer<typeof invoiceSchema>, "id" | "createdAt">) => {
    const newInvoice = {
      ...invoice,
      id: Math.max(...data.map(i => i.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    setData(prev => [newInvoice, ...prev]);
  };

  const handleUpdateInvoice = (invoiceId: number, updatedInvoice: Partial<z.infer<typeof invoiceSchema>>) => {
    setData(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updatedInvoice } : invoice
    ));
  };

  const getStatusCounts = () => {
    const counts = data.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: data.length,
      draft: counts.draft || 0,
      sent: counts.sent || 0,
      paid: counts.paid || 0,
      overdue: counts.overdue || 0,
      cancelled: counts.cancelled || 0,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddInvoiceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center gap-2">
              Draft ({statusCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              Sent ({statusCounts.sent})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              Paid ({statusCounts.paid})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              Overdue ({statusCounts.overdue})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              Cancelled ({statusCounts.cancelled})
            </TabsTrigger>
          </TabsList>
          
          <DataTableViewOptions table={table} />
        </div>

        <TabsContent value={statusFilter} className="mt-4">
          <div className="rounded-md border">
            <DataTable table={table} columns={columns} />
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <DataTablePagination table={table} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Invoice Sheet */}
      <AddInvoiceSheet
        open={isAddInvoiceOpen}
        onOpenChange={setIsAddInvoiceOpen}
        onAddInvoice={handleAddInvoice}
      />

      {/* Update Invoice Sheet */}
      <UpdateInvoiceSheet
        open={isUpdateInvoiceOpen}
        onOpenChange={setIsUpdateInvoiceOpen}
        invoice={selectedInvoice}
        onUpdateInvoice={handleUpdateInvoice}
      />
    </div>
  );
}
