"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { hostingSubscriptionSchema } from "./schema";
import { getStatusDisplayText, getStatusBadgeVariant, formatFileSize } from "./hosting-utils";

function EmailSubscriptionLink({ id, pleskId, children }: { id: string; pleskId?: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const teamSlug = pathname.split("/")[1] ?? "";
  const detailId = pleskId ?? id;
  return (
    <Link href={`/${teamSlug}/emails/${detailId}`} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}

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
    cell: ({ row }) => (
      <EmailSubscriptionLink id={String(row.original.id)} pleskId={(row.original as { pleskSubscriptionId?: string | null }).pleskSubscriptionId}>
        {row.original.subscriptionName}
      </EmailSubscriptionLink>
    ),
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
];
