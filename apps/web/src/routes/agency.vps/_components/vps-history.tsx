"use client";

import * as React from "react";
import { History, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { useHivelocityTeamTrpcInput } from "./team-hivelocity-access-context";
import { format } from "date-fns";

interface VpsHistoryProps {
  deviceId: number;
}

export function VpsHistory({ deviceId }: VpsHistoryProps) {
  const teamTrpc = useHivelocityTeamTrpcInput();
  const eventsQuery = trpc.hivelocity.getVpsEvents.useQuery({ deviceId, ...teamTrpc });
  const [search, setSearch] = React.useState("");

  const isLoading = eventsQuery.isLoading;
  const events = (eventsQuery.data?.data as any[]) || [];

  const filteredEvents = events
    .filter(e => 
      (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.type || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-primary" />
              Event Log
            </CardTitle>
            <CardDescription>Chronological history of all VPS operations</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter events..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No matching events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {event.createdAt ? format(new Date(event.createdAt), "MMM dd, HH:mm:ss") : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold">{event.type || "System Event"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={event.state === 'Completed' || event.state === 'Started' ? "default" : "secondary"}
                      className={`text-[10px] uppercase h-5 ${(event.state === 'Completed' || event.state === 'Started') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' : ''}`}
                    >
                      {event.state || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">
                    <Badge variant="outline" className={`text-[10px] ${event.level === 'ERROR' ? 'text-destructive border-destructive' : 'text-muted-foreground'}`}>
                      {event.level || "INFO"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
