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

import { clientSchema } from "./schema";
import { createClientColumns } from "./columns";
import { AddClientSheet } from "./add-client-sheet";
import { UpdateClientSheet } from "./update-client-sheet";

interface ClientsDataTableProps {
  data: z.infer<typeof clientSchema>[];
}

export function ClientsDataTable({ data: initialData }: ClientsDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddClientOpen, setIsAddClientOpen] = React.useState(false);
  const [isUpdateClientOpen, setIsUpdateClientOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<z.infer<typeof clientSchema> | null>(null);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.companyName && item.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [data, searchTerm]);

  const handleEditClient = (client: z.infer<typeof clientSchema>) => {
    setSelectedClient(client);
    setIsUpdateClientOpen(true);
  };

  const handleDeleteClient = (clientId: number) => {
    setData(prev => prev.filter(client => client.id !== clientId));
  };

  const columns = createClientColumns({
    onEditClient: handleEditClient,
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

  const handleAddClient = (client: Omit<z.infer<typeof clientSchema>, "id" | "createdAt">) => {
    const newClient = {
      ...client,
      id: Math.max(...data.map(c => c.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    setData(prev => [newClient, ...prev]);
  };

  const handleUpdateClient = (clientId: number, updatedClient: Partial<z.infer<typeof clientSchema>>) => {
    setData(prev => prev.map(client => 
      client.id === clientId ? { ...client, ...updatedClient } : client
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
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
          <Button onClick={() => setIsAddClientOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex items-center justify-between mb-4">
        <DataTableViewOptions table={table} />
      </div>

      <div className="rounded-md border">
        <DataTable table={table} columns={columns} />
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>

      {/* Add Client Sheet */}
      <AddClientSheet
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onAddClient={handleAddClient}
      />

      {/* Update Client Sheet */}
      <UpdateClientSheet
        open={isUpdateClientOpen}
        onOpenChange={setIsUpdateClientOpen}
        client={selectedClient}
        onUpdateClient={handleUpdateClient}
      />
    </div>
  );
}
