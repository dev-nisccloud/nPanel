"use client";

import * as React from "react";
import { Plus, Trash, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { orderSchema } from "./schema";
import { createOrderColumns } from "./columns";
import { AddOrderSheet } from "./add-order-sheet";
import { UpdateOrderSheet } from "./update-order-sheet";

interface OrdersDataTableProps {
  data: z.infer<typeof orderSchema>[];
}

export function OrdersDataTable({ data: initialData }: OrdersDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddOrderOpen, setIsAddOrderOpen] = React.useState(false);
  const [isUpdateOrderOpen, setIsUpdateOrderOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<z.infer<typeof orderSchema> | null>(null);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, searchTerm]);

  const handleEditOrder = (order: z.infer<typeof orderSchema>) => {
    setSelectedOrder(order);
    setIsUpdateOrderOpen(true);
  };

  const handleDeleteOrder = (orderId: number) => {
    setData(prev => prev.filter(order => order.id !== orderId));
  };

  const columns = createOrderColumns({
    onEditOrder: handleEditOrder,
    onDeleteOrder: handleDeleteOrder,
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

  const handleAddOrder = (order: Omit<z.infer<typeof orderSchema>, "id">) => {
    const newOrder = {
      ...order,
      id: Math.max(...data.map(o => o.id)) + 1,
    };
    setData(prev => [newOrder, ...prev]);
  };

  const handleUpdateOrder = (orderId: number, updatedOrder: Partial<z.infer<typeof orderSchema>>) => {
    setData(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updatedOrder } : order
    ));
  };


  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
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
          <Button onClick={() => setIsAddOrderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Order
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTableViewOptions table={table} />
      </div>
      
      <div className="rounded-md border">
        <DataTable table={table} columns={columns} />
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>

      {/* Add Order Sheet */}
      <AddOrderSheet
        open={isAddOrderOpen}
        onOpenChange={setIsAddOrderOpen}
        onAddOrder={handleAddOrder}
      />

      {/* Update Order Sheet */}
      <UpdateOrderSheet
        open={isUpdateOrderOpen}
        onOpenChange={setIsUpdateOrderOpen}
        order={selectedOrder}
        onUpdateOrder={handleUpdateOrder}
      />
    </div>
  );
}
