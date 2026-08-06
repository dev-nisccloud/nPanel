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

interface RevokeApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeyId: string;
  keyName: string;
  keyPrefix: string;
  onSuccess?: () => void;
}

export function RevokeApiKeyDialog({
  open,
  onOpenChange,
  apiKeyId,
  keyName,
  keyPrefix,
  onSuccess,
}: RevokeApiKeyDialogProps) {
  const revokeMutation = trpc.niscPaymentGateway.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast.success("API key revoked successfully");
      captureEvent("payment_gateway_api_key_revoked");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke API key");
    },
  });

  const handleRevoke = () => {
    revokeMutation.mutate({ id: apiKeyId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke this API key?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Warning:</strong> Revoking this API key will immediately stop all requests using it.
              This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Key Name:</span>
              <span className="font-medium">{keyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Key Prefix:</span>
              <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{keyPrefix}***</code>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Any application or service using this key will receive authentication errors.
            You can generate a new key if needed.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={revokeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
          >
            {revokeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Revoke API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
