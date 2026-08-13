"use client";

import * as React from "react";
import { RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { AutoUpdateSettingsCard } from "@/components/wordpress/auto-update-settings-card";
import { UpdatesCheckerCard } from "@/components/wordpress/updates-checker-card";
import { SmartUpdateResultCard } from "@/components/wordpress/smart-update-result-card";
import { SmartPhpUpdateCard } from "@/components/wordpress/smart-php-update-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { useConfirm } from "@/hooks/use-confirm";
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

  const [RunSmartUpdateDialog, confirmRunSmartUpdate] = useConfirm(
    "Run Smart Update test?",
    "This creates a clone of your site and tests available updates before applying them to production. The test may take several minutes.",
  );

  return (
    <div className="space-y-6">
      <RunSmartUpdateDialog />
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

      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4 text-muted-foreground" />
            Available updates
          </CardTitle>
          <CardDescription className="text-xs">
            Scan for WordPress core, plugin, and theme updates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <UpdatesCheckerCard installationId={id} shell="none" />
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Smart updates
          </CardTitle>
          <CardDescription className="text-xs">
            Test updates on a clone before applying to your live site
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">Smart Update</p>
                  <p className="text-xs text-muted-foreground">Enable and run clone tests</p>
                </div>
                <Badge variant={smart?.status ? "default" : "secondary"} className="text-xs">
                  {smart?.status ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Enable</Label>
                  <Switch
                    checked={smart?.status ?? false}
                    disabled={toggleSmart.isPending || smart?.available === false}
                    onCheckedChange={(val) =>
                      toggleSmart.mutate({ installationId: id, status: val })
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={runSmartUpdate.isPending || smart?.available === false}
                  onClick={async () => {
                    const ok = await confirmRunSmartUpdate();
                    if (!ok) return;
                    runSmartUpdate.mutate({ installationId: id });
                  }}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Run test
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-4">
                <SmartUpdateResultCard
                  installationId={id}
                  enabled={Boolean(smart?.applicable ?? smart?.available)}
                  shell="none"
                />
              </div>
              <div className="p-4">
                <SmartPhpUpdateCard
                  installationId={id}
                  available={smartPhp?.available}
                  shell="none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Automatic updates
          </CardTitle>
          <CardDescription className="text-xs">
            How core, plugins, and themes update automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <AutoUpdateSettingsCard installationId={id} shell="none" />
        </CardContent>
      </Card>
    </div>
  );
}
