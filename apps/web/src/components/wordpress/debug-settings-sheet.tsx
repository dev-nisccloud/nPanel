"use client";

import { Terminal } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";
import { trpc } from "@/utils/trpc";

export function DebugSettingsSheet({
  open,
  onOpenChange,
  installationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
}) {
  const utils = trpc.useUtils();
  const { data: debugSettings, isLoading } = trpc.plesk.wpFeatures.getDebugSettings.useQuery(
    { installationId },
    { enabled: open },
  );

  const updateDebugSettings = trpc.plesk.wpFeatures.updateDebugSettings.useMutation({
    onSuccess: () => {
      toast.success("Debug settings saved");
      utils.plesk.wpFeatures.getDebugSettings.invalidate({ installationId });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Debugging"
      description="WP_DEBUG constants for this installation"
      icon={Terminal}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {(
          [
            ["wpDebug", "WP_DEBUG", debugSettings?.data?.wpDebug],
            ["wpDebugLog", "Log to debug.log", debugSettings?.data?.wpDebugLog],
            ["wpDebugDisplay", "Show errors on screen", debugSettings?.data?.wpDebugDisplay],
            ["scriptDebug", "Unminified scripts", debugSettings?.data?.scriptDebug],
            ["saveQueries", "Save database queries", debugSettings?.data?.saveQueries],
          ] as const
        ).map(([key, label, checked]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
          >
            <Label className="text-sm font-medium text-primary">{label}</Label>
            <Switch
              checked={Boolean(checked)}
              disabled={updateDebugSettings.isPending}
              onCheckedChange={(val) =>
                updateDebugSettings.mutate({ installationId, [key]: val })
              }
            />
          </div>
        ))}
      </div>
    </WpManageSheet>
  );
}
