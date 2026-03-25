import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, ExternalLink } from "lucide-react";
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

import { wordpressPluginSchema } from "./plugin-schema";

export const pluginColumns: ColumnDef<z.infer<typeof wordpressPluginSchema>>[] = [
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
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plugin" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="font-medium">{row.original.title}</div>
        <div className="text-sm text-muted-foreground">{row.original.slug}</div>
      </div>
    ),
  },
  {
    accessorKey: "version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Badge variant="outline" className="text-muted-foreground px-1.5 w-fit">
          {row.original.version}
        </Badge>
        {row.original.availableVersion && (
          <Badge variant="secondary" className="text-xs px-1 mt-1 w-fit">
            {row.original.availableVersion} available
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status ? "default" : "secondary"}>
        {row.original.status ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "vulnerable",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Security" />,
    cell: ({ row }) => (
      <Badge variant={row.original.vulnerable ? "destructive" : "default"}>
        {row.original.vulnerable ? "Vulnerable" : "Secure"}
      </Badge>
    ),
  },
  {
    accessorKey: "autoUpdates",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Auto Updates" />,
    cell: ({ row }) => (
      <Badge variant={row.original.autoUpdates ? "default" : "secondary"}>
        {row.original.autoUpdates ? "Enabled" : "Disabled"}
      </Badge>
    ),
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
          {row.original.changeLogUrl && (
            <DropdownMenuItem onClick={() => window.open(row.original.changeLogUrl!, '_blank', 'noopener,noreferrer')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Changelog
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            {row.original.status ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          {row.original.availableVersion && (
            <DropdownMenuItem>Update Plugin</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
