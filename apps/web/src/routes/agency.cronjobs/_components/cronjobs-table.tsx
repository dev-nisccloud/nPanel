"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CronJobRow } from "./schema";

function statusBadgeClass(status: CronJobRow["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
    case "DISABLED":
    default:
      return "";
  }
}

export function CronJobsTable({
  data,
  searchQuery,
  onView,
}: {
  data: CronJobRow[];
  searchQuery?: string;
  onView?: (key: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="pr-4 w-[90px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 px-4 text-muted-foreground"
              >
                {searchQuery?.trim()
                  ? `No cron jobs match "${searchQuery}"`
                  : "No cron jobs found"}
              </TableCell>
            </TableRow>
          ) : (
            data.map((job) => (
              <TableRow
                key={job.key}
                className={onView ? "cursor-pointer" : undefined}
                onClick={() => onView?.(job.key)}
              >
                <TableCell className="pl-4 font-medium">{job.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusBadgeClass(job.status)}
                  >
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[520px] truncate text-muted-foreground">
                  {job.description ?? "-"}
                </TableCell>
                <TableCell
                  className="pr-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => onView?.(job.key)}
                    disabled={!onView}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

