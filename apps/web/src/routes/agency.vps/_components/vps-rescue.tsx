"use client";

import * as React from "react";
import { Disc, ShieldAlert, Upload, XCircle, Info, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { useHivelocityTeamTrpcInput } from "./team-hivelocity-access-context";
import { useConfirm } from "@/hooks/use-confirm";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { useHivelocityNiscProducts } from "@/hooks/use-hivelocity-nisc-products";
import { buildHivelocityVpsReloadPlanForCheckout } from "@/lib/build-hivelocity-vps-reload-plan";
import { formatMoney } from "./money";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type VpsIso = {
  isoId: string;
  name: string;
  description?: string;
  bootable?: boolean;
  ready?: boolean;
  status?: string;
};

type ReloadOsOption = {
  id?: number;
  name?: string;
  monthlyPrice?: number;
  currency?: string;
};

type ReloadInfo = {
  osName?: string;
  osOptionId?: number;
  operatingSystemOptions?: ReloadOsOption[];
  publicSshKeyIds?: number[];
};

function resolvePowerStatus(raw: unknown): string {
  if (raw == null) return "UNKNOWN";
  if (typeof raw === "object" && raw !== null && "status" in raw) {
    return String((raw as { status: unknown }).status).toUpperCase();
  }
  return String(raw).toUpperCase();
}

function normalizeIsoList(raw: unknown): VpsIso[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const isoId = String(row.isoId ?? "").trim();
      const name = String(row.name ?? row.description ?? isoId).trim();
      if (!isoId) return null;
      return {
        isoId,
        name,
        description: typeof row.description === "string" ? row.description : undefined,
        bootable: row.bootable === true,
        ready: row.ready === true,
        status: typeof row.status === "string" ? row.status : undefined,
      };
    })
    .filter((iso): iso is VpsIso => iso !== null);
}

