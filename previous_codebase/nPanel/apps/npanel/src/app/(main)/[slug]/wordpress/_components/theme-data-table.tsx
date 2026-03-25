"use client";

import * as React from "react";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../components/data-table/table-utils";

import { themeColumns } from "./theme-columns";
import { wordpressThemeSchema } from "./theme-schema";

export function ThemeDataTable({ data: initialData }: { data: z.infer<typeof wordpressThemeSchema>[] }) {
  const [data, setData] = React.useState(initialData);
  
  const columns = withDndColumn(themeColumns);
  const table = useDataTableInstance({ data, columns, getRowId: (row) => row.slug });

  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all">
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="vulnerable">Vulnerable</SelectItem>
            <SelectItem value="updates">Updates Available</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Themes</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="vulnerable">Vulnerable</TabsTrigger>
          <TabsTrigger value="updates">Updates Available</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          {table.getSelectedRowModel().rows.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2"
            >
              Remove ({table.getSelectedRowModel().rows.length})
            </Button>
          )}
        </div>
      </div>
      
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      
      <TabsContent value="active" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      
      <TabsContent value="inactive" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      
      <TabsContent value="vulnerable" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      
      <TabsContent value="updates" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
    </Tabs>
  );
}
