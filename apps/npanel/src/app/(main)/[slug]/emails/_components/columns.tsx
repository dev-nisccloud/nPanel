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

import { hostingSubscriptionSchema } from "./schema";
import { getStatusDisplayText, getStatusBadgeVariant, formatFileSize } from "./hosting-utils";

export const hostingColumns: ColumnDef<z.infer<typeof hostingSubscriptionSchema>>[] = [
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
    accessorKey: "subscriptionName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subscription name" />,
    cell: ({ row, table }) => {
      // Extract team slug from pathname - columns are used in customer context
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const teamSlug = pathname.split("/")[1] || '';
      return (
        <Link 
          href={`/${teamSlug}/emails/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.subscriptionName}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.original.status)}>
        {getStatusDisplayText(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "setupDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Setup date" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {new Date(row.original.setupDate).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "sslEnabled",
    header: ({ column }) => <DataTableColumnHeader column={column} title="SSL Security" />,
    cell: ({ row }) => (
      <Badge variant={row.original.sslEnabled ? "default" : "destructive"}>
        {row.original.sslEnabled ? "Enabled" : "Disabled"}
      </Badge>
    ),
  },
  {
    accessorKey: "trafficPrevDay",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Previous Day Traffic" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatFileSize(row.original.trafficPrevDay)}
      </div>
    ),
  },
  {
    accessorKey: "realSize",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Disk usage" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatFileSize(row.original.realSize)}
      </div>
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
          <DropdownMenuItem asChild>
            {(() => {
              const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
              const teamSlug = pathname.split("/")[1] || '';
              return <Link href={`/${teamSlug}/emails/${row.original.id}`}>View details</Link>;
            })()}
          </DropdownMenuItem>
          <DropdownMenuItem>Edit subscription</DropdownMenuItem>
          <DropdownMenuItem>Renew</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Suspend</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
