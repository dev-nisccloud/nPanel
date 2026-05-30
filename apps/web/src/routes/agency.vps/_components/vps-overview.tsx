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
  X,
  CreditCard,
  ShoppingBag,
  Zap,
  ArrowUpCircle,
  Package,
  Layers,
  CalendarDays,
  Link as LinkIcon,
  Plus
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { formatMoney, formatMoneyUsd } from "./money";
import { CreateSubscriptionForHivelocityDialog } from "./create-subscription-for-hivelocity-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { Link } from "react-router";
import { useHivelocityTeamTrpcInput } from "./team-hivelocity-access-context";

interface VpsOverviewProps {
  deviceData: any;
  vpsData: any;
  /** Prefix for subscription detail links, e.g. `/agency/subscriptions` or `/{teamSlug}/subscriptions`. */
  subscriptionsPathPrefix?: string;
}

export function VpsOverview({ deviceData, vpsData, subscriptionsPathPrefix = "/agency/subscriptions" }: VpsOverviewProps) {
  const utils = trpc.useUtils();
  const teamTrpc = useHivelocityTeamTrpcInput();

  // Pricing & Localization
  const pricing = useHivelocityPricing("VPS");
  const displayCurrency = pricing.usdToKesRate ? "KES" : "USD";
  const showOriginalUsd = Boolean(pricing.settings?.base.marginType);

  // Editing State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(deviceData.name || "");
  const [editHostname, setEditHostname] = React.useState(deviceData.hostname || "");

  // New Queries
  const servicesQuery = trpc.hivelocity.getDeviceServices.useQuery({
    deviceId: deviceData.deviceId,
    ...teamTrpc,
  });
  const upgradesQuery = trpc.hivelocity.getVpsUpgrades.useQuery({
    deviceId: deviceData.deviceId,
    ...teamTrpc,
  });
  const subscriptionLinkQuery = trpc.clientSubscriptions.getHasLinkedSubscriptionByHivelocityDeviceId.useQuery({ 
    hivelocityDeviceId: deviceData.deviceId 
  });

  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);

  const [BootDialog, confirmBoot] = useConfirm("Power on instance?", "This will start up your VPS instance. Are you sure you want to proceed?");
  const [ShutdownDialog, confirmShutdown] = useConfirm("Safe shutdown?", "This will initiate a graceful shutdown of your VPS instance. Are you sure you want to proceed?");
  const [RebootDialog, confirmReboot] = useConfirm("Reboot instance?", "This will perform a safe reboot of your VPS instance. Any unsaved data in memory will be lost. Are you sure you want to proceed?");
  const [UpdateIdentityDialog, confirmUpdateIdentity] = useConfirm("Update instance identity?", "This will change the label and hostname of your VPS instance. Are you sure you want to proceed?");

  const powerStatusQuery = trpc.hivelocity.getDevicePowerStatus.useQuery(
    { deviceId: deviceData.deviceId, ...teamTrpc },
    { 
      initialData: { success: true, data: { powerStatus: deviceData.powerStatus, pendingAction: null } },
      refetchInterval: (query) => {
        const hasPending = (query.state.data?.data as any)?.pendingAction;
        return hasPending ? 5000 : 20000;
      }
    }
  );

  const pendingAction = (powerStatusQuery.data?.data as any)?.pendingAction;
  const isPowerProcessing = !!pendingAction;

  const powerStatusRaw = (powerStatusQuery.data?.data as any)?.powerStatus || deviceData.powerStatus;
  const powerStatus = typeof powerStatusRaw === 'object' ? powerStatusRaw.status : powerStatusRaw;

  const updateMutation = trpc.hivelocity.updateDevice.useMutation({
    onSuccess: () => {
      toast.success("Device updated successfully");
      setIsEditing(false);
      utils.hivelocity.getDeviceDetails.invalidate({ deviceId: deviceData.deviceId, ...teamTrpc });
    },
    onError: (err) => {
      toast.error(`Failed to update device: ${err.message}`);
    }
  });

  const powerMutation = trpc.hivelocity.devicePowerAction.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Power action '${variables.action}' triggered successfully`);
      utils.hivelocity.getDeviceDetails.invalidate({ deviceId: deviceData.deviceId, ...teamTrpc });
      utils.hivelocity.getDevicePowerStatus.invalidate({ deviceId: deviceData.deviceId, ...teamTrpc });
      setTimeout(() => powerStatusQuery.refetch(), 1000);
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

  const handleSaveAll = async () => {
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

    const ok = await confirmUpdateIdentity();
    if (!ok) return;

    updateMutation.mutate({
      deviceId: deviceData.deviceId,
      name: editName.trim(),
      hostname: editHostname.trim(),
      ...teamTrpc,
    });
  };

  const loc = deviceData.location as any;
  const locationLabel = loc?.facility_title || loc?.city || loc?.facility || "Unknown";

  const activeServices = (servicesQuery.data?.data as any[]) || [];
  const availableUpgrades = (upgradesQuery.data?.data as any[]) || [];

  return (
    <div className="space-y-6">
      <BootDialog />
      <ShutdownDialog />
      <RebootDialog />
      <UpdateIdentityDialog />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Information */}
        <Card className="lg:col-span-2 border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-5 w-5 text-primary" />
                  Primary Identification
                </CardTitle>
                <CardDescription>Instance metadata and geolocation</CardDescription>
              </div>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 bg-background font-bold text-[10px] uppercase tracking-wider"
                  onClick={() => {
                    setEditName(deviceData.name || "");
                    setEditHostname(deviceData.hostname || "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Update Identity
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Label / Identifier</Label>
                  {isEditing ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-sm font-medium focus-visible:ring-primary/20"
                      placeholder="Enter a custom name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 group min-h-[2.5rem] p-3 rounded-lg bg-muted/20 border border-border/40">
                      <p className="text-sm font-bold truncate">{deviceData.name || "Unnamed Instance"}</p>
                      {deviceData.name && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-all" onClick={() => copyToClipboard(deviceData.name, "Name")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Network hostname (FQDN)</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input 
                        value={editHostname} 
                        onChange={(e) => setEditHostname(e.target.value)}
                        className="h-10 text-sm font-medium focus-visible:ring-primary/20"
                        placeholder="e.g. node-01.npanel.io"
                      />
                      <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">
                        Must resolve to a valid IP for correct RDNS functionality.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group min-h-[2.5rem] p-3 rounded-lg bg-muted/20 border border-border/40">
                      <p className="text-sm font-medium truncate text-primary">{deviceData.hostname || "-"}</p>
                      {deviceData.hostname && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-all" onClick={() => copyToClipboard(deviceData.hostname, "Hostname")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Primary interface IP</Label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-bold text-primary">{deviceData.primaryIp || "Allocation Pending"}</p>
                    {deviceData.primaryIp && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto hover:bg-primary/10" onClick={() => copyToClipboard(deviceData.primaryIp, "IP address")}>
                        <Copy className="h-3 w-3 text-primary" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Location</Label>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
                      <MapPin className="h-3.5 w-3.5 text-primary/60" />
                      <p className="text-xs font-bold truncate">{locationLabel}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Registry ID</Label>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
                      <Fingerprint className="h-3.5 w-3.5 text-primary/60" />
                      <p className="text-xs font-bold">{deviceData.deviceId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-dashed">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-bold text-[10px] uppercase tracking-wider"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Discard
                </Button>
                <Button 
                  size="sm" 
                  className="gap-2 font-bold text-[10px] uppercase tracking-wider px-6"
                  onClick={handleSaveAll}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Power */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              Power Management
            </CardTitle>
            <CardDescription>Hardware-level state control</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border relative group overflow-hidden">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${powerStatus === 'ON' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Real-time status</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${powerStatus === 'ON' ? 'text-green-600' : 'text-red-600'}`}>
                    Instance {powerStatus === 'ON' ? 'running' : 'stopped'}
                  </span>
                  {isPowerProcessing && (
                    <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-[10px] font-bold h-5 px-2">
                       <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                       {(() => {
                         const a = pendingAction.action.toLowerCase();
                         if (a === 'on' || a === 'boot') return 'Powering device on...';
                         if (a === 'off' || a === 'shutdown') return 'Powering device off...';
                         if (a === 'reboot') return 'Rebooting device...';
                         return `${a.toUpperCase()}...`;
                       })()}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-muted/20"
                onClick={() => powerStatusQuery.refetch()}
                disabled={powerStatusQuery.isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${powerStatusQuery.isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button 
                variant="outline" 
                className={`w-full justify-start gap-3 h-11 border-border/40 hover:bg-green-50/50 hover:text-green-700 hover:border-green-200 transition-all group ${powerStatus === 'ON' ? 'opacity-50 grayscale' : ''}`}
                onClick={async () => {
                  const ok = await confirmBoot();
                  if (ok) powerMutation.mutate({ deviceId: deviceData.deviceId, action: "on", ...teamTrpc });
                }}
                disabled={powerMutation.isPending || isPowerProcessing || powerStatus === 'ON'}
              >
                <div className="p-1.5 rounded-lg bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
                   <Power className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase">Cold boot</span>
              </Button>
              <Button 
                variant="outline" 
                className={`w-full justify-start gap-3 h-11 border-border/40 hover:bg-red-50/50 hover:text-red-700 hover:border-red-200 transition-all group ${powerStatus === 'OFF' ? 'opacity-50 grayscale' : ''}`}
                onClick={async () => {
                  const ok = await confirmShutdown();
                  if (ok) powerMutation.mutate({ deviceId: deviceData.deviceId, action: "off", ...teamTrpc });
                }}
                disabled={powerMutation.isPending || isPowerProcessing || powerStatus === 'OFF'}
              >
                <div className="p-1.5 rounded-lg bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                   <Power className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase">Safe shutdown</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-11 border-border/40 hover:bg-amber-50/50 hover:text-amber-700 hover:border-amber-200 transition-all group"
                onClick={async () => {
                  const ok = await confirmReboot();
                  if (ok) powerMutation.mutate({ deviceId: deviceData.deviceId, action: "reboot", ...teamTrpc });
                }}
                disabled={powerMutation.isPending || isPowerProcessing}
              >
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 group-hover:rotate-180 transition-transform duration-500">
                   <RefreshCw className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase">Reboot</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Customer Subscription Link */}
        <Card className="border-border/40 shadow-sm overflow-hidden flex flex-col xl:col-span-2">
          <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="h-5 w-5 text-primary" />
                Customer Subscription Link
              </CardTitle>
              <CardDescription>Associate this hardware with a client-facing subscription</CardDescription>
            </div>
            {subscriptionLinkQuery.data?.hasLinked ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-1 px-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                Linked to Subscription
              </Badge>
            ) : (
              <Button 
                size="sm" 
                className="h-8 gap-2 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-4"
                onClick={() => setLinkDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Link to Subscription
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {subscriptionLinkQuery.isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : subscriptionLinkQuery.data?.hasLinked ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-dashed border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Linked Subscription</p>
                    <p className="text-xs text-muted-foreground">ID: {subscriptionLinkQuery.data.subscriptionId}</p>
                  </div>
                </div>
                <Link to={`${subscriptionsPathPrefix}/${subscriptionLinkQuery.data.subscriptionId}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] uppercase font-bold">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Subscription
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <div className="p-3 rounded-full bg-muted/20 text-muted-foreground/40">
                  <LinkIcon className="h-6 w-6" />
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-bold text-foreground/80">No customer subscription linked</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Linking this VPS to a customer subscription allows you to automate billing, track revenue, and manage the lifecycle within nPanel.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="border-border/40 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              Service Components
            </CardTitle>
            <CardDescription>Active billing records and provisioned resources</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {servicesQuery.isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activeServices.length > 0 ? (
              <div className="divide-y divide-border/40">
                {activeServices.map((service, idx) => {
                  const status = (service.status || "").toUpperCase();
                  const badgeColors = 
                    status === "ACTIVE" 
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20" 
                      : status === "INACTIVE" || status === "SUSPENDED" || status === "CANCELLED"
                        ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20";

                  const baseUsd = Number(service.billedPrice || 0);
                  const marginResult = pricing.applyMargin(baseUsd);
                  const finalPrice = marginResult.final;
                  const finalDisplayPrice = displayCurrency === "KES" ? pricing.toKes(finalPrice) : finalPrice;

                  return (
                    <div key={idx} className="p-6 space-y-6 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold uppercase text-foreground/90">{service.productName}</h4>
                            <Badge variant="outline" className={`text-[9px] font-bold h-4 px-2 ${badgeColors}`}>
                              {status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                             <Server className="h-3 w-3" />
                             <span>Subscription ID: <span className="text-foreground font-bold">{service.serviceId}</span></span>
                             <span className="mx-1">•</span>
                             <CalendarDays className="h-3 w-3" />
                             <span>Term: <span className="text-foreground font-bold uppercase">{service.period}</span></span>
                          </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 px-5 text-right min-w-[120px]">
                           <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Recurring</p>
                           <p className="text-xl font-bold text-primary">
                             {formatMoney(finalDisplayPrice, displayCurrency)}
                           </p>
                           <div className="flex flex-col items-end gap-0.5 mt-1">
                              {showOriginalUsd && (
                                <>
                                  <p className="text-[9px] font-medium text-emerald-600 uppercase">
                                    Original: {formatMoneyUsd(baseUsd)} • {formatMoney(pricing.toKes(baseUsd) || 0, "KES")}
                                  </p>
                                  <p className="text-[9px] font-medium text-orange-600 uppercase">
                                    Margin: {formatMoneyUsd(marginResult.marginAmount)} • {formatMoney(pricing.toKes(marginResult.marginAmount) || 0, "KES")}
                                  </p>
                                </>
                              )}
                              <p className="text-[9px] text-muted-foreground font-bold">
                                Next: {service.renewDate ? new Date(service.renewDate * 1000).toLocaleDateString() : "Auto-renew"}
                              </p>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Provisioned options</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Inject Location manually as a provisioned context item if requested */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 group/opt hover:border-primary/20 transition-colors">
                            <div className="p-2 rounded-lg bg-background border border-border/40 shadow-sm group-hover/opt:text-primary transition-colors text-primary">
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold truncate">Provisioning location</p>
                              <p className="text-xs font-bold truncate text-foreground/80">{locationLabel}</p>
                            </div>
                          </div>

                          {service.serviceOptions?.filter((opt: any) => opt.name !== "None").map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 group/opt hover:border-primary/20 transition-colors">
                              <div className="p-2 rounded-lg bg-background border border-border/40 shadow-sm group-hover/opt:text-primary transition-colors text-primary">
                                {(() => {
                                  const name = opt.upgradeName.toLowerCase();
                                  if (name.includes("cpu") || name.includes("processor")) return <Cpu className="h-3.5 w-3.5" />;
                                  if (name.includes("ram") || name.includes("memory")) return <MemoryStick className="h-3.5 w-3.5" />;
                                  if (name.includes("disk") || name.includes("storage") || name.includes("hard drive")) return <HardDrive className="h-3.5 w-3.5" />;
                                  if (name.includes("os") || name.includes("operating system")) return <Disc className="h-3.5 w-3.5" />;
                                  if (name.includes("control panel")) return <Terminal className="h-3.5 w-3.5" />;
                                  if (name.includes("software") || name.includes("license")) return <Package className="h-3.5 w-3.5" />;
                                  if (name.includes("network") || name.includes("bandwidth")) return <Globe className="h-3.5 w-3.5" />;
                                  return <Layers className="h-3.5 w-3.5" />;
                                })()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold truncate">{opt.upgradeName}</p>
                                <p className="text-xs font-bold truncate text-foreground/80">{opt.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase opacity-40">No records in registry</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Scale & Optimization
            </CardTitle>
            <CardDescription>Available product upgrade paths</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {upgradesQuery.isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : availableUpgrades.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[9px] font-bold uppercase pl-6">Product plan</TableHead>
                    <TableHead className="text-[9px] font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3 w-3" />
                        Resources
                      </div>
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" />
                        Cost
                      </div>
                    </TableHead>
                    <TableHead className="text-[9px] font-bold uppercase text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableUpgrades.map((upgrade, idx) => {
                    const baseUsd = Number(upgrade.monthlyPrice || 0);
                    const marginResult = pricing.applyMargin(baseUsd);
                    const finalPrice = marginResult.final;
                    const finalDisplayPrice = displayCurrency === "KES" ? pricing.toKes(finalPrice) : finalPrice;

                    return (
                      <TableRow key={idx} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                        <TableCell className="pl-6 py-4">
                           <span className="text-xs font-bold uppercase">{upgrade.name}</span>
                        </TableCell>
                        <TableCell className="py-4">
                           <div className="flex items-center gap-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <Cpu className="h-3 w-3 text-primary/60" />
                                      <span className="text-[10px] font-bold">{upgrade.vcpu}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>vCPU Cores</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <MemoryStick className="h-3 w-3 text-primary/60" />
                                      <span className="text-[10px] font-bold">{upgrade.memory}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Memory Allocation</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <HardDrive className="h-3 w-3 text-primary/60" />
                                      <span className="text-[10px] font-bold">{upgrade.disk}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>NVMe Storage</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                           </div>
                        </TableCell>
                        <TableCell className="py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-primary">
                               {formatMoney(finalDisplayPrice, displayCurrency)}
                               <span className="text-[10px] text-muted-foreground uppercase ml-1">/mo</span>
                             </span>
                             {showOriginalUsd && (
                               <div className="flex flex-col gap-0">
                                 <span className="text-[9px] font-medium text-emerald-600 uppercase">
                                   Orig: {formatMoneyUsd(baseUsd)} • {formatMoney(pricing.toKes(baseUsd) || 0, "KES")}
                                 </span>
                                 <span className="text-[9px] font-medium text-orange-600 uppercase">
                                   Marg: {formatMoneyUsd(marginResult.marginAmount)} • {formatMoney(pricing.toKes(marginResult.marginAmount) || 0, "KES")}
                                 </span>
                               </div>
                             )}
                           </div>
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                           <Button size="sm" className="h-8 gap-2 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-4">
                              <CreditCard className="h-3.5 w-3.5" />
                              Upgrade
                           </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Product is already at maximum configuration</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <CreateSubscriptionSection 
        deviceId={deviceData.deviceId}
        deviceName={deviceData.name || deviceData.hostname}
        isOpen={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
    </div>
  );
}

function CreateSubscriptionSection({ 
  deviceId, 
  deviceName, 
  isOpen, 
  onOpenChange 
}: { 
  deviceId: string | number; 
  deviceName: string; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CreateSubscriptionForHivelocityDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      deviceId={deviceId}
      deviceName={deviceName}
      serviceType="vps"
    />
  );
}
