import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
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

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { dnsRecordSchema } from "./dns-schema";

export const dnsColumns: ColumnDef<z.infer<typeof dnsRecordSchema>>[] = [
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
    accessorKey: "host",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Host" />,
    cell: ({ row }) => (
      <div className="font-bold text-primary text-sm">
        {row.original.host === "@" ? "@" : row.original.host || "Unknown Host"}
      </div>
    ),
  },
  {
    accessorKey: "ttl",
    header: ({ column }) => <DataTableColumnHeader column={column} title="TTL" />,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.ttl || 3600}s
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Record Type" />,
    cell: ({ row }) => {
      const type = row.original.type || "A";
      const getTypeColor = (type: string) => {
        switch (type) {
          case "A":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
          case "AAAA":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
          case "CNAME":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
          case "MX":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
          case "TXT":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
          case "NS":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
          case "SRV":
            return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
          case "PTR":
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
          default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        }
      };

      return (
        <Badge variant="outline" className={`px-2 py-1 ${getTypeColor(type)}`}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
    cell: ({ row }) => {
      const record = row.original;
      let displayValue = record.value || "Unknown Value";

      // Add priority for MX records
      if (record.type === "MX" && record.opt) {
        const priority = typeof record.opt === 'number' ? record.opt : record.opt;
        displayValue = `${priority} ${record.value}`;
      }

      // Add priority, weight, port for SRV records
      if (record.type === "SRV" && record.opt) {
        const optValue = typeof record.opt === 'string' ? record.opt : String(record.opt);
        const parts = optValue.split(" ");
        const priority = parts[0] || 0;
        const weight = parts[1] || 0;
        const port = parts[2] || 0;
        displayValue = `${priority} ${weight} ${port} ${record.value}`;
      }

      return (
        <div className="text-primary text-sm max-w-[200px] truncate" title={displayValue}>
          {displayValue}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
            <EllipsisVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
