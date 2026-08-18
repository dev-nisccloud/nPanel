"use client";

import * as React from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SmartPhpUpdateCard } from "@/components/wordpress/smart-php-update-card";
import { SmartUpdateResultCard } from "@/components/wordpress/smart-update-result-card";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

export function SmartUpdatesSheet({
  open,
  onOpenChange,
  installationId,
  smartEnabled,
  smartAvailable,
  phpAvailable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
  smartEnabled?: boolean;
  smartAvailable?: boolean;
  phpAvailable?: boolean;
}) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const utils = trpc.useUtils();

  const toggleSmart = trpc.plesk.wpFeatures.toggleSmartUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart Update setting saved");
      utils.plesk.wordpress.getById.invalidate({ id: installationId });
    },
    onError: (e) => toast.error(e.message),
  });

  const runSmartUpdate = trpc.plesk.wpFeatures.applySmartUpdate.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Smart Update started");
      utils.plesk.wpFeatures.getSmartUpdateResult.invalidate({ installationId });
    },
    onError: (e) => toast.error(e.message),
  });

  const [RunSmartUpdateDialog, confirmRunSmartUpdate] = useConfirm(
    "Run Smart Update test?",
    "This creates a clone of your site and tests available updates before applying them to production. The test may take several minutes.",
  );

  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Smart updates"
      description="Test updates on a clone before applying them to the live site"
      icon={Sparkles}
    >
      <RunSmartUpdateDialog />
      {taskUrl ? (
        <WpTaskProgress
          taskUrl={taskUrl}
          onComplete={() => {
            utils.plesk.wordpress.getById.invalidate({ id: installationId });
            utils.plesk.wpFeatures.getSmartUpdateResult.invalidate({ installationId });
            setTaskUrl(null);
          }}
          onDismiss={() => setTaskUrl(null)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Smart Update</p>
          <p className="text-xs text-muted-foreground">Enable clone tests before live updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={smartEnabled ? "default" : "secondary"} className="text-xs">
            {smartEnabled ? "Enabled" : "Disabled"}
          </Badge>
          <Label className="text-xs text-muted-foreground">Enable</Label>
          <Switch
            checked={smartEnabled ?? false}
            disabled={toggleSmart.isPending || smartAvailable === false}
            onCheckedChange={(val) =>
              toggleSmart.mutate({ installationId, status: val })
            }
          />
          <Button
            type="button"
            size="sm"
            className="h-7 px-2.5 text-xs"
            disabled={runSmartUpdate.isPending || smartAvailable === false}
            onClick={async () => {
              const ok = await confirmRunSmartUpdate();
              if (!ok) return;
              runSmartUpdate.mutate({ installationId });
            }}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Run test
          </Button>
        </div>
      </div>

      <SmartUpdateResultCard
        installationId={installationId}
        enabled={open && smartAvailable !== false}
        shell="none"
      />
      <SmartPhpUpdateCard
        installationId={installationId}
        available={phpAvailable}
        shell="none"
      />
    </WpManageSheet>
  );
}
