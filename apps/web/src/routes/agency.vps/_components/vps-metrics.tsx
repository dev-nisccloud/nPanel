"use client";

import * as React from "react";
import { 
  Activity, 
  RefreshCw, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VpsMetricsProps {
  deviceId: number;
}

export function VpsMetrics({ deviceId }: VpsMetricsProps) {
  const [timeRange, setTimeRange] = React.useState("24h");
  const utils = trpc.useUtils();

  const metricTypes = [
    { key: "CPU_USAGE", label: "CPU Compute Load", icon: Cpu, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { key: "MEMORY_USAGE", label: "Memory Allocation", icon: MemoryStick, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { key: "DISK_RW", label: "Storage I/O Ops", icon: HardDrive, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { key: "NETWORK_USAGE", label: "Network Throughput", icon: Network, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  ] as const;

  const getTimestamps = (range: string) => {
    const end = Math.floor(Date.now() / 1000);
    let start = end - 24 * 3600;

    switch (range) {
      case "1h": start = end - 3600; break;
      case "6h": start = end - 6 * 3600; break;
      case "24h": start = end - 24 * 3600; break;
      case "7d": start = end - 7 * 24 * 3600; break;
      case "30d": start = end - 30 * 24 * 3600; break;
    }

    return { start, end };
  };

  const handleRefresh = async () => {
    const promise = utils.hivelocity.getVpsMetrics.invalidate({ deviceId });
    toast.promise(promise, {
      loading: "Synchronizing telemetry...",
      success: "Performance data synchronized",
      error: "Synchronization failed",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 p-6 rounded-2xl border border-border/40">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight">Cloud Telemetry</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black tracking-widest bg-emerald-500/5 text-emerald-600 border-emerald-500/20">LIVE FEED</Badge>
              <p className="text-[10px] font-bold text-muted-foreground tracking-tight">Real-time performance metrics from hypervisor</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 h-10">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="border-0 bg-transparent focus:ring-0 p-0 h-auto text-[10px] font-black uppercase tracking-widest w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h" className="text-[10px] font-bold uppercase py-2">Last Hour</SelectItem>
                <SelectItem value="6h" className="text-[10px] font-bold uppercase py-2">Last 6 Hours</SelectItem>
                <SelectItem value="24h" className="text-[10px] font-bold uppercase py-2">Last 24 Hours</SelectItem>
                <SelectItem value="7d" className="text-[10px] font-bold uppercase py-2">Last 7 Days</SelectItem>
                <SelectItem value="30d" className="text-[10px] font-bold uppercase py-2">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-4 gap-2 font-black text-[10px] uppercase tracking-widest" 
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {metricTypes.map((metric) => {
          const { start, end } = getTimestamps(timeRange);
          return (
            <MetricChartCard 
              key={metric.key} 
              deviceId={deviceId} 
              metricType={metric.key} 
              label={metric.label} 
              Icon={metric.icon} 
              iconColor={metric.color}
              iconBg={metric.bgColor}
              startTime={start}
              endTime={end}
            />
          );
        })}
      </div>

    </div>
  );
}

function MetricChartCard({ 
  deviceId, 
  metricType, 
  label, 
  Icon, 
  iconColor,
  iconBg,
  startTime,
  endTime 
}: { 
  deviceId: number; 
  metricType: "CPU_USAGE" | "MEMORY_USAGE" | "DISK_RW" | "NETWORK_USAGE";
  label: string;
  Icon: any;
  iconColor: string;
  iconBg: string;
  startTime: number;
  endTime: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { data, isLoading, isError, refetch } = trpc.hivelocity.getVpsMetrics.useQuery({ 
    deviceId, 
    metricType,
    startTime,
    endTime,
    imageWidth: dimensions.width > 0 ? dimensions.width : undefined,
    imageHeight: dimensions.height > 0 ? dimensions.height : undefined,
  }, {
    enabled: dimensions.width > 0, // Wait for measurement
    refetchOnWindowFocus: false,
    staleTime: 60000 // Cache for 1 minute
  });

  const chartData = data?.data as any;
  const base64Chart = chartData?.imageData;

  return (
    <Card className="bg-[#f5f5f5] dark:bg-zinc-950/80 border-border/40 shadow-sm overflow-hidden group hover:border-primary/20 transition-all duration-300">
      <CardHeader className="pb-4 border-none">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
            <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {label}
          </CardTitle>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-3 w-3" />
             </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="aspect-[16/9] w-full relative flex flex-col items-center justify-center"
        >
          {isLoading ? (
            <div className="w-full h-full p-4 space-y-4">
              <Skeleton className="h-full w-full rounded-md" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-tight text-destructive">Data Collection Error</p>
                <p className="text-[10px] text-muted-foreground font-medium max-w-[200px]">Unable to retrieve telemetry from hypervisor.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 font-black text-[9px] uppercase tracking-widest">
                Reconnect Feed
              </Button>
            </div>
          ) : !base64Chart ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-40">
              <Calendar className="h-10 w-10 text-muted-foreground mb-1" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-tight">No Temporal Data</p>
                <p className="text-[10px] font-medium">No performance samples found for this range.</p>
              </div>
            </div>
          ) : (
            <img 
              src={`data:image/png;base64,${base64Chart}`} 
              alt={`${label} Performance Chart`}
              className="h-full w-full object-contain pointer-events-none animate-in fade-in duration-1000"
            />
          )}
          
          {/* Overlay Grid lines for aesthetics if empty */}
          {!base64Chart && !isLoading && !isError && (
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-[0.03] pointer-events-none">
               {Array.from({ length: 24 }).map((_, i) => (
                 <div key={i} className="border-[0.5px] border-foreground" />
               ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
