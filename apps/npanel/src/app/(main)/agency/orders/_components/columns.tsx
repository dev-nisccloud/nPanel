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

import { orderSchema } from "./schema";

interface OrderColumnsProps {
  onEditOrder?: (order: z.infer<typeof orderSchema>) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const createOrderColumns = ({ onEditOrder, onDeleteOrder }: OrderColumnsProps = {}): ColumnDef<z.infer<typeof orderSchema>>[] => [
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
    accessorKey: "orderNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order #" />,
    cell: ({ row }) => {
      const orderNumber = row.getValue("orderNumber") as string;
      return (
        <div className="font-medium">{orderNumber}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    cell: ({ row }) => {
      const companyName = row.getValue("companyName") as string;
      return (
        <div className="font-medium">{companyName}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
    cell: ({ row }) => {
      const paymentStatus = row.getValue("paymentStatus") as string;
      const getPaymentVariant = (status: string) => {
        switch (status) {
          case "paid":
            return "default";
          case "pending":
            return "secondary";
          case "failed":
            return "destructive";
          case "refunded":
            return "outline";
          default:
            return "outline";
        }
      };
      
      return (
        <Badge variant={getPaymentVariant(paymentStatus)}>
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number;
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
          case "active":
            return "default";
          case "processing":
            return "secondary";
          case "pending":
            return "outline";
          case "suspended":
            return "secondary";
          case "cancelled":
            return "destructive";
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
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const order = row.original;

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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditOrder?.(order)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteOrder?.(order.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Order
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
export const orderColumns = createOrderColumns();
