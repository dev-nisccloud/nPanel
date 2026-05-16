"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import type { HostingSuspendDialogState } from "./use-hosting-subscription-suspend";

interface HostingSubscriptionSuspendDialogProps {
  dialog: HostingSuspendDialogState;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function HostingSubscriptionSuspendDialog({
  dialog,
  isPending,
  onOpenChange,
  onConfirm,
}: HostingSubscriptionSuspendDialogProps) {
  const isSuspend = dialog.action === "suspend";
  const name = dialog.subscriptionName || `subscription ${dialog.subscriptionId}`;

  return (
    <AlertDialog open={dialog.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSuspend ? "Suspend hosting subscription?" : "Reactivate hosting subscription?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSuspend ? (
              <>
                This will suspend <span className="font-medium text-foreground">{name}</span> in Plesk.
                Websites, mail, and other services on this subscription will be disabled until you
                reactivate it.
              </>
            ) : (
              <>
                This will reactivate <span className="font-medium text-foreground">{name}</span> in
                Plesk and restore access to its services.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={isSuspend ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isPending ? (
              <>
                <Spinner size={16} className="mr-2" />
                {isSuspend ? "Suspending…" : "Reactivating…"}
              </>
            ) : isSuspend ? (
              "Suspend"
            ) : (
              "Reactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
