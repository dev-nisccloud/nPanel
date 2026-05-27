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
  /** Subscription view sheet uses neutral copy without infrastructure vendor names. */
  context?: "hosting" | "subscription";
}

export function HostingSubscriptionSuspendDialog({
  dialog,
  isPending,
  onOpenChange,
  onConfirm,
  context = "hosting",
}: HostingSubscriptionSuspendDialogProps) {
  const isSuspend = dialog.action === "suspend";
  const name = dialog.subscriptionName || `subscription ${dialog.subscriptionId}`;

  const title = isSuspend
    ? context === "subscription"
      ? "Suspend this subscription?"
      : "Suspend hosting subscription?"
    : context === "subscription"
      ? "Reactivate this subscription?"
      : "Reactivate hosting subscription?";

  const description = isSuspend ? (
    context === "subscription" ? (
      <>
        This will suspend <span className="font-medium text-foreground">{name}</span> and disable its
        live services. Websites, email, and other hosting features tied to this subscription will
        stop working until you reactivate it. The subscription record in nPanel will be marked as
        suspended.
      </>
    ) : (
      <>
        This will suspend <span className="font-medium text-foreground">{name}</span> in Plesk.
        Websites, mail, and other services on this subscription will be disabled until you
        reactivate it.
      </>
    )
  ) : context === "subscription" ? (
    <>
      This will reactivate <span className="font-medium text-foreground">{name}</span> and restore
      access to its websites, email, and other hosting services. The subscription record in nPanel
      will be marked as active again.
    </>
  ) : (
    <>
      This will reactivate <span className="font-medium text-foreground">{name}</span> in Plesk and
      restore access to its services.
    </>
  );

  return (
    <AlertDialog open={dialog.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
