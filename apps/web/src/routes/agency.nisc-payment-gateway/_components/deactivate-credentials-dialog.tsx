"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/utils/trpc";

interface DeactivateCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
  provider: string;
  environment: string;
  onSuccess?: () => void;
}

export function DeactivateCredentialsDialog({
  open,
  onOpenChange,
  credentialId,
  provider,
  environment,
  onSuccess,
}: DeactivateCredentialsDialogProps) {
  const deactivateMutation = trpc.niscPaymentGateway.credentials.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Credentials deactivated successfully");
      captureEvent("payment_gateway_credentials_deactivated");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deactivate credentials");
    },
  });

  const handleDeactivate = () => {
    deactivateMutation.mutate({ id: credentialId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Credentials</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate these payment credentials?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Warning:</strong> Deactivating these credentials will prevent any new payment requests from being processed using this payment method.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <span className="font-medium">{environment}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Existing transactions will not be affected, but no new payments can be initiated with these credentials.
            You can reactivate them later if needed.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deactivateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Deactivate Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
