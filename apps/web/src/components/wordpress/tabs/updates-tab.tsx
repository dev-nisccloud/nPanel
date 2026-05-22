"use client";

import * as React from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { AutoUpdateSettingsCard } from "@/components/wordpress/auto-update-settings-card";
import { UpdatesCheckerCard } from "@/components/wordpress/updates-checker-card";
import { SmartUpdateResultCard } from "@/components/wordpress/smart-update-result-card";
import { SmartPhpUpdateCard } from "@/components/wordpress/smart-php-update-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { trpc } from "@/utils/trpc";
import type { z } from "zod";
import type { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";

export function WordPressUpdatesTab({
  installationId,
  wpData,
}: {
  installationId: string;
  wpData: z.infer<typeof wordpressInstallationSchema>;
}) {
  const { id } = useWpInstallationSummary(installationId);
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const utils = trpc.useUtils();

  const smart = wpData.features?.updates?.smart;
  const smartPhp = wpData.features?.updates?.php;

  const toggleSmart = trpc.plesk.wpFeatures.toggleSmartUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart Update setting saved");
      utils.plesk.wordpress.getById.invalidate({ id });
    },
    onError: (e) => toast.error(e.message),
  });

  const runSmartUpdate = trpc.plesk.wpFeatures.applySmartUpdate.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Smart Update started");
      utils.plesk.wpFeatures.getSmartUpdateResult.invalidate({ installationId: id });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {taskUrl ? (
        <WpTaskProgress
          taskUrl={taskUrl}
          onComplete={() => {
            utils.plesk.wordpress.getById.invalidate({ id });
            utils.plesk.wpFeatures.getSmartUpdateResult.invalidate({ installationId: id });
            setTaskUrl(null);
          }}
          onDismiss={() => setTaskUrl(null)}
        />
      ) : null}

      <UpdatesCheckerCard installationId={id} />

      <WpFeatureCard
        title="Smart Update"
        description="Test updates on a clone before applying them to your live site."
        icon={Sparkles}
        badge={{
          label: smart?.status ? "Enabled" : "Disabled",
          variant: smart?.status ? "default" : "secondary",
        }}
        unavailable={smart?.available === false}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Enable Smart Update</Label>
            <Switch
              checked={smart?.status ?? false}
              disabled={toggleSmart.isPending || smart?.available === false}
              onCheckedChange={(val) => toggleSmart.mutate({ installationId: id, status: val })}
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={runSmartUpdate.isPending}
            onClick={() => runSmartUpdate.mutate({ installationId: id })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Smart Update test
          </Button>
        </div>
      </WpFeatureCard>

      <SmartUpdateResultCard
        installationId={id}
        enabled={Boolean(smart?.applicable ?? smart?.available)}
      />

      <SmartPhpUpdateCard installationId={id} available={smartPhp?.available} />

      <AutoUpdateSettingsCard installationId={id} />
    </div>
  );
}
