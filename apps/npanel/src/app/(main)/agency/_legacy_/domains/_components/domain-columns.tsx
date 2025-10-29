import { ColumnDef } from "@tanstack/react-table";
import { 
  Globe, 
  Shield, 
  Lock, 
  Star, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  EllipsisVertical,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { DataTableColumnHeader } from "../../../../../../components/data-table/data-table-column-header";
import type { DomainTableRow } from "@/types/domain";
import { DomainCellViewer } from "./domain-cell-viewer";

export const domainColumns: ColumnDef<DomainTableRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all domains"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.extension}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "extension",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Extension" />,
    cell: ({ row }) => {
      return <DomainCellViewer domain={row.original} />;
    },
    enableSorting: true,
  },
  {
    accessorKey: "registrationPrice",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registration Price" />,
    cell: ({ row }) => {
      const domain = row.original;
      if (!domain.registrationPrice) {
        return <span className="text-muted-foreground">N/A</span>;
      }

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {domain.registrationPrice?.reseller?.formatted || 'N/A'}
            </span>
            <Badge variant="outline" className="text-xs">
              Reseller
            </Badge>
          </div>
          {domain.registrationPrice?.product?.price !== domain.registrationPrice?.reseller?.price && (
            <div className="text-xs text-muted-foreground">
              Retail: {domain.registrationPrice?.product?.formatted || 'N/A'}
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const priceA = rowA.original.registrationPrice?.reseller.price || 0;
      const priceB = rowB.original.registrationPrice?.reseller.price || 0;
      return priceA - priceB;
    },
  },
  {
    accessorKey: "isPremium",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      if (domain.isPremium) {
        return (
          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
            <Star className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        );
      }
      
      return (
        <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Standard
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.original.isPremium ? 'premium' : 'standard');
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      const statusConfig = {
        active: { 
          icon: CheckCircle, 
          variant: "default" as const, 
          label: "Active",
          className: "bg-green-500 hover:bg-green-600"
        },
        premium: { 
          icon: Star, 
          variant: "default" as const, 
          label: "Premium",
          className: "bg-yellow-500 hover:bg-yellow-600"
        },
        restricted: { 
          icon: AlertCircle, 
          variant: "destructive" as const, 
          label: "Restricted",
          className: "bg-red-500 hover:bg-red-600"
        },
        inactive: { 
          icon: XCircle, 
          variant: "secondary" as const, 
          label: "Inactive",
          className: "bg-gray-500 hover:bg-gray-600"
        },
      };
      
      const config = statusConfig[domain.status];
      const Icon = config.icon;
      
      return (
        <Badge variant={config.variant} className={config.className}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.original.status);
    },
  },
  {
    accessorKey: "features",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Features" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {domain.supportsDnssec && (
              <Tooltip>
                <TooltipTrigger>
                  <Shield className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Supports DNSSEC</p>
                </TooltipContent>
              </Tooltip>
            )}
            {domain.supportsIdn && (
              <Tooltip>
                <TooltipTrigger>
                  <Globe className="h-4 w-4 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Supports International Domain Names</p>
                </TooltipContent>
              </Tooltip>
            )}
            {domain.requiresAuthCode && (
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-4 w-4 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Requires Auth Code for Transfer</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "periods",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registration Periods" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      return (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="font-medium">{domain.minPeriod}</span>
            <span className="text-muted-foreground"> - </span>
            <span className="font-medium">{domain.maxPeriod}</span>
            <span className="text-muted-foreground text-xs ml-1">years</span>
          </div>
          <div className="flex gap-1">
            {domain.canTransfer && (
              <Badge variant="outline" className="text-xs">
                Transfer
              </Badge>
            )}
            {domain.canRenew && (
              <Badge variant="outline" className="text-xs">
                Renew
              </Badge>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return rowA.original.minPeriod - rowB.original.minPeriod;
    },
  },
  {
    accessorKey: "popularity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Popularity" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      const popularityConfig = {
        high: { 
          icon: TrendingUp, 
          variant: "default" as const, 
          label: "High",
          className: "bg-green-500 hover:bg-green-600"
        },
        medium: { 
          icon: TrendingUp, 
          variant: "secondary" as const, 
          label: "Medium",
          className: "bg-yellow-500 hover:bg-yellow-600"
        },
        low: { 
          icon: TrendingUp, 
          variant: "outline" as const, 
          label: "Low",
          className: "bg-gray-500 hover:bg-gray-600"
        },
      };
      
      const config = popularityConfig[domain.popularity];
      const Icon = config.icon;
      
      return (
        <Badge variant={config.variant} className={config.className}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.original.popularity);
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      const domain = row.original;
      
      if (!domain.description) {
        return <span className="text-muted-foreground">No description</span>;
      }
      
      return (
        <div className="max-w-[200px]">
          <p className="text-sm truncate" title={domain.description}>
            {domain.description}
          </p>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const domain = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
              <EllipsisVertical />
              <span className="sr-only">Open menu for {domain.extension}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Globe className="h-4 w-4 mr-2" />
              Check Availability
            </DropdownMenuItem>
            <DropdownMenuItem>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Pricing History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertCircle className="h-4 w-4 mr-2" />
              Set Alert
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive"
              onClick={() => {
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 1000)),
                  {
                    loading: `Removing ${domain.extension} from list`,
                    success: "Domain removed",
                    error: "Failed to remove domain",
                  }
                );
              }}
            >
              Remove from List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
