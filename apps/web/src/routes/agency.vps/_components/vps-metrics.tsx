"use client";

import * as React from "react";
import { Activity, RefreshCw, Cpu, MemoryStick, HardDrive, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

interface VpsMetricsProps {
  deviceId: number;
}

export function VpsMetrics({ deviceId }: VpsMetricsProps) {
  const utils = trpc.useUtils();
  const metricTypes = [
    { key: "CPU_USAGE", label: "CPU Usage", icon: Cpu, color: "text-blue-500" },
    { key: "MEMORY_USAGE", label: "Memory Usage", icon: MemoryStick, color: "text-purple-500" },
    { key: "DISK_RW", label: "Disk Read/Write", icon: HardDrive, color: "text-orange-500" },
    { key: "NETWORK_USAGE", label: "Network Traffic", icon: Network, color: "text-green-500" },
  ] as const;

  const handleRefresh = async () => {
    const promise = utils.hivelocity.getVpsMetrics.invalidate({ deviceId });
    toast.promise(promise, {
      loading: "Refreshing performance charts...",
      success: "Charts updated successfully",
      error: "Failed to refresh charts",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">Performance Charts</h3>
          <p className="text-sm text-muted-foreground">Historical data for the last 24 hours</p>
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Charts
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricTypes.map((metric) => (
           <MetricChartCard 
             key={metric.key} 
             deviceId={deviceId} 
             metricType={metric.key} 
             label={metric.label} 
             Icon={metric.icon} 
             iconColor={metric.color}
           />
        ))}
      </div>
    </div>
  );
}

function MetricChartCard({ deviceId, metricType, label, Icon, iconColor }: { 
  deviceId: number; 
  metricType: "CPU_USAGE" | "MEMORY_USAGE" | "DISK_RW" | "NETWORK_USAGE";
  label: string;
  Icon: any;
  iconColor: string;
}) {
  const { data, isLoading, isError, refetch } = trpc.hivelocity.getVpsMetrics.useQuery({ 
    deviceId, 
    metricType 
  });

  const chartData = data?.data as any;
  const base64Chart = chartData?.imageData;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="aspect-square w-full rounded-md" />
        ) : isError ? (
          <div className="aspect-square flex flex-col items-center justify-center text-center p-4 border rounded-md bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Failed to load {label.toLowerCase()}</p>
            <Button variant="link" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !base64Chart ? (
          <div className="aspect-square flex items-center justify-center text-center p-4 border rounded-md bg-muted/10">
            <p className="text-xs text-muted-foreground italic">No performance data available for this period</p>
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-white dark:bg-zinc-950">
            <img 
              src={`data:image/png;base64,${base64Chart}`} 
              alt={`${label} Performance Chart`}
              className="h-full w-full object-fill"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
