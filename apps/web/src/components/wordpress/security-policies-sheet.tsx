"use client";

import { Shield } from "lucide-react";
import { SecurityPoliciesCard } from "@/components/wordpress/security-policies-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";

export function SecurityPoliciesSheet({
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
      title="Security policies"
      description="Choose what happens automatically when a vulnerability is detected"
      icon={Shield}
    >
      <SecurityPoliciesCard installationId={installationId} shell="none" enabled={open} />
    </WpManageSheet>
  );
}
