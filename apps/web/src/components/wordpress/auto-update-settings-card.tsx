"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import { RefreshCw } from "lucide-react";
import { trpc } from "@/utils/trpc";

const defaultSettings = {
  core: "minor" as const,
  safeUpdate: true,
  plugins: {
    forceUpdates: false,
    newlyInstalledUpdates: false,
    updateVulnerable: false,
    deactivateVulnerable: false,
  },
  themes: {
    forceUpdates: false,
    newlyInstalledUpdates: false,
    updateVulnerable: false,
  },
};

export function AutoUpdateSettingsCard({
  installationId,
  shell = "card",
  enabled = true,
}: {
  installationId: number;
  shell?: "card" | "none";
  enabled?: boolean;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.plesk.wpUpdatesSettings.get.useQuery(
    { installationId },
    { enabled },
  );

  const [settings, setSettings] = React.useState(defaultSettings);

  React.useEffect(() => {
    const d = data?.data;
    if (!d) return;
    setSettings({
      core: (d.core as "major" | "minor" | "none") ?? "minor",
      safeUpdate: d.safeUpdate ?? true,
      plugins: {
        forceUpdates: d.plugins?.forceUpdates ?? false,
        newlyInstalledUpdates: d.plugins?.newlyInstalledUpdates ?? false,
        updateVulnerable: d.plugins?.updateVulnerable ?? false,
        deactivateVulnerable: d.plugins?.deactivateVulnerable ?? false,
      },
      themes: {
        forceUpdates: d.themes?.forceUpdates ?? false,
        newlyInstalledUpdates: d.themes?.newlyInstalledUpdates ?? false,
        updateVulnerable: d.themes?.updateVulnerable ?? false,
      },
    });
  }, [data]);

  const updateMutation = trpc.plesk.wpUpdatesSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Auto-update settings saved");
      utils.plesk.wpUpdatesSettings.get.invalidate({ installationId });
      utils.plesk.wordpress.getById.invalidate({ id: installationId });
    },
    onError: (e) => toast.error(e.message),
  });

  const unavailable = data?.data?.available === false;

  const togglePlugin = (key: keyof typeof settings.plugins, val: boolean) => {
    setSettings((s) => ({ ...s, plugins: { ...s.plugins, [key]: val } }));
  };
  const toggleTheme = (key: keyof typeof settings.themes, val: boolean) => {
    setSettings((s) => ({ ...s, themes: { ...s.themes, [key]: val } }));
  };

  const content = isLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  ) : (
    <div className="space-y-4">
      <div className="grid gap-4 @md/main:grid-cols-2">
        <div className="space-y-2">
          <Label>WordPress core</Label>
          <Select
            value={settings.core}
            onValueChange={(v) =>
              setSettings((s) => ({ ...s, core: v as "major" | "minor" | "none" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">Major updates</SelectItem>
              <SelectItem value="minor">Minor updates</SelectItem>
              <SelectItem value="none">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
          <Label className="font-normal">Safe update</Label>
          <Switch
            checked={settings.safeUpdate}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, safeUpdate: v }))}
          />
        </div>
      </div>

      <div className={wpDetailLayout.innerGrid}>
        <div className="space-y-2 rounded-md border border-border/60 p-3">
          <p className="text-sm font-medium">Plugins</p>
          {(
            [
              ["forceUpdates", "Force update all plugins"],
              ["newlyInstalledUpdates", "Auto-update newly installed"],
              ["updateVulnerable", "Update vulnerable plugins"],
              ["deactivateVulnerable", "Deactivate vulnerable plugins"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
              <Switch
                checked={settings.plugins[key]}
                onCheckedChange={(v) => togglePlugin(key, v)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-md border border-border/60 p-3">
          <p className="text-sm font-medium">Themes</p>
          {(
            [
              ["forceUpdates", "Force update all themes"],
              ["newlyInstalledUpdates", "Auto-update newly installed"],
              ["updateVulnerable", "Update vulnerable themes"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
              <Switch
                checked={settings.themes[key]}
                onCheckedChange={(v) => toggleTheme(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        disabled={updateMutation.isPending || unavailable}
        onClick={() => updateMutation.mutate({ installationId, settings })}
      >
        {updateMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save auto-update settings
      </Button>
    </div>
  );

  if (shell === "none") return content;

  return (
    <WpFeatureCard
      title="Automatic updates"
      description="Control how WordPress core, plugins, and themes update on this installation."
      icon={RefreshCw}
      unavailable={unavailable}
    >
      {content}
    </WpFeatureCard>
  );
}
