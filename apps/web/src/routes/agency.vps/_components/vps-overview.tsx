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
  Copy,
  Disc,
  Pencil,
  Check,
  X,
  CreditCard,
  ShoppingBag,
  Zap,
  Info,
  ArrowUpCircle,
  Package,
  Layers,
  CalendarDays,
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
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { formatMoney, formatMoneyUsd } from "./money";
import { useConfirm } from "@/hooks/use-confirm";
import { useHivelocityTeamTrpcInput, useTeamHivelocityAccess } from "./team-hivelocity-access-context";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { useHivelocityNiscProducts } from "@/hooks/use-hivelocity-nisc-products";
import {
  buildHivelocityVpsUpgradePlanForCheckout,
  computeVpsUpgradePricing,
  extractHivelocityProductMonthlyUsd,
} from "@/lib/build-hivelocity-vps-upgrade-plan";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { captureEvent } from "@/lib/posthog";

interface VpsOverviewProps {
  deviceData: any;
  vpsData: any;
  /** Customer team slug for checkout (omit on agency routes). */
  teamSlug?: string;
}

export function VpsOverview({
  deviceData,
  vpsData,
  teamSlug,
}: VpsOverviewProps) {
  const utils = trpc.useUtils();
  const teamTrpc = useHivelocityTeamTrpcInput();
  const teamAccess = useTeamHivelocityAccess();
  const isAgencyView = teamAccess == null;

  // Pricing & Localization
  const pricing = useHivelocityPricing("VPS");
  const { productIdByType } = useHivelocityNiscProducts();
  const displayCurrency = pricing.usdToKesRate ? "KES" : "USD";
  /** Wholesale/margin breakdown is agency-only; customers see final prices only. */
  const showPricingBreakdown =
    isAgencyView && Boolean(pricing.settings?.base.marginType);

  const [upgradeBuyOpen, setUpgradeBuyOpen] = React.useState(false);
  const [upgradePlan, setUpgradePlan] = React.useState<ServicePlanDetails | null>(null);

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

  const currentProductId = Number((deviceData as { productId?: number }).productId);
  const currentProductQuery = trpc.hivelocity.getProduct.useQuery(
    { productId: currentProductId },
    { enabled: Number.isFinite(currentProductId) && currentProductId > 0 },
  );
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
      const action = variables.action;
      if (action === "reboot") captureEvent("server_restarted", { server_type: "vps" });
      else if (action === "off") captureEvent("server_powered_off", { server_type: "vps" });
      else if (action === "on") captureEvent("server_powered_on", { server_type: "vps" });
      toast.success(`Power action '${variables.action}' triggered successfully`);
      utils.hivelocity.getDeviceDetails.invalidate({ deviceId: deviceData.deviceId, ...teamTrpc });
      utils.hivelocity.getDevicePowerStatus.invalidate({ deviceId: deviceData.deviceId, ...teamTrpc });
      setTimeout(() => powerStatusQuery.refetch(), 1000);
    },
    onError: (err) => {
      toast.error(`Failed to trigger power action: ${err.message}`);
    }
  });

  const copyToClipboard = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.error(`Nothing to copy for ${label.toLowerCase()}.`);
      return;
    }

    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error(`Could not copy ${label.toLowerCase()}. Select the value and copy manually.`);
    }
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
  const currentPlanName = React.useMemo(() => {
    const fromService = activeServices.find((s) => s?.productName)?.productName;
    if (fromService) return String(fromService);
    return vpsData?.productName || vpsData?.name || null;
  }, [activeServices, vpsData]);

  /** Total recurring bill (base + OS + add-ons) - for “what you pay today” display. */
  const currentTotalMonthlyUsd = React.useMemo(() => {
    const billing = deviceData.billingInfo as { price?: number } | undefined;
    const fromBilling = Number(billing?.price ?? deviceData.nextBillingValue ?? 0);
    if (Number.isFinite(fromBilling) && fromBilling > 0) return fromBilling;
    return Number(vpsData?.monthlyPrice ?? 0) || 0;
  }, [deviceData, vpsData]);

  /**
   * Current base VPS product monthly USD (inventory) - must match upgrade API `monthlyPrice` basis.
   * Do not use total billing here; OS/add-on fees would zero out valid upgrade deltas.
   */
  const currentBaseMonthlyUsd = React.useMemo(() => {
    const fromProduct = extractHivelocityProductMonthlyUsd(currentProductQuery.data?.data);
    if (fromProduct > 0) return fromProduct;
    return 0;
  }, [currentProductQuery.data?.data]);

  const currentDisplayMonthly = React.useMemo(() => {
    if (currentTotalMonthlyUsd <= 0) return null;
    const margined = pricing.applyMarginFor("base", currentTotalMonthlyUsd);
    const amount = margined.final;
    return displayCurrency === "KES" ? (pricing.toKes(amount) ?? amount) : amount;
  }, [currentTotalMonthlyUsd, displayCurrency, pricing]);

  const currentLocationName = React.useMemo(() => {
    const loc = deviceData.location as { facility?: string; facility_title?: string } | undefined;
    return loc?.facility || vpsData?.facilityCode || loc?.facility_title || "Unknown";
  }, [deviceData, vpsData]);

  const openUpgradeCheckout = React.useCallback(
    (upgrade: {
      productId: number;
      name: string;
      monthlyPrice: number;
      vcpu?: string;
      memory?: string;
      disk?: string;
    }) => {
      const poweredOff = ["off", "stopped", "inactive", "shutdown"].includes(String(powerStatus).toLowerCase());
      if (!poweredOff && !isPowerProcessing) {
        toast.warning("Power off this VPS before upgrading. You can shut it down from the overview panel, then try again.");
        return;
      }
      if (isPowerProcessing) {
        toast.warning("Wait until the current power action finishes before starting an upgrade.");
        return;
      }
      if (currentBaseMonthlyUsd <= 0) {
        toast.error("Current plan pricing is still loading. Wait a moment and try again.");
        return;
      }

      setUpgradePlan(
        buildHivelocityVpsUpgradePlanForCheckout({
          upgrade: {
            productId: Number(upgrade.productId),
            name: String(upgrade.name ?? "Upgrade plan"),
            monthlyPrice: Number(upgrade.monthlyPrice) || 0,
            vcpu: upgrade.vcpu,
            memory: upgrade.memory,
            disk: upgrade.disk,
          },
          deviceId: Number(deviceData.deviceId),
          currentHostname: String(deviceData.hostname || deviceData.name || `vps-${deviceData.deviceId}`),
          currentLocationName,
          currentOsName: String(vpsData?.osName || "unchanged"),
          currentMonthlyUsd: currentBaseMonthlyUsd,
          displayCurrency,
          niscProductId: productIdByType.VPS,
          pricing,
        }),
      );
      setUpgradeBuyOpen(true);
    },
    [
      powerStatus,
      isPowerProcessing,
      deviceData,
      currentLocationName,
      vpsData,
      currentBaseMonthlyUsd,
      displayCurrency,
      productIdByType.VPS,
      pricing,
    ],
  );

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
                  const marginResult = pricing.applyMarginFor("base", baseUsd);
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
                              {showPricingBreakdown ? (
                                <>
                                  <p className="text-[9px] font-medium text-emerald-600 uppercase">
                                    Original: {formatMoneyUsd(baseUsd)} • {formatMoney(pricing.toKes(baseUsd) || 0, "KES")}
                                  </p>
                                  <p className="text-[9px] font-medium text-orange-600 uppercase">
                                    Margin: {formatMoneyUsd(marginResult.marginAmount)} • {formatMoney(pricing.toKes(marginResult.marginAmount) || 0, "KES")}
                                  </p>
                                </>
                              ) : null}
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
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Scale & Optimization
            </CardTitle>
            <CardDescription>
              {currentPlanName
                ? `Upgrade paths above ${currentPlanName}`
                : "Upgrade paths above your current plan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!upgradesQuery.isLoading && availableUpgrades.length > 0 ? (
              <div className="mx-4 mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-3 text-xs text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2 min-w-0">
                    <p className="font-semibold text-foreground">How upgrade pricing works</p>
                    <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
                      {currentPlanName ? (
                        <li>
                          You are on <span className="font-semibold text-foreground">{currentPlanName}</span>
                          {currentDisplayMonthly != null ? (
                            <>
                              {" "}
                              at{" "}
                              <span className="font-semibold text-foreground">
                                {formatMoney(currentDisplayMonthly, displayCurrency)}/mo
                              </span>{" "}
                              today.
                            </>
                          ) : (
                            " today."
                          )}
                        </li>
                      ) : null}
                      <li>
                        Each <span className="font-semibold text-primary">+…/mo</span> price is the{" "}
                        <span className="font-semibold text-foreground">extra base plan cost</span> to move to that
                        tier (new VPS product price minus your current VPS product price). OS licenses and add-ons
                        stay as they are.
                      </li>
                      <li>
                        At checkout you are invoiced for that monthly increase (ex VAT). VAT is added on the payment
                        step where applicable.
                      </li>
                      <li>
                        After the upgrade completes, your subscription renews at the{" "}
                        <span className="font-semibold text-foreground">new plan total</span>. Hover any + price to
                        see that amount.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            {upgradesQuery.isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : availableUpgrades.length > 0 ? (
              <div className="divide-y divide-border/40 mt-3">
                {availableUpgrades.map((upgrade, idx) => {
                  const upgradePricingReady =
                    currentBaseMonthlyUsd > 0 || !currentProductQuery.isLoading;
                  const upgradePricing = computeVpsUpgradePricing({
                    targetMonthlyUsd: Number(upgrade.monthlyPrice) || 0,
                    currentMonthlyUsd: currentBaseMonthlyUsd,
                    displayCurrency,
                    pricing,
                  });
                  return (
                    <TooltipProvider key={upgrade.productId ?? idx}>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 transition-colors group ${upgradePricingReady ? "hover:bg-primary/5 cursor-pointer" : "opacity-80"}`}
                        onClick={() => {
                          if (upgradePricingReady) openUpgradeCheckout(upgrade);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase truncate">{upgrade.name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            {upgrade.vcpu ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <Cpu className="h-3 w-3 text-primary/60 shrink-0" />
                                    <span className="text-[10px] font-bold">{upgrade.vcpu}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>vCPU Cores</TooltipContent>
                              </Tooltip>
                            ) : null}
                            {upgrade.memory ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <MemoryStick className="h-3 w-3 text-primary/60 shrink-0" />
                                    <span className="text-[10px] font-bold">{upgrade.memory}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Memory Allocation</TooltipContent>
                              </Tooltip>
                            ) : null}
                            {upgrade.disk ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3 text-primary/60 shrink-0" />
                                    <span className="text-[10px] font-bold">{upgrade.disk}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>NVMe Storage</TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="shrink-0 text-right min-w-[88px]">
                              {!upgradePricingReady ? (
                                <Skeleton className="h-5 w-20 ml-auto" />
                              ) : (
                                <p className="text-sm font-bold text-primary leading-tight">
                                  +{formatMoney(upgradePricing.displayDelta, displayCurrency)}
                                  <span className="text-[10px] text-muted-foreground uppercase ml-0.5">/mo</span>
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs space-y-1 text-xs">
                            <p>
                              {isAgencyView ? "New plan total: " : "Plan total after upgrade: "}
                              {formatMoney(upgradePricing.displayTarget, displayCurrency)}/mo
                            </p>
                            {showPricingBreakdown ? (
                              <>
                                <p className="text-emerald-600">
                                  Orig: {formatMoneyUsd(upgradePricing.deltaUsd)} ·{" "}
                                  {formatMoney(pricing.toKes(upgradePricing.deltaUsd) || 0, "KES")}
                                </p>
                                <p className="text-orange-600">
                                  Marg: {formatMoneyUsd(upgradePricing.deltaMarginUsd)} ·{" "}
                                  {formatMoney(pricing.toKes(upgradePricing.deltaMarginUsd) || 0, "KES")}
                                </p>
                              </>
                            ) : null}
                          </TooltipContent>
                        </Tooltip>
                        <Button
                          size="sm"
                          className="h-7 shrink-0 gap-1.5 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpgradeCheckout(upgrade);
                          }}
                          disabled={!upgradePricingReady}
                        >
                          <CreditCard className="h-3 w-3" />
                          Upgrade
                        </Button>
                      </div>
                    </TooltipProvider>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Product is already at maximum configuration</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {upgradePlan ? (
        <BuyNowDialog
          open={upgradeBuyOpen}
          onOpenChange={setUpgradeBuyOpen}
          plan={upgradePlan}
          requireDomainStep={false}
          teamSlug={teamSlug}
          intent="buy_now"
        />
      ) : null}
    </div>
  );
}
