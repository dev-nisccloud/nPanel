"use client";

import * as React from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export type VpsSuspendDialogAction = "suspend" | "reactivate";

export interface VpsSuspendDialogState {
  open: boolean;
  action: VpsSuspendDialogAction;
  subscriptionId: string;
  instanceName: string;
}

const closedDialog: VpsSuspendDialogState = {
  open: false,
  action: "suspend",
  subscriptionId: "",
  instanceName: "",
};

export function useVpsInstanceSuspend(deviceId: number) {
  const utils = trpc.useUtils();
  const [dialog, setDialog] = React.useState<VpsSuspendDialogState>(closedDialog);

  const invalidateAfterStatusChange = React.useCallback(() => {
    void utils.clientSubscriptions.getHasLinkedSubscriptionByHivelocityDeviceId.invalidate({
      hivelocityDeviceId: deviceId,
    });
    void utils.clientSubscriptions.listForAgency.invalidate();
    void utils.hivelocity.getDeviceDetails.invalidate({ deviceId });
    void utils.hivelocity.getVpsDetails.invalidate({ deviceId });
    void utils.hivelocity.getDevicePowerStatus.invalidate({ deviceId });
  }, [utils, deviceId]);

  const suspendMutation = trpc.hivelocity.suspendVpsInstance.useMutation({
    onSuccess: (result) => {
      const poweredOff = result.data?.upstreamPoweredOff;
      toast.success(
        poweredOff
          ? "Customer access suspended. VPS powered off."
          : "Customer access suspended.",
      );
      setDialog(closedDialog);
      invalidateAfterStatusChange();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to suspend VPS instance");
    },
  });

  const reactivateMutation = trpc.hivelocity.reactivateVpsInstance.useMutation({
    onSuccess: (result) => {
      const poweredOn = result.data?.upstreamPoweredOn;
      toast.success(
        poweredOn ? "Customer access restored. VPS powered on." : "Customer access restored.",
      );
      setDialog(closedDialog);
      invalidateAfterStatusChange();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reactivate VPS instance");
    },
  });

  const requestSuspend = React.useCallback((subscriptionId: string, instanceName: string) => {
    setDialog({
      open: true,
      action: "suspend",
      subscriptionId,
      instanceName,
    });
  }, []);

  const requestReactivate = React.useCallback((subscriptionId: string, instanceName: string) => {
    setDialog({
      open: true,
      action: "reactivate",
      subscriptionId,
      instanceName,
    });
  }, []);

  const setDialogOpen = React.useCallback((open: boolean) => {
    if (!open) setDialog(closedDialog);
  }, []);

  const confirm = React.useCallback(() => {
    if (!dialog.subscriptionId) return;

    if (dialog.action === "suspend") {
      suspendMutation.mutate({
        deviceId,
        subscriptionId: dialog.subscriptionId,
      });
    } else {
      reactivateMutation.mutate({
        deviceId,
        subscriptionId: dialog.subscriptionId,
      });
    }
  }, [dialog, deviceId, suspendMutation, reactivateMutation]);

  return {
    dialog,
    isPending: suspendMutation.isPending || reactivateMutation.isPending,
    requestSuspend,
    requestReactivate,
    setDialogOpen,
    confirm,
  };
}