function encodePrice(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

interface VpsRescueProps {
  deviceId: number;
  deviceData: {
    deviceId?: number;
    name?: string;
    hostname?: string;
    productId?: number;
    powerStatus?: unknown;
    location?: { facility?: string; facility_title?: string };
  };
  vpsData?: { facilityCode?: string; isoId?: string; osName?: string } | null;
}

export function VpsRescue({ deviceId, deviceData, vpsData }: VpsRescueProps) {
  const utils = trpc.useUtils();
  const teamTrpc = useHivelocityTeamTrpcInput();
  const pricing = useHivelocityPricing("VPS");
  const { productIdByType } = useHivelocityNiscProducts();
  const displayCurrency = pricing.usdToKesRate ? "KES" : "USD";

  const facilityCode =
    vpsData?.facilityCode?.trim() ||
    deviceData?.location?.facility?.trim() ||
    "";

  const currentLocationName =
    deviceData?.location?.facility ||
    vpsData?.facilityCode ||
    deviceData?.location?.facility_title ||
    "Unknown";

  const [reloadBuyOpen, setReloadBuyOpen] = React.useState(false);
  const [reloadPlan, setReloadPlan] = React.useState<ServicePlanDetails | null>(null);

  const [ReloadDialog, confirmReload] = useConfirm(
    "Wipe and reinstall the operating system?",
    "This will permanently delete all data on the primary disk and reinstall the OS. This action cannot be undone. Are you absolutely sure you want to proceed?",
  );
  const [DetachDialog, confirmDetach] = useConfirm(
    "Detach mounted ISO?",
    "The instance will boot from the primary disk again after the ISO is detached.",
  );

  const vpsQuery = trpc.hivelocity.getVpsDetails.useQuery(
    { deviceId, ...teamTrpc },
    { initialData: vpsData ? { success: true, data: vpsData } : undefined },
  );

  const powerQuery = trpc.hivelocity.getDevicePowerStatus.useQuery(
    { deviceId, ...teamTrpc },
    {
      initialData: {
        success: true,
        data: { powerStatus: deviceData.powerStatus, pendingAction: null },
      },
    },
  );

  const isosQuery = trpc.hivelocity.listVpsIsos.useQuery(
    { facilityCode },
    { enabled: facilityCode.length > 0 },
  );

  const reloadInfoQuery = trpc.hivelocity.getDeviceReloadInfo.useQuery(
    { deviceId, ...teamTrpc },
  );

  const attachMutation = trpc.hivelocity.vpsAttachIso.useMutation({
    onSuccess: () => {
      toast.success("ISO attachment initiated");
      void utils.hivelocity.getVpsDetails.invalidate({ deviceId, ...teamTrpc });
    },
    onError: (err) =>
      toast.error(resolveClientErrorMessage(err, "Failed to attach ISO")),
  });

  const detachMutation = trpc.hivelocity.vpsDetachIso.useMutation({
    onSuccess: () => {
      toast.success("ISO detached successfully");
      void utils.hivelocity.getVpsDetails.invalidate({ deviceId, ...teamTrpc });
    },
    onError: (err) =>
      toast.error(resolveClientErrorMessage(err, "Failed to detach ISO")),
  });

  const reloadMutation = trpc.hivelocity.reloadDevice.useMutation({
    onSuccess: () => {
      toast.success("OS reload initiated. This may take several minutes.");
      void utils.hivelocity.getDeviceDetails.invalidate({ deviceId, ...teamTrpc });
      void utils.hivelocity.getVpsDetails.invalidate({ deviceId, ...teamTrpc });
      void utils.hivelocity.getDeviceReloadInfo.invalidate({ deviceId, ...teamTrpc });
    },
    onError: (err) =>
      toast.error(resolveClientErrorMessage(err, "Failed to initiate OS reload")),
  });

  const pendingAction = (powerQuery.data?.data as { pendingAction?: unknown })?.pendingAction;
  const isPowerTransitioning = Boolean(pendingAction);
  const powerStatus = resolvePowerStatus(
    (powerQuery.data?.data as { powerStatus?: unknown })?.powerStatus ?? deviceData.powerStatus,
  );
  const isPoweredOff = powerStatus === "OFF";

  const attachedIsoId = String(
    (vpsQuery.data?.data as { isoId?: unknown } | null | undefined)?.isoId ?? "",
  ).trim();

  const isoOptions = React.useMemo(() => {
    const all = normalizeIsoList(isosQuery.data?.data);
    return all.filter((iso) => iso.bootable !== false && iso.ready !== false);
  }, [isosQuery.data?.data]);

  const attachedIso = isoOptions.find((iso) => iso.isoId === attachedIsoId);

  const reloadInfo = (reloadInfoQuery.data?.data ?? {}) as ReloadInfo;
  const osOptions = reloadInfo.operatingSystemOptions ?? [];
  const defaultOsId = reloadInfo.osOptionId;

  const [selectedOsId, setSelectedOsId] = React.useState<string>("");

  React.useEffect(() => {
    if (selectedOsId) return;
    if (defaultOsId != null) {
      setSelectedOsId(String(defaultOsId));
    } else if (osOptions.length > 0 && osOptions[0]?.id != null) {
      setSelectedOsId(String(osOptions[0].id));
    }
  }, [defaultOsId, osOptions, selectedOsId]);

  const selectedOs = React.useMemo(
    () => osOptions.find((opt) => String(opt.id) === selectedOsId),
    [osOptions, selectedOsId],
  );

  const selectedOsPriceUsd = encodePrice(selectedOs?.monthlyPrice);
  const isPaidOsSelected = selectedOsPriceUsd > 0;

  const formatOsPriceLabel = React.useCallback(
    (monthlyPriceUsd: number) => {
      if (monthlyPriceUsd <= 0) return "Free";
      const marginedUsd = pricing.applyMarginFor("os", monthlyPriceUsd);
      const display =
        displayCurrency === "KES"
          ? (pricing.toKes(marginedUsd.final) ?? marginedUsd.final)
          : marginedUsd.final;
      return `+${formatMoney(display, displayCurrency)}/mo`;
    },
    [displayCurrency, pricing],
  );

  const ensurePoweredOff = React.useCallback(async (): Promise<boolean> => {
    const res = await utils.hivelocity.getDevicePowerStatus.fetch({ deviceId, ...teamTrpc });
    const data = res?.data as { powerStatus?: unknown; pendingAction?: unknown } | undefined;
    if (data?.pendingAction) {
      toast.error("Power state is changing. Wait for the current action to finish.");
      return false;
    }
    const status = resolvePowerStatus(data?.powerStatus ?? deviceData.powerStatus);
    if (status !== "OFF") {
      toast.error("The instance must be powered off before this action. Shut it down from the Overview tab.");
      return false;
    }
    return true;
  }, [deviceData.powerStatus, deviceId, teamTrpc, utils.hivelocity.getDevicePowerStatus]);

  const openPaidReloadCheckout = React.useCallback(() => {
    if (!selectedOs?.id) {
      toast.error("Select an operating system first.");
      return;
    }

    const hivelocityProductId = Number(deviceData.productId);
    if (!Number.isFinite(hivelocityProductId) || hivelocityProductId <= 0) {
      toast.error("Could not determine the instance product. Try again from the overview tab.");
      return;
    }

    setReloadPlan(
      buildHivelocityVpsReloadPlanForCheckout({
        deviceId,
        currentHostname: String(deviceData.hostname || deviceData.name || `vps-${deviceId}`),
        currentLocationName,
        currentOsName: String(reloadInfo.osName || vpsData?.osName || "current OS"),
        targetOs: {
          id: Number(selectedOs.id),
          name: String(selectedOs.name ?? `OS ${selectedOs.id}`),
          monthlyPriceUsd: selectedOsPriceUsd,
        },
        hivelocityProductId,
        publicSshKeyIds: reloadInfo.publicSshKeyIds,
        displayCurrency,
        niscProductId: productIdByType.VPS,
        pricing,
      }),
    );
    setReloadBuyOpen(true);
  }, [
    selectedOs,
    deviceData,
    deviceId,
    currentLocationName,
    reloadInfo,
    vpsData?.osName,
    selectedOsPriceUsd,
    displayCurrency,
    productIdByType.VPS,
    pricing,
  ]);

  const handleAttach = async (isoId: string) => {
    if (attachMutation.isPending) return;
    attachMutation.mutate({ deviceId, isoId, ...teamTrpc });
  };

  const handleDetach = async () => {
    if (!attachedIsoId || detachMutation.isPending) return;
    const ok = await confirmDetach();
    if (!ok) return;
    detachMutation.mutate({ deviceId, ...teamTrpc });
  };

  const handleReload = async () => {
    if (reloadMutation.isPending) return;
    if (!(await ensurePoweredOff())) return;

    if (!selectedOs?.id) {
      toast.error("Select an operating system first.");
      return;
    }

    const ok = await confirmReload();
    if (!ok) return;

    if (isPaidOsSelected) {
      openPaidReloadCheckout();
      return;
    }

    const operatingSystemId = Number(selectedOsId || defaultOsId);
    reloadMutation.mutate({
      deviceId,
      ...teamTrpc,
      ...(Number.isFinite(operatingSystemId) ? { operatingSystemId } : {}),
      ...(reloadInfo.publicSshKeyIds?.length
        ? { publicSshKeyIds: reloadInfo.publicSshKeyIds }
        : {}),
    });
  };

  const isBusy =
    attachMutation.isPending ||
    detachMutation.isPending ||
    reloadMutation.isPending ||
    isPowerTransitioning;

  return (
    <div className="space-y-6">
      <ReloadDialog />
      <DetachDialog />

      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-400">Rescue Mode Warning</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-500">
          Mounting an ISO or performing an OS reload will impact your current installation. Ensure you have backups
          before proceeding. OS reload requires the instance to be powered off. Licensed operating systems require
          purchase before reload.
        </AlertDescription>
      </Alert>

      {!isPoweredOff && (
        <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Instance is running</AlertTitle>
          <AlertDescription>
            Shut down the instance from the Overview tab before initiating a full OS reload.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Disc className="h-5 w-5 text-primary" />
              Mount Recovery ISO
            </CardTitle>
            <CardDescription>
              Boot from a facility ISO image ({facilityCode || "facility unknown"})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!facilityCode ? (
              <p className="text-sm text-muted-foreground">Facility code is unavailable for this instance.</p>
            ) : isosQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : isosQuery.isError ? (
              <p className="text-sm text-destructive">
                {resolveClientErrorMessage(isosQuery.error, "Failed to load available ISO images")}
              </p>
            ) : isoOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bootable ISO images are available in this facility.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {isoOptions.map((iso) => {
                  const isAttached = attachedIsoId === iso.isoId;
                  return (
                    <div
                      key={iso.isoId}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{iso.name}</p>
                          {isAttached && <Badge variant="secondary">Mounted</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {iso.description || iso.isoId}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0"
                        onClick={() => void handleAttach(iso.isoId)}
                        disabled={isBusy || isAttached}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {isAttached ? "Mounted" : "Mount"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-5 w-5 text-destructive" />
              Factory Reset / OS Reload
            </CardTitle>
            <CardDescription>Completely wipe and reinstall the operating system</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-sm font-bold text-destructive">Wipe &amp; Reinstall OS</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[280px]">
              Permanently deletes all data on the primary disk and reinstalls the OS. The instance must be powered off.
            </p>

            {reloadInfoQuery.isLoading ? (
              <Skeleton className="h-10 w-full max-w-xs mb-4" />
            ) : osOptions.length > 0 ? (
              <div className="w-full max-w-xs mb-4 text-left space-y-2">
                <Label htmlFor="reload-os">Target operating system</Label>
                <Select value={selectedOsId} onValueChange={setSelectedOsId}>
                  <SelectTrigger id="reload-os">
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {osOptions.map((opt) => {
                      const priceUsd = encodePrice(opt.monthlyPrice);
                      const priceLabel = formatOsPriceLabel(priceUsd);
                      return (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          <span className="flex items-center gap-2">
                            <span>{opt.name ?? `OS ${opt.id}`}</span>
                            <span className={priceUsd > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {priceLabel}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {isPaidOsSelected && selectedOs ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {selectedOs.name} is a licensed OS ({formatOsPriceLabel(selectedOsPriceUsd)}). You will purchase
                    the OS license under VPS hosting, then the reload runs after payment.
                  </p>
                ) : null}
              </div>
            ) : reloadInfo.osName ? (
              <p className="text-xs text-muted-foreground mb-4">
                Current OS: <span className="font-medium">{reloadInfo.osName}</span>
              </p>
            ) : null}

            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => void handleReload()}
              disabled={isBusy || !isPoweredOff || !selectedOsId}
            >
              <RefreshCw className={`h-4 w-4 ${reloadMutation.isPending ? "animate-spin" : ""}`} />
              {isPaidOsSelected ? "Purchase & Reload" : "Initiate Full Reload"}
            </Button>
            {!isPoweredOff && (
              <p className="text-xs text-muted-foreground mt-3">Power off the instance to enable reload.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-muted-foreground" />
            Active Media &amp; Recovery Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center border-t">
          <div className="p-3 rounded-full bg-muted mb-4">
            <Disc className={`h-8 w-8 ${attachedIsoId ? "text-primary" : "text-muted-foreground opacity-20"}`} />
          </div>
          {attachedIsoId ? (
            <>
              <p className="text-sm font-medium">ISO mounted</p>
              <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm">
                {attachedIso?.name ?? attachedIsoId}
                {attachedIso?.description ? ` - ${attachedIso.description}` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Primary boot active</p>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Your instance is set to boot from the primary disk.
              </p>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => void handleDetach()}
            disabled={isBusy || !attachedIsoId}
          >
            <XCircle className="h-4 w-4" />
            Detach Mounted ISO
          </Button>
        </CardContent>
      </Card>

      {reloadPlan ? (
        <BuyNowDialog
          open={reloadBuyOpen}
          onOpenChange={(open) => {
            setReloadBuyOpen(open);
            if (!open) setReloadPlan(null);
          }}
          plan={reloadPlan}
        />
      ) : null}
    </div>
  );
}
