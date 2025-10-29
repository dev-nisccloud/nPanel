import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Edit, Eye, Download, Mail, Trash } from "lucide-react";
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

import { invoiceSchema } from "./schema";

interface InvoiceColumnsProps {
  onEditInvoice?: (invoice: z.infer<typeof invoiceSchema>) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
}

export const createInvoiceColumns = ({ onEditInvoice, onDeleteInvoice }: InvoiceColumnsProps = {}): ColumnDef<z.infer<typeof invoiceSchema>>[] => [
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
    accessorKey: "invoiceNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
    cell: ({ row }) => {
      const invoiceNumber = row.getValue("invoiceNumber") as string;
      return (
        <div className="font-medium">{invoiceNumber}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div className="flex flex-col space-y-1">
          <div className="font-medium">{invoice.clientName}</div>
          <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return (
        <div className="font-medium">
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const getStatusVariant = (status: string) => {
        switch (status) {
          case "paid":
            return "default";
          case "sent":
            return "secondary";
          case "overdue":
            return "destructive";
          case "draft":
            return "outline";
          case "cancelled":
            return "outline";
          default:
            return "outline";
        }
      };
      
      return (
        <Badge variant={getStatusVariant(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(dueDate).toLocaleDateString()}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const invoice = row.original;

      return (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditInvoice?.(invoice)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteInvoice?.(invoice.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

// Default columns export for backward compatibility
export const invoiceColumns = createInvoiceColumns();
