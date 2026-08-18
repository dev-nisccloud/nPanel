"use client";

import { AlertTriangle } from "lucide-react";
import { VulnerabilitiesCard } from "@/components/wordpress/vulnerabilities-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";

export function VulnerabilitiesSheet({
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
      title="Vulnerabilities"
      description="Scan WordPress core, plugins, and themes for known security issues"
      icon={AlertTriangle}
    >
      <VulnerabilitiesCard installationId={installationId} shell="none" enabled={open} />
    </WpManageSheet>
  );
}
