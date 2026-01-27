"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { wordpressInstallationSchema } from "./schema";

// Columns need basePath from hook - use getWordpressColumns() in components that render the table
export function getWordpressColumns(basePath: string): ColumnDef<z.infer<typeof wordpressInstallationSchema>>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "displayTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Site" />,
    cell: ({ row }) => (
      <Link 
        href={`/agency/wordpress/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.displayTitle}
      </Link>
    ),
  },
  {
    accessorKey: "version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.version}
      </Badge>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "status.alive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isAlive = row.original.status?.alive;
      const isInfected = row.original.status?.infected;
      
      if (isInfected) {
        return <Badge variant="destructive">Infected</Badge>;
      }
      
      if (!isAlive) {
        return <Badge variant="secondary">Offline</Badge>;
      }
      
      return <Badge variant="default">Online</Badge>;
    },
  },
  {
    accessorKey: "features.security.status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Security" />,
    cell: ({ row }) => {
      const securityStatus = row.original.features?.security?.status;
      
      if (securityStatus === "secureRecommended") {
        return <Badge variant="default">Secure</Badge>;
      }
      
      return <Badge variant="secondary">Needs Attention</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
            <EllipsisVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Update WordPress</DropdownMenuItem>
          <DropdownMenuItem>Manage plugins</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Backup</DropdownMenuItem>
          <DropdownMenuItem>Clone</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
}

// Legacy export for backwards compatibility (uses /agency - only use in agency pages)
export const wordpressColumns: ColumnDef<z.infer<typeof wordpressInstallationSchema>>[] = getWordpressColumns("/agency");