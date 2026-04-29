"use client";

import * as React from "react";
import { 
  Globe, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Power, 
  RefreshCw,
  Terminal,
  Server,
  MapPin,
  Fingerprint,
  ExternalLink,
  Copy,
  Disc,
  Pencil,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VpsOverviewProps {
  deviceData: any;
  vpsData: any;
}

export function VpsOverview({ deviceData, vpsData }: VpsOverviewProps) {
  const utils = trpc.useUtils();
  
  // Editing State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(deviceData.name || "");
  const [editHostname, setEditHostname] = React.useState(deviceData.hostname || "");

  const powerStatusQuery = trpc.hivelocity.getDevicePowerStatus.useQuery(
    { deviceId: deviceData.deviceId },
    { 
      initialData: { success: true, data: { powerStatus: deviceData.powerStatus } },
      refetchInterval: 10000 // Refetch every 10 seconds
    }
  );

  const powerStatusRaw = (powerStatusQuery.data?.data as any)?.powerStatus || deviceData.powerStatus;
  const powerStatus = typeof powerStatusRaw === 'object' ? powerStatusRaw.status : powerStatusRaw;

  const updateMutation = trpc.hivelocity.updateDevice.useMutation({
    onSuccess: () => {
      toast.success("Device updated successfully");
      setIsEditing(false);
      utils.hivelocity.getDeviceDetails.invalidate({ deviceId: deviceData.deviceId });
    },
    onError: (err) => {
      toast.error(`Failed to update device: ${err.message}`);
    }
  });

  const powerMutation = trpc.hivelocity.devicePowerAction.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Power action '${variables.action}' triggered successfully`);
      // Invalidate both the full details and the specific power status
      utils.hivelocity.getDeviceDetails.invalidate({ deviceId: deviceData.deviceId });
      utils.hivelocity.getDevicePowerStatus.invalidate({ deviceId: deviceData.deviceId });
      
      // Force a manual refetch after a short delay to see the change
      setTimeout(() => powerStatusQuery.refetch(), 2000);
    },
    onError: (err) => {
      toast.error(`Failed to trigger power action: ${err.message}`);
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const validateHostname = (hn: string) => {
    const re = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-z]{2,}$/;
    return re.test(hn);
  };

  const handleSaveAll = () => {
    const nameChanged = editName.trim() !== (deviceData.name || "");
    const hostnameChanged = editHostname.trim() !== (deviceData.hostname || "");

    if (!nameChanged && !hostnameChanged) {
      setIsEditing(false);
      return;
    }

    if (hostnameChanged && !validateHostname(editHostname)) {
      toast.error("Invalid hostname format. Expected FQDN (e.g., server.example.com)");
      return;
    }

    updateMutation.mutate({ 
      deviceId: deviceData.deviceId, 
      name: editName.trim(), 
      hostname: editHostname.trim() 
    });
  };

  const loc = deviceData.location as any;
  const locationLabel = loc?.facility_title && loc?.facility 
    ? `${loc.facility_title} (${loc.facility})`
    : loc?.facility_title || loc?.facility || "Unknown";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-5 w-5 text-primary" />
                  General Information
                </CardTitle>
                <CardDescription>Basic instance identification and location</CardDescription>
              </div>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2"
                  onClick={() => {
                    setEditName(deviceData.name || "");
                    setEditHostname(deviceData.hostname || "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Details
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Internal Name</Label>
                  {isEditing ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 text-sm"
                      placeholder="Enter a custom name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 group min-h-[2.25rem]">
                      <p className="text-base font-semibold truncate">{deviceData.name || "—"}</p>
                      {deviceData.name && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(deviceData.name, "Name")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Hostname</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input 
                        value={editHostname} 
                        onChange={(e) => setEditHostname(e.target.value)}
                        className="h-9 text-sm"
                        placeholder="e.g. server.example.com"
                      />
                      <p className="text-[10px] text-muted-foreground leading-tight italic">
                        Must be a valid Fully Qualified Domain Name (FQDN).
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group min-h-[2.25rem]">
                      <p className="text-base font-semibold truncate">{deviceData.hostname || "—"}</p>
                      {deviceData.hostname && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(deviceData.hostname, "Hostname")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex gap-2 pt-1">
                    {deviceData.isManaged ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800 text-[10px]">Managed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Unmanaged</Badge>
                    )}
                    {deviceData.ipmiEnabled && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-[10px]">IPMI Enabled</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Primary IP</Label>
                  <div className="flex items-center gap-2 min-h-[2.25rem]">
                    <p className="text-base font-mono font-semibold">{deviceData.primaryIp || "—"}</p>
                    {deviceData.primaryIp && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(deviceData.primaryIp, "IP address")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Location</Label>
                  <div className="flex items-center gap-2 min-h-[2.25rem]">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">{locationLabel}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Device ID / Rack</Label>
                  <div className="flex items-center gap-2 min-h-[2.25rem]">
                    <Badge variant="outline" className="font-mono">{deviceData.deviceId}</Badge>
                    <span className="text-muted-foreground">/</span>
                    <p className="text-sm font-medium truncate max-w-[150px]">{loc?.rack || "Rack —"}</p>
                  </div>
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={handleSaveAll}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-5 w-5 text-primary" />
              Power Control
            </CardTitle>
            <CardDescription>Manage instance power state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border relative group">
              <span className="text-sm font-medium">Power Status</span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${(powerStatus === 'ON') ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-bold uppercase">{powerStatus}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => powerStatusQuery.refetch()}
                  disabled={powerStatusQuery.isFetching}
                >
                  <RefreshCw className={`h-3 w-3 ${powerStatusQuery.isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10"
                onClick={() => powerMutation.mutate({ deviceId: deviceData.deviceId, action: "on" })}
                disabled={powerMutation.isPending}
              >
                <Power className="h-4 w-4 text-green-600" />
                Start Instance
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10"
                onClick={() => powerMutation.mutate({ deviceId: deviceData.deviceId, action: "off" })}
                disabled={powerMutation.isPending}
              >
                <Power className="h-4 w-4 text-red-600" />
                Stop Gracefully
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => powerMutation.mutate({ deviceId: deviceData.deviceId, action: "reboot" })}
                disabled={powerMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${powerMutation.isPending ? 'animate-spin' : ''}`} />
                Hard Reboot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instance Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Processor</p>
                <p className="text-sm font-bold">{vpsData?.vcpu != null ? `${vpsData.vcpu} vCPU` : "—"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{deviceData.deviceType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <MemoryStick className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Memory</p>
                <p className="text-sm font-bold">{vpsData?.memory != null ? `${(vpsData.memory / 1024).toFixed(0)} GB RAM` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Provisioned RAM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <HardDrive className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Storage</p>
                <p className="text-sm font-bold">{vpsData?.diskSize != null ? `${vpsData.diskSize} GB` : deviceData?.metadata?.sps_active_product_id ? "SPS Dedicated" : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Primary Disk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <Disc className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active ISO</p>
                <p className="text-sm font-bold truncate max-w-[120px]">{vpsData?.isoId || "None"}</p>
                <p className="text-[10px] text-muted-foreground">Recovery Media</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
