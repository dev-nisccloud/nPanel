"use client";

import { Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartPhpUpdateCard } from "@/components/wordpress/smart-php-update-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";

export function PhpDetailsSheet({
  open,
  onOpenChange,
  installationId,
  version,
  status,
  eoled,
  unsupported,
  phpSmartAvailable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
  version: string;
  status: string;
  eoled?: boolean;
  unsupported?: boolean;
  phpSmartAvailable?: boolean;
}) {
  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="PHP"
      description="Runtime version and Smart PHP update tests"
      icon={Cpu}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-primary">Current version</p>
          <p className="text-xs text-muted-foreground">{version}</p>
        </div>
        <Badge
          variant={eoled ? "destructive" : unsupported ? "secondary" : "outline"}
          className={
            !eoled && !unsupported
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : undefined
          }
        >
          {status}
        </Badge>
      </div>
      <SmartPhpUpdateCard
        installationId={installationId}
        available={phpSmartAvailable}
        shell="none"
      />
    </WpManageSheet>
  );
}
