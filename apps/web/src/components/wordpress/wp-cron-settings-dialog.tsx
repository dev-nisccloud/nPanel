"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WpCronSettingsDialog({
  open,
  onOpenChange,
  takeoverEnabled,
  replacementEnabled,
  disabled,
  onTakeoverChange,
  onReplacementChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  takeoverEnabled: boolean;
  replacementEnabled: boolean;
  disabled?: boolean;
  onTakeoverChange: (value: boolean) => void;
  onReplacementChange: (value: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>WP-Cron takeover</DialogTitle>
          <DialogDescription>
            Run WordPress cron via the server scheduler instead of on page load.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <Label className="text-sm font-medium text-primary">Takeover enabled</Label>
            <Switch
              checked={takeoverEnabled}
              disabled={disabled}
              onCheckedChange={onTakeoverChange}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <div className="min-w-0">
              <Label className="text-sm font-medium text-primary">Replace wp-cron.php</Label>
              <p className="text-xs text-muted-foreground">
                Skip wp-cron.php during web requests
              </p>
            </div>
            <Switch
              checked={replacementEnabled}
              disabled={disabled}
              onCheckedChange={onReplacementChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
