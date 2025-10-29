"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Subdomain } from "./subdomains-schema";

export const subdomainColumns: ColumnDef<Subdomain>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subdomain Name" />
    ),
    cell: ({ row }) => {
      const subdomain = row.original;
      return (
        <div className="font-medium">
          {subdomain.name}
        </div>
      );
    },
  },
  {
    accessorKey: "parent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parent Domain" />
    ),
    cell: ({ row }) => {
      const subdomain = row.original;
      return (
        <div className="text-muted-foreground">
          {subdomain.parent}
        </div>
      );
    },
  },
  {
    accessorKey: "properties.php_handler_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PHP Version" />
    ),
    cell: ({ row }) => {
      const subdomain = row.original;
      const phpHandler = subdomain.properties?.php_handler_id ?? "";
      const version = phpHandler.includes("php82") ? "8.2" : 
                     phpHandler.includes("php81") ? "8.1" : 
                     phpHandler.includes("php80") ? "8.0" : 
                     phpHandler.includes("php74") ? "7.4" : "Unknown";
      
      return (
        <Badge variant="outline">
          PHP {version}
        </Badge>
      );
    },
  },
  {
    accessorKey: "properties.ssl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SSL Status" />
    ),
    cell: ({ row }) => {
      const subdomain = row.original;
      return (
        <Badge variant={subdomain.properties?.ssl ? "default" : "secondary"}>
          {subdomain.properties?.ssl ? "Enabled" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "properties.fastcgi",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="FastCGI" />
    ),
    cell: ({ row }) => {
      const subdomain = row.original;
      return (
        <Badge variant={subdomain.properties?.fastcgi ? "default" : "secondary"}>
          {subdomain.properties?.fastcgi ? "Enabled" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const subdomain = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => console.log("View subdomain:", subdomain.name)}
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => console.log("Delete subdomain:", subdomain.name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
