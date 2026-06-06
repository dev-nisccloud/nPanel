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
import type { VpsSuspendDialogState } from "./use-vps-instance-suspend";

interface VpsInstanceSuspendDialogProps {
  dialog: VpsSuspendDialogState;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function VpsInstanceSuspendDialog({
  dialog,
  isPending,
  onOpenChange,
  onConfirm,
}: VpsInstanceSuspendDialogProps) {
  const isSuspend = dialog.action === "suspend";
  const name = dialog.instanceName || "this instance";

  return (
    <AlertDialog open={dialog.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSuspend ? "Suspend customer access?" : "Restore customer access?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              {isSuspend ? (
                <>
                  The customer will lose portal access to{" "}
                  <span className="font-medium text-foreground">{name}</span> and the VPS will be
                  powered off. You will still have full access.
                </>
              ) : (
                <>
                  The customer will regain portal access to{" "}
                  <span className="font-medium text-foreground">{name}</span> and the VPS will be
                  powered on if it was shut down during suspension.
                </>
              )}
            </p>
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
            className={
              isSuspend ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
            }
          >
            {isPending ? (
              <>
                <Spinner size={16} className="mr-2" />
                {isSuspend ? "Suspending…" : "Restoring…"}
              </>
            ) : isSuspend ? (
              "Suspend & power off"
            ) : (
              "Restore access"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
