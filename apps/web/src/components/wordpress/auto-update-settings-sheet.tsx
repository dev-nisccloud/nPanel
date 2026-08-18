"use client";

import { RefreshCw } from "lucide-react";
import { AutoUpdateSettingsCard } from "@/components/wordpress/auto-update-settings-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";

export function AutoUpdateSettingsSheet({
  open,
  onOpenChange,
  installationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
}) {
  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Automatic updates"
      description="How core, plugins, and themes update on this installation"
      icon={RefreshCw}
    >
      <AutoUpdateSettingsCard installationId={installationId} shell="none" enabled={open} />
    </WpManageSheet>
  );
}
