"use client";

import { Gauge, Search, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { trpc } from "@/utils/trpc";

export function WordPressPerformanceTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const utils = trpc.useUtils();

  const { data: cronMeta } = trpc.plesk.wpFeatures.getWpCronTakeoverMeta.useQuery({
    installationId: id,
  });
  const cron = cronMeta?.data;

  const invalidate = () => utils.plesk.wordpress.getById.invalidate({ id });

  const toggleIndexing = trpc.plesk.wpFeatures.toggleIndexing.useMutation({
    onSuccess: () => {
      toast.success("Search indexing updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleNginx = trpc.plesk.wpFeatures.toggleNginxCaching.useMutation({
    onSuccess: () => {
      toast.success("Nginx caching updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCron = trpc.plesk.wpFeatures.updateWpCronTakeover.useMutation({
    onSuccess: () => {
      toast.success("WP-Cron takeover updated");
      utils.plesk.wpFeatures.getWpCronTakeoverMeta.invalidate({ installationId: id });
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <WpFeatureCard
        title="Search engine indexing"
        description="When disabled, search engines are discouraged from indexing the site."
        icon={Search}
        badge={{
          label: features?.indexing?.status ? "Indexable" : "Blocked",
          variant: features?.indexing?.status ? "default" : "secondary",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Allow indexing</Label>
          <Switch
            checked={features?.indexing?.status ?? false}
            disabled={toggleIndexing.isPending}
            onCheckedChange={(val) => toggleIndexing.mutate({ installationId: id, status: val })}
          />
        </div>
      </WpFeatureCard>

      <WpFeatureCard
        title="Nginx caching"
        description="Enable nginx-level caching when available on the server."
        icon={Gauge}
        unavailable={features?.nginxCaching?.available === false}
        badge={{
          label: features?.nginxCaching?.status ? "On" : "Off",
          variant: features?.nginxCaching?.status ? "default" : "secondary",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Enable caching</Label>
          <Switch
            checked={features?.nginxCaching?.status ?? false}
            disabled={toggleNginx.isPending || features?.nginxCaching?.available === false}
            onCheckedChange={(val) => toggleNginx.mutate({ installationId: id, status: val })}
          />
        </div>
      </WpFeatureCard>

      <WpFeatureCard
        title="WP-Cron takeover"
        description="Run WordPress cron via the server task scheduler instead of on page load."
        icon={Clock}
        unavailable={cron?.available === false}
        badge={{
          label: cron?.status ? "On" : "Off",
          variant: cron?.status ? "default" : "secondary",
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Takeover enabled</Label>
            <Switch
              checked={cron?.status ?? false}
              disabled={updateCron.isPending || cron?.available === false}
              onCheckedChange={(val) =>
                updateCron.mutate({ installationId: id, status: val })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-normal text-muted-foreground">
              Replace wp-cron.php in web requests
            </Label>
            <Switch
              checked={cron?.taskReplacementStatus ?? false}
              disabled={updateCron.isPending || cron?.available === false}
              onCheckedChange={(val) =>
                updateCron.mutate({ installationId: id, taskReplacementStatus: val })
              }
            />
          </div>
        </div>
      </WpFeatureCard>
    </div>
  );
}
