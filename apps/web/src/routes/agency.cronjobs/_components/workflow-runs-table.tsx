"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { workflowLabelForJobKey } from "./workflow-registry";

export type WorkflowRunRow = {
  id: string;
  jobKey: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function workflowRunStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "running":
      return "secondary";
    case "paused":
      return "outline";
    case "failed":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function WorkflowRunsTable({
  data,
  searchQuery,
  onRowClick,
}: {
  data: WorkflowRunRow[];
  searchQuery?: string;
  onRowClick?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Run name</TableHead>
            <TableHead>Job</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 px-4 text-muted-foreground"
              >
                {searchQuery?.trim()
                  ? `No runs match "${searchQuery}"`
                  : "No workflow runs yet. Start one with New workflow run."}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(row.id)}
              >
                <TableCell className="pl-4 font-medium max-w-[280px] truncate">
                  {row.name}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {workflowLabelForJobKey(row.jobKey)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {format(new Date(row.createdAt), "dd-MM-yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {format(new Date(row.updatedAt), "dd-MM-yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant={workflowRunStatusBadgeVariant(row.status)}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
