"use client";

import * as React from "react";
import { HardDrive, Plus, Clock, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VpsStorageProps {
  deviceId: number;
}

export function VpsStorage({ deviceId }: VpsStorageProps) {
  const volumesQuery = trpc.hivelocity.getVpsVolumes.useQuery({ deviceId });

  const isLoading = volumesQuery.isLoading;
  const volumes = (volumesQuery.data?.data as any[]) || [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5 text-primary" />
              Attached Volumes
            </CardTitle>
            <CardDescription>Manage block storage attached to this instance</CardDescription>
          </div>
          <Button size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Attach Volume
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volume ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : volumes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No volumes attached to this instance
                  </TableCell>
                </TableRow>
              ) : (
                volumes.map((vol: any) => (
                  <TableRow key={vol.volumeId}>
                    <TableCell className="font-mono text-xs">{vol.volumeId}</TableCell>
                    <TableCell className="font-semibold">{formatBytes(vol.size)}</TableCell>
                    <TableCell className="capitalize">{vol.type || "SSD"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{vol.createdAt || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Resize Volume</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Detach Volume</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Snapshot Schedules
            </CardTitle>
            <CardDescription>Automated backups for your volumes</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Add Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No snapshot schedules configured</p>
            <Button variant="link" size="sm" className="mt-2">
              Learn more about snapshots
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
