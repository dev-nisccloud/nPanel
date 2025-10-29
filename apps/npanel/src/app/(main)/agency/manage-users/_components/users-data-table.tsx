"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { userSchema } from "./schema";
import { createUserColumns } from "./columns";
import { AddUserSheet } from "./add-user-sheet";
import { UpdateUserSheet } from "./update-user-sheet";

interface UsersDataTableProps {
  data: z.infer<typeof userSchema>[];
}

export function UsersDataTable({ data: initialData }: UsersDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [isUpdateUserOpen, setIsUpdateUserOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<z.infer<typeof userSchema> | null>(null);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const handleEditUser = (user: z.infer<typeof userSchema>) => {
    setSelectedUser(user);
    setIsUpdateUserOpen(true);
  };

  const columns = createUserColumns({
    onEditUser: handleEditUser,
  });

  const table = useDataTableInstance({ 
    data: filteredData, 
    columns, 
    getRowId: (row) => row.id.toString() 
  });

  const handleAddUser = (user: Omit<z.infer<typeof userSchema>, "id" | "createdAt" | "lastLoginAt">) => {
    const newUser = {
      ...user,
      id: Math.max(...data.map(u => u.id)) + 1,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    setData(prev => [newUser, ...prev]);
  };

  const handleUpdateUser = (userId: number, updatedUser: Partial<z.infer<typeof userSchema>>) => {
    setData(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updatedUser } : user
    ));
  };

  const getStatusCounts = () => {
    const counts = data.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: data.length,
      active: counts.active || 0,
      suspended: counts.suspended || 0,
      banned: counts.banned || 0,
      deactivated: counts.deactivated || 0,
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="suspended" className="flex items-center gap-2">
              Suspended ({statusCounts.suspended})
            </TabsTrigger>
            <TabsTrigger value="banned" className="flex items-center gap-2">
              Banned ({statusCounts.banned})
            </TabsTrigger>
            <TabsTrigger value="deactivated" className="flex items-center gap-2">
              Deactivated ({statusCounts.deactivated})
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

      {/* Add User Sheet */}
      <AddUserSheet
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onAddUser={handleAddUser}
      />

      {/* Update User Sheet */}
      <UpdateUserSheet
        open={isUpdateUserOpen}
        onOpenChange={setIsUpdateUserOpen}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
