import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Mail, Forward, Shield, Reply } from "lucide-react";
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

import { emailAccountSchema } from "./emails-schema";

export const createMailColumns = (domainName?: string): ColumnDef<z.infer<typeof emailAccountSchema>>[] => [
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email Address" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {row.original.name || "Unknown Email"}@{domainName || "example.com"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "mailbox.enabled",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mailbox" />,
    cell: ({ row }) => {
      const enabled = row.original.mailbox?.enabled ?? false;
      return (
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "mailbox.usage",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usage" />,
    cell: ({ row }) => {
      const usage = row.original.mailbox?.usage ?? 0;
      const quota = row.original.mailbox?.quota ?? -1;
      
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      const usageText = formatBytes(usage);
      const quotaText = quota === -1 ? "Unlimited" : formatBytes(quota);
      
      return (
        <div className="text-sm">
          <div className="font-medium">{usageText}</div>
          <div className="text-muted-foreground">of {quotaText}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "forwarding.enabled",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Forwarding" />,
    cell: ({ row }) => {
      const enabled = row.original.forwarding?.enabled ?? false;
      const addresses = row.original.forwarding?.addresses ?? [];
      
      if (!enabled) {
        return <Badge variant="secondary">Disabled</Badge>;
      }
      
      const addressCount = addresses.length;
      
      return (
        <div className="flex items-center gap-2">
          <Forward className="h-4 w-4 text-green-600" />
          <Badge variant="default">
            {addressCount} address{addressCount !== 1 ? 'es' : ''}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "autoresponder.enabled",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Auto Reply" />,
    cell: ({ row }) => {
      const enabled = row.original.autoresponder?.enabled ?? false;
      
      return (
        <div className="flex items-center gap-2">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "antivir",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Antivirus" />,
    cell: ({ row }) => {
      const antivir = row.original.antivir ?? "off";
      
      const getAntivirColor = (status: string) => {
        switch (status) {
          case "off":
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
          case "in":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
          case "out":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
          case "inout":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
          default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={`px-2 py-1 ${getAntivirColor(antivir)}`}>
            {antivir.toUpperCase()}
          </Badge>
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
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Change Password</DropdownMenuItem>
          <DropdownMenuItem>Configure Forwarding</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
