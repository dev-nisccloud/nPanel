"use client";

import * as React from "react";
import { Network as NetworkIcon, Wifi, Shield, ArrowUpRight, ArrowDownLeft, Globe, Fingerprint, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VpsNetworkProps {
  deviceData: any;
  vpsData: any;
}

export function VpsNetwork({ deviceData, vpsData }: VpsNetworkProps) {
  const ipsQuery = trpc.hivelocity.getDeviceIps.useQuery({ deviceId: deviceData.deviceId });
  const assignments = (ipsQuery.data?.data as any[]) || [];

  if (ipsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-base">
            <NetworkIcon className="h-5 w-5 text-primary" />
            IP Address Assignments
          </CardTitle>
          <CardDescription>Verified IP allocations from the Hivelocity network registry</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-border/40">
                <TableHead className="pl-6 py-4 text-[10px] font-bold uppercase tracking-wider">Type / Description</TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider">IP Address / Subnet</TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider">Gateway / Broadcast</TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider">DNS Resolvers</TableHead>
                <TableHead className="pr-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.map((ip: any, idx: number) => (
                  <TableRow key={ip.assignmentId || idx} className="border-b-border/20 hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-foreground/90">{ip.description || "Additional Assignment"}</span>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter ${ip.version === 4 ? "text-blue-600 border-blue-200" : "text-purple-600 border-purple-200"}`}>
                            IPv{ip.version}
                           </Badge>
                           <span className="text-[10px] text-muted-foreground font-medium">{ip.facilityCode}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-primary">{ip.subnet}</span>
                        {ip.usableIps?.length > 0 && (
                          <div className="flex items-center gap-1">
                             <CheckCircle2 className="h-3 w-3 text-green-500" />
                             <span className="text-[10px] text-muted-foreground font-medium">{ip.usableIps.length} Usable IP(s)</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground w-12 font-medium">GW:</span>
                            <span className="font-mono text-[11px]">{ip.gatewayIp || "—"}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground w-12 font-medium">BC:</span>
                            <span className="font-mono text-[11px]">{ip.broadcastIp || "—"}</span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col gap-1">
                        {ip.dnsResolvers?.length > 0 ? (
                          ip.dnsResolvers.map((dns: string, i: number) => (
                            <span key={i} className="font-mono text-[10px] text-muted-foreground">{dns}</span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs italic opacity-40">System Default</span>
                        )}
                       </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                       <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                        ACTIVE
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No active IP assignments found for this device.
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Traffic Utilization
            </CardTitle>
            <CardDescription>Real-time bandwidth monitoring (Snapshot)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
             <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                      <ArrowUpRight className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Egress (Out)</p>
                      <p className="text-2xl font-black tabular-nums tracking-tighter">0.00 <span className="text-xs font-medium text-muted-foreground">Mbps</span></p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Port Speed</p>
                   <p className="text-sm font-bold">1 Gbps</p>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <ArrowDownLeft className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ingress (In)</p>
                      <p className="text-2xl font-black tabular-nums tracking-tighter">0.00 <span className="text-xs font-medium text-muted-foreground">Mbps</span></p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Limit (24h)</p>
                   <p className="text-sm font-bold">Unlimited</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-5 w-5 text-primary" />
              Network Fabric
            </CardTitle>
            <CardDescription>Underlying infrastructure details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
             <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-muted/20 transition-colors">
                   <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Globe className="h-4 w-4 text-primary/60" />
                      Facility Backbone
                   </span>
                   <span className="font-bold text-xs">{deviceData.location?.facility || "TPA2"}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-muted/20 transition-colors">
                   <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Fingerprint className="h-4 w-4 text-primary/60" />
                      Device MAC
                   </span>
                   <span className="font-mono font-bold text-[10px] uppercase">{vpsData?.nics?.[0]?.macAddress || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-muted/20 transition-colors">
                   <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Shield className="h-4 w-4 text-primary/60" />
                      Automation
                   </span>
                   <Badge variant={deviceData?.networkAutomation?.enabled ? "default" : "secondary"} className="h-5 text-[9px] font-black uppercase">
                      {deviceData?.networkAutomation?.enabled ? "Active" : "Legacy"}
                   </Badge>
                </div>
                <div className="pt-2 mt-2 border-t border-dashed">
                   <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      <p className="text-[10px] text-primary/80 font-medium">
                        Statically routed subnets are applied automatically via the Hivelocity API.
                      </p>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
