"use client";

import * as React from "react";
import { Search, Package, Palette } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { trpc } from "@/utils/trpc";

type UpdateInfo = {
  id?: number;
  core?: { version?: string; availableVersion?: string };
  plugins?: Array<{ title?: string; availableVersion?: string }>;
  themes?: Array<{ title?: string; availableVersion?: string }>;
};

export function UpdatesCheckerCard({
  installationId,
  shell = "card",
}: {
  installationId: number;
  shell?: "card" | "none";
}) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data, refetch, isFetching } = trpc.plesk.wpFeatures.getUpdatesChecker.useQuery({
    installationId,
  });

  const startCheck = trpc.plesk.wpFeatures.startUpdatesCheck.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) setTaskUrl(url);
      toast.success("Checking for updates");
    },
    onError: (e) => toast.error(e.message),
  });

  const info: UpdateInfo | null = Array.isArray(data?.data)
    ? (data.data[0] as UpdateInfo)
    : Array.isArray(data)
      ? (data[0] as UpdateInfo)
      : null;

  const checking = startCheck.isPending || isFetching || Boolean(taskUrl);

  const pluginCount = info?.plugins?.filter((p) => p.availableVersion)?.length ?? 0;
  const themeCount = info?.themes?.filter((t) => t.availableVersion)?.length ?? 0;
  const coreUpdate = info?.core?.availableVersion;

  const content = (
    <div className="space-y-3">
        {taskUrl ? (
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              void refetch();
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={checking}
          onClick={() => startCheck.mutate({ installationId })}
        >
          {checking ? (
            <Spinner size={16} className="mr-2" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {checking ? "Checking…" : "Check for updates"}
        </Button>

        {info ? (
          <div className="rounded-lg border border-border/60 divide-y divide-border/60 text-sm">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="text-muted-foreground">WordPress core</span>
              {coreUpdate ? (
                <Badge variant="secondary">
                  {info.core?.version} → {coreUpdate}
                </Badge>
              ) : (
                <Badge variant="outline">Up to date</Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Plugins
              </span>
              <Badge variant={pluginCount ? "default" : "outline"}>{pluginCount} updates</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Palette className="h-3.5 w-3.5" /> Themes
              </span>
              <Badge variant={themeCount ? "default" : "outline"}>{themeCount} updates</Badge>
            </div>
          </div>
        ) : null}
      </div>
  );

  if (shell === "none") return content;

  return (
    <WpFeatureCard
      title="Available updates"
      description="Scan this installation for WordPress core, plugin, and theme updates."
      icon={Search}
    >
      {content}
    </WpFeatureCard>
  );
}
