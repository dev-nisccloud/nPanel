import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Edit, Eye, Phone } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { clientSchema } from "./schema";

interface ClientColumnsProps {
  onEditClient?: (client: z.infer<typeof clientSchema>) => void;
}

export const createClientColumns = ({ onEditClient }: ClientColumnsProps = {}): ColumnDef<z.infer<typeof clientSchema>>[] => [
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
    accessorKey: "firstName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex flex-col space-y-1">
          <div className="font-medium">{client.firstName} {client.lastName}</div>
          {client.companyName && (
            <div className="text-sm text-muted-foreground">{client.companyName}</div>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{email}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.getValue("phoneNumber") as string;
      return phone ? (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{phone}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex flex-col space-y-1">
          <div className="text-sm">{client.city || "-"}</div>
          {client.stateRegion && (
            <div className="text-xs text-muted-foreground">{client.stateRegion}</div>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    cell: ({ row }) => {
      const country = row.getValue("country") as string;
      return <span className="text-sm">{country || "-"}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "howDidYouFindUs",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const source = row.getValue("howDidYouFindUs") as string;
      return <span className="text-sm">{source || "-"}</span>;
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
      const client = row.original;

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
              <DropdownMenuItem onClick={() => onEditClient?.(client)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
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
export const clientColumns = createClientColumns();