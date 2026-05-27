import * as React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

export type HostingSuspendDialogAction = "suspend" | "unsuspend";

export interface HostingSuspendDialogState {
  open: boolean;
  action: HostingSuspendDialogAction;
  subscriptionId: number;
  subscriptionName: string;
}

const closedDialog: HostingSuspendDialogState = {
  open: false,
  action: "suspend",
  subscriptionId: 0,
  subscriptionName: "",
};

export function useHostingSubscriptionSuspend(options?: {
  onSuccess?: (params: { action: HostingSuspendDialogAction; pleskSubscriptionId: number }) => void;
}) {
  const utils = trpc.useUtils();
  const [dialog, setDialog] = React.useState<HostingSuspendDialogState>(closedDialog);
  const pendingActionRef = React.useRef<HostingSuspendDialogAction>("suspend");

  const invalidateSubscriptions = React.useCallback(() => {
    void utils.plesk.subscriptions.getAll.invalidate();
    void utils.hosting.getDetailWithSubscription.invalidate();
  }, [utils]);

  const suspendMutation = trpc.plesk.subscriptionsSuspend.suspend.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Hosting subscription suspended");
      setDialog(closedDialog);
      invalidateSubscriptions();
      void utils.hosting.getDetailWithSubscription.invalidate({
        subscriptionId: String(variables.id),
      });
      options?.onSuccess?.({
        action: pendingActionRef.current,
        pleskSubscriptionId: variables.id,
      });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to suspend subscription");
    },
  });

  const unsuspendMutation = trpc.plesk.subscriptionsSuspend.unsuspend.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Hosting subscription reactivated");
      setDialog(closedDialog);
      invalidateSubscriptions();
      void utils.hosting.getDetailWithSubscription.invalidate({
        subscriptionId: String(variables.id),
      });
      options?.onSuccess?.({
        action: pendingActionRef.current,
        pleskSubscriptionId: variables.id,
      });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reactivate subscription");
    },
  });

  const isPending = suspendMutation.isPending || unsuspendMutation.isPending;

  const requestSuspend = React.useCallback((subscriptionId: number, subscriptionName: string) => {
    setDialog({
      open: true,
      action: "suspend",
      subscriptionId,
      subscriptionName,
    });
  }, []);

  const requestUnsuspend = React.useCallback((subscriptionId: number, subscriptionName: string) => {
    setDialog({
      open: true,
      action: "unsuspend",
      subscriptionId,
      subscriptionName,
    });
  }, []);

  const setDialogOpen = React.useCallback((open: boolean) => {
    if (!open) {
      setDialog(closedDialog);
    }
  }, []);

  const confirm = React.useCallback(() => {
    if (!dialog.subscriptionId) return;

    pendingActionRef.current = dialog.action;
    if (dialog.action === "suspend") {
      suspendMutation.mutate({ id: dialog.subscriptionId });
    } else {
      unsuspendMutation.mutate({ id: dialog.subscriptionId });
    }
  }, [dialog, suspendMutation, unsuspendMutation]);

  return {
    dialog,
    isPending,
    requestSuspend,
    requestUnsuspend,
    setDialogOpen,
    confirm,
  };
}
