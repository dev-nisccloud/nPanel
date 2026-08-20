"use client";

import { Terminal } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { WpActionSwitch, isPendingField } from "@/components/wordpress/wp-action-switch";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";
import {
  wpDebugSettingsFields,
  wpInstallationFields,
} from "@/components/wordpress/wp-optimistic";

export function WordPressDevelopmentTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const utils = trpc.useUtils();

  const { data: debugSettings, isLoading: debugLoading } =
    trpc.plesk.wpFeatures.getDebugSettings.useQuery({ installationId: id });

  const debugOpt = wpInstallationFields(utils, id, ["debug"]);
  const debugSettingsOpt = wpDebugSettingsFields(utils, id);

  const updateDebug = trpc.plesk.wpFeatures.updateDebugStatus.useMutation({
    onMutate: debugOpt.onMutate,
    onSuccess: () => toast.success("Debug mode updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      debugOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wordpress.getById.invalidate({ id }),
  });

  const updateDebugSettings = trpc.plesk.wpFeatures.updateDebugSettings.useMutation({
    onMutate: debugSettingsOpt.onMutate,
    onSuccess: () => toast.success("Debug settings saved"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      debugSettingsOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wpFeatures.getDebugSettings.invalidate({ installationId: id }),
  });

  const [EnableDebugDialog, confirmEnableDebug] = useConfirm(
    "Enable debug mode?",
    "Debug mode can expose sensitive errors and data to visitors. Only enable this temporarily while troubleshooting.",
  );

  const debugOn = features?.debug?.status ?? false;

  return (
    <>
      <EnableDebugDialog />
      <WpFeatureCard
      title="WordPress debug"
      description="Control WP_DEBUG and related constants. Disable on production when finished troubleshooting."
      icon={Terminal}
      badge={{ label: debugOn ? "On" : "Off", variant: debugOn ? "destructive" : "secondary" }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm">Enable debug mode</Label>
          <WpActionSwitch
            checked={debugOn}
            loading={updateDebug.isPending}
            onCheckedChange={async (val) => {
              if (val) {
                const ok = await confirmEnableDebug();
                if (!ok) return;
              }
              updateDebug.mutate({ installationId: id, status: val });
            }}
          />
        </div>

        {debugOn ? (
          <div className="space-y-3 border-t border-border/60 pt-3">
            {debugLoading ? (
              <Spinner size={20} />
            ) : (
              <>
                {(
                  [
                    ["wpDebug", "WP_DEBUG", debugSettings?.data?.wpDebug],
                    ["wpDebugLog", "Log to debug.log", debugSettings?.data?.wpDebugLog],
                    ["wpDebugDisplay", "Show on screen", debugSettings?.data?.wpDebugDisplay],
                    ["scriptDebug", "Unminified scripts", debugSettings?.data?.scriptDebug],
                    ["saveQueries", "Save DB queries", debugSettings?.data?.saveQueries],
                  ] as const
                ).map(([key, label, checked]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
                    <WpActionSwitch
                      checked={Boolean(checked)}
                      loading={isPendingField(updateDebugSettings, key)}
                      onCheckedChange={(val) =>
                        updateDebugSettings.mutate({ installationId: id, [key]: val })
                      }
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        ) : null}
      </div>
    </WpFeatureCard>
    </>
  );
}
