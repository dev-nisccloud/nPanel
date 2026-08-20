"use client";

import { Gauge, Search, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { WpActionSwitch, isPendingField } from "@/components/wordpress/wp-action-switch";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { trpc } from "@/utils/trpc";
import {
  wpCronMetaFields,
  wpInstallationFields,
} from "@/components/wordpress/wp-optimistic";

export function WordPressPerformanceTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const utils = trpc.useUtils();

  const { data: cronMeta } = trpc.plesk.wpFeatures.getWpCronTakeoverMeta.useQuery({
    installationId: id,
  });
  const cron = cronMeta?.data;

  const indexingOpt = wpInstallationFields(utils, id, ["indexing"]);
  const nginxOpt = wpInstallationFields(utils, id, ["nginxCaching"]);
  const cronOpt = wpCronMetaFields(utils, id);

  const toggleIndexing = trpc.plesk.wpFeatures.toggleIndexing.useMutation({
    onMutate: indexingOpt.onMutate,
    onSuccess: () => toast.success("Search indexing updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      indexingOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wordpress.getById.invalidate({ id }),
  });

  const toggleNginx = trpc.plesk.wpFeatures.toggleNginxCaching.useMutation({
    onMutate: nginxOpt.onMutate,
    onSuccess: () => toast.success("Nginx caching updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      nginxOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wordpress.getById.invalidate({ id }),
  });

  const updateCron = trpc.plesk.wpFeatures.updateWpCronTakeover.useMutation({
    onMutate: cronOpt.onMutate,
    onSuccess: () => toast.success("WP-Cron takeover updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      cronOpt.rollback(ctx);
    },
    onSettled: () => {
      utils.plesk.wpFeatures.getWpCronTakeoverMeta.invalidate({ installationId: id });
      utils.plesk.wordpress.getById.invalidate({ id });
    },
  });

  return (
    <>
      <WpFeatureCard
        title="Search engine indexing"
        description="When disabled, search engines are discouraged from indexing the site."
        icon={Search}
        badge={{
          label: features?.indexing?.status ? "Indexable" : "Blocked",
          variant: features?.indexing?.status ? "default" : "secondary",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm">Allow indexing</Label>
          <WpActionSwitch
            checked={features?.indexing?.status ?? false}
            loading={toggleIndexing.isPending}
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
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm">Enable caching</Label>
          <WpActionSwitch
            checked={features?.nginxCaching?.status ?? false}
            disabled={features?.nginxCaching?.available === false}
            loading={toggleNginx.isPending}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Takeover enabled</Label>
            <WpActionSwitch
              checked={cron?.status ?? false}
              disabled={cron?.available === false}
              loading={isPendingField(updateCron, "status")}
              onCheckedChange={(val) => updateCron.mutate({ installationId: id, status: val })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-normal text-muted-foreground">
              Replace wp-cron.php in web requests
            </Label>
            <WpActionSwitch
              checked={cron?.taskReplacementStatus ?? false}
              disabled={cron?.available === false}
              loading={isPendingField(updateCron, "taskReplacementStatus")}
              onCheckedChange={(val) =>
                updateCron.mutate({ installationId: id, taskReplacementStatus: val })
              }
            />
          </div>
        </div>
      </WpFeatureCard>
    </>
  );
}
