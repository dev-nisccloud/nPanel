"use client";

import * as React from "react";
import { Network as NetworkIcon, Wifi, Shield, ArrowUpRight, ArrowDownLeft, Globe, Fingerprint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";

interface VpsNetworkProps {
  deviceData: any;
  vpsData: any;
}

export function VpsNetwork({ deviceData, vpsData }: VpsNetworkProps) {
  const portsQuery = trpc.hivelocity.getDevicePorts.useQuery({ deviceId: deviceData.deviceId });
  const ports = (portsQuery.data?.data as any[]) || [];

  // Use NICs from VPS details if available, otherwise fallback to deviceData IPs
  const nics = vpsData?.nics || [];
  const fallbackIps = deviceData.ip_addresses || [deviceData.primaryIp].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <NetworkIcon className="h-5 w-5 text-primary" />
            Network Interfaces
          </CardTitle>
          <CardDescription>Logical interfaces and assigned IP addresses (IPv4 & IPv6)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interface</TableHead>
                <TableHead>IPv4 Address</TableHead>
                <TableHead>IPv6 Address</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead className="text-right">Gateway</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ports.length > 0 ? (
                ports.map((port: any, idx: number) => (
                  <TableRow key={port.portId || idx}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">{port.name || `eth${idx}`}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{port.status || "UNKNOWN"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {port.ips?.filter((ip: any) => ip.version === 4).map((ip: any, i: number) => (
                          <span key={i} className="font-mono text-xs font-semibold">{ip.subnet}</span>
                        )) || <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1">
                        {port.ips?.filter((ip: any) => ip.version === 6).map((ip: any, i: number) => (
                          <span key={i} className="font-mono text-[10px] text-muted-foreground break-all max-w-[150px]">{ip.subnet}</span>
                        )) || <span className="text-muted-foreground text-xs">—</span>}
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className="font-mono text-[10px] uppercase">{port.macAddress || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="font-mono text-xs text-muted-foreground">
                        {port.ips?.[0]?.gatewayIp || "—"}
                       </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : nics.length > 0 ? (
                nics.map((nic: any, idx: number) => (
                  <TableRow key={nic.nicId || idx}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">{nic.nicName || `eth${idx}`}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{nic.networkName || "Public"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-semibold">{nic.ipAddress || "—"}</span>
                        {nic.netmask && <span className="text-[10px] text-muted-foreground">Mask: {nic.netmask}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="font-mono text-[10px] text-muted-foreground break-all max-w-[150px] inline-block">
                          {nic.ipv6Address || "—"}
                       </span>
                    </TableCell>
                    <TableCell>
                       <span className="font-mono text-[10px] uppercase">{nic.macAddress || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="font-mono text-xs text-muted-foreground">{nic.gateway || "—"}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                fallbackIps.map((ip: string, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold text-sm">eth{idx}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{ip}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono text-xs">—</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Traffic Statistics
            </CardTitle>
            <CardDescription>Current bandwidth utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
             <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                      <ArrowUpRight className="h-4 w-4" />
                   </div>
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Egress (Out)</p>
                      <p className="text-xl font-bold">0.00 <span className="text-xs font-medium text-muted-foreground">Mbps</span></p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-muted-foreground mb-1">Peak (24h)</p>
                   <p className="text-sm font-semibold">12.4 Mbps</p>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <ArrowDownLeft className="h-4 w-4" />
                   </div>
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Ingress (In)</p>
                      <p className="text-xl font-bold">0.00 <span className="text-xs font-medium text-muted-foreground">Mbps</span></p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-muted-foreground mb-1">Peak (24h)</p>
                   <p className="text-sm font-semibold">8.2 Mbps</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-5 w-5 text-primary" />
              Infrastructure
            </CardTitle>
            <CardDescription>Underlying network configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Public Network
                   </span>
                   <span className="font-mono font-medium text-xs">{nics[0]?.networkId?.substring(0, 8) || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground flex items-center gap-1.5">
                      <Fingerprint className="h-3.5 w-3.5" />
                      MAC Address
                   </span>
                   <span className="font-mono font-medium text-xs uppercase">{nics[0]?.macAddress || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">IPv6 Subnet</span>
                   <span className="font-mono text-[10px]">{nics[0]?.ipv6Cidr || "None"}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                   <span className="text-muted-foreground">Automation Status</span>
                   <Badge variant={deviceData?.networkAutomation?.enabled ? "default" : "secondary"} className="h-5 text-[10px]">
                      {deviceData?.networkAutomation?.enabled ? "Enabled" : "Disabled"}
                   </Badge>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
