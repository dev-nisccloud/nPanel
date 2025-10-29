import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, XCircle, EllipsisVertical } from "lucide-react";
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

import { tldSchema } from "./schema";
import { TldCellViewer } from "./tld-cell-viewer";

export const tldColumns: ColumnDef<z.infer<typeof tldSchema>>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="TLD" />,
    cell: ({ row }) => {
      return <TldCellViewer tld={row.original} />;
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'ACT' ? 'default' : 'secondary'} className="capitalize">
        {row.original.status === 'ACT' ? (
          <CheckCircle className="stroke-border fill-green-500 dark:fill-green-400 mr-1 h-3 w-3" />
        ) : (
          <XCircle className="stroke-border fill-gray-500 dark:fill-gray-400 mr-1 h-3 w-3" />
        )}
        {row.original.status}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "min_period",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Min Period" />,
    cell: ({ row }) => (
      <div className="text-center">
        <span className="font-medium">{row.original.min_period}</span>
        <span className="text-muted-foreground text-xs ml-1">years</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "max_period",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Max Period" />,
    cell: ({ row }) => (
      <div className="text-center">
        <span className="font-medium">{row.original.max_period}</span>
        <span className="text-muted-foreground text-xs ml-1">years</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "transfer_available",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Transfer" />,
    cell: ({ row }) => (
      <Badge variant={row.original.transfer_available ? 'default' : 'secondary'}>
        {row.original.transfer_available ? 'Available' : 'Not Available'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "renew_available",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Renewal" />,
    cell: ({ row }) => (
      <Badge variant={row.original.renew_available ? 'default' : 'secondary'}>
        {row.original.renew_available ? 'Available' : 'Not Available'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "dnssec_allowed",
    header: ({ column }) => <DataTableColumnHeader column={column} title="DNSSEC" />,
    cell: ({ row }) => (
      <Badge variant={row.original.dnssec_allowed ? 'default' : 'secondary'}>
        {row.original.dnssec_allowed ? 'Supported' : 'Not Supported'}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "prices.reseller_price.reseller.price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const price = row.original.prices?.reseller_price?.reseller?.price;
      const currency = row.original.prices?.reseller_price?.reseller?.currency;
      return (
        <div className="text-right font-medium">
          {price !== undefined && currency !== undefined 
            ? `${currency} ${price.toFixed(2)}`
            : 'N/A'
          }
        </div>
      );
    },
    enableSorting: true,
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
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Copy TLD</DropdownMenuItem>
          <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Hide TLD</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
