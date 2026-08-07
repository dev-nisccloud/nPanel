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

import { teamSchema } from "./schema";
import { createTeamColumns } from "./columns";
import { AddTeamSheet } from "./add-team-sheet";
import { UpdateTeamSheet } from "./update-team-sheet";

interface TeamsDataTableProps {
  data: z.infer<typeof teamSchema>[];
}

export function TeamsDataTable({ data: initialData }: TeamsDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddTeamOpen, setIsAddTeamOpen] = React.useState(false);
  const [isUpdateTeamOpen, setIsUpdateTeamOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<z.infer<typeof teamSchema> | null>(null);

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  const handleEditTeam = (team: z.infer<typeof teamSchema>) => {
    setSelectedTeam(team);
    setIsUpdateTeamOpen(true);
  };

  const handleDeleteTeam = (teamId: number) => {
    setData(prev => prev.filter(team => team.id !== teamId));
  };

  const columns = createTeamColumns({
    onEditOrganization: handleEditTeam,
    onDeleteOrganization: handleDeleteTeam,
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

  const handleAddTeam = (team: Omit<z.infer<typeof teamSchema>, "id" | "createdAt">) => {
    const newTeam = {
      ...team,
      id: Math.max(...data.map(t => t.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    setData(prev => [newTeam, ...prev]);
  };

  const handleUpdateTeam = (teamId: number, updatedOrganization: Partial<z.infer<typeof teamSchema>>) => {
    setData(prev => prev.map(team => 
      team.id === teamId ? { ...team, ...updatedTeam } : team
    ));
  };

  const getStatusCounts = () => {
    const counts = data.reduce((acc, team) => {
      acc[team.status] = (acc[team.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: data.length,
      active: counts.active || 0,
      inactive: counts.inactive || 0,
      suspended: counts.suspended || 0,
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
              placeholder="Search organizations..."
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
          <Button onClick={() => setIsAddTeamOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              Inactive ({statusCounts.inactive})
            </TabsTrigger>
            <TabsTrigger value="suspended" className="flex items-center gap-2">
              Suspended ({statusCounts.suspended})
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

      {/* Add Organization Sheet */}
      <AddTeamSheet
        open={isAddTeamOpen}
        onOpenChange={setIsAddTeamOpen}
        onAddTeam={handleAddTeam}
      />

      {/* Update Organization Sheet */}
      <UpdateTeamSheet
        open={isUpdateTeamOpen}
        onOpenChange={setIsUpdateTeamOpen}
        team={selectedTeam}
        onUpdateTeam={handleUpdateTeam}
      />
    </div>
  );
}
