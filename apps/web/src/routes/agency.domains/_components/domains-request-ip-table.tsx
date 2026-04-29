"use client";

import React from "react";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/auth-client";

export function DomainsRequestIpTable() {
  const [isFetchingIp, setIsFetchingIp] = React.useState(false);
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.ipRecords.list.useQuery();

  const handleGetMyIp = async () => {
    setIsFetchingIp(true);
    try {
      const response = await fetch(apiUrl("/api/my-ip"));
      if (!response.ok) {
        throw new Error("Failed to fetch IP");
      }
      await utils.ipRecords.list.invalidate();
      toast.success("Successfully fetched and saved IP");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch IP");
    } finally {
      setIsFetchingIp(false);
    }
  };

  const handleCopy = async (ip: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(ip);
      } else {
        // Fallback for non-secure contexts (http://localhost) or incognito mode
        const textArea = document.createElement("textarea");
        textArea.value = ip;
        // Make it invisible
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
        } finally {
          textArea.remove();
        }
      }
      toast.success("IP address copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy IP address");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading IP records: {error.message}</div>;
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No IP records found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Recorded IPs</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            onClick={handleGetMyIp} 
            disabled={isFetchingIp}
          >
            {isFetchingIp ? "Fetching..." : "Get My IP"}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => utils.ipRecords.list.invalidate()}
            title="Refresh records"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {new Date(record.timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{record.ipAddress}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Copy IP Address"
                    onClick={() => handleCopy(record.ipAddress)}
                  >
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
