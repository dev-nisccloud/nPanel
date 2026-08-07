import type { ColumnDef } from '@tanstack/react-table';
import { MoreVertical, Edit, Eye, Trash } from "lucide-react";
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

import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";

import { teamSchema } from "./schema";

interface TeamColumnsProps {
  onEditTeam?: (team: z.infer<typeof teamSchema>) => void;
  onDeleteTeam?: (teamId: number) => void;
}

export const createTeamColumns = ({ onEditTeam, onDeleteTeam }: TeamColumnsProps = {}): ColumnDef<z.infer<typeof teamSchema>>[] => [
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
    accessorKey: "teamName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Organization Name" />,
    cell: ({ row }) => {
      const teamName = row.getValue("teamName") as string;
      return (
        <div className="font-medium">{teamName}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdBy",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
    cell: ({ row }) => {
      const createdBy = row.getValue("createdBy") as string;
      return (
        <div className="text-sm">{createdBy}</div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge 
          variant={
            status === "active" ? "default" : 
            status === "inactive" ? "secondary" : 
            "destructive"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created On" />,
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
      const team = row.original;

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
              <DropdownMenuItem onClick={() => onEditTeam?.(team)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Organization
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteTeam?.(team.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Organization
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
export const teamColumns = createTeamColumns();
