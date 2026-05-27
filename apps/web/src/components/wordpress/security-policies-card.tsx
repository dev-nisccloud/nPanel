"use client";

import * as React from "react";
import { Shield } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

export function SecurityPoliciesCard({
  installationId,
  shell = "card",
}: {
  installationId: number;
  shell?: "card" | "panel" | "none";
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.plesk.wpFeatures.getSecurityPolicies.useQuery({
    installationId,
  });

  const policies = data?.data ?? data;
  const [local, setLocal] = React.useState({
    core: { updateVulnerable: false, applyVirtualPatches: false },
    plugins: {
      updateVulnerable: false,
      deactivateVulnerable: false,
      applyVirtualPatches: false,
    },
    themes: { updateVulnerable: false, applyVirtualPatches: false },
  });

  React.useEffect(() => {
    if (!policies || typeof policies !== "object") return;
    const p = policies as typeof local;
    setLocal({
      core: {
        updateVulnerable: p.core?.updateVulnerable ?? false,
        applyVirtualPatches: p.core?.applyVirtualPatches ?? false,
      },
      plugins: {
        updateVulnerable: p.plugins?.updateVulnerable ?? false,
        deactivateVulnerable: p.plugins?.deactivateVulnerable ?? false,
        applyVirtualPatches: p.plugins?.applyVirtualPatches ?? false,
      },
      themes: {
        updateVulnerable: p.themes?.updateVulnerable ?? false,
        applyVirtualPatches: p.themes?.applyVirtualPatches ?? false,
      },
    });
  }, [policies]);

  const updateMutation = trpc.plesk.wpFeatures.updateSecurityPolicies.useMutation({
    onSuccess: () => {
      toast.success("Security policies saved");
      utils.plesk.wpFeatures.getSecurityPolicies.invalidate({ installationId });
    },
    onError: (e) => toast.error(e.message),
  });

  const patchMutation = trpc.plesk.wpFeatures.applyVirtualPatches.useMutation({
    onSuccess: (res) => {
      const url = (res as { url?: string })?.url;
      if (url) toast.success("Virtual patch task started");
      else toast.success("Virtual patching updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const [EnablePatchingDialog, confirmEnablePatching] = useConfirm(
    "Enable virtual patching?",
    "Virtual patches will be applied to vulnerable core, plugins, and themes. This modifies how WordPress handles known vulnerabilities and may affect site behavior.",
  );

  const setCore = (key: keyof typeof local.core, v: boolean) =>
    setLocal((s) => ({ ...s, core: { ...s.core, [key]: v } }));
  const setPlugins = (key: keyof typeof local.plugins, v: boolean) =>
    setLocal((s) => ({ ...s, plugins: { ...s.plugins, [key]: v } }));
  const setThemes = (key: keyof typeof local.themes, v: boolean) =>
    setLocal((s) => ({ ...s, themes: { ...s.themes, [key]: v } }));

  const content = isLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  ) : (
    <div className="space-y-4">
      <EnablePatchingDialog />
      <div className={wpDetailLayout.innerGridThree}>
        <PolicyGroup title="Core">
            <PolicySwitch
              label="Update vulnerable core"
              checked={local.core.updateVulnerable}
              onChange={(v) => setCore("updateVulnerable", v)}
            />
            <PolicySwitch
              label="Apply virtual patches (core)"
              checked={local.core.applyVirtualPatches}
              onChange={(v) => setCore("applyVirtualPatches", v)}
            />
          </PolicyGroup>
          <PolicyGroup title="Plugins">
            <PolicySwitch
              label="Update vulnerable plugins"
              checked={local.plugins.updateVulnerable}
              onChange={(v) => setPlugins("updateVulnerable", v)}
            />
            <PolicySwitch
              label="Deactivate vulnerable plugins"
              checked={local.plugins.deactivateVulnerable}
              onChange={(v) => setPlugins("deactivateVulnerable", v)}
            />
            <PolicySwitch
              label="Apply virtual patches (plugins)"
              checked={local.plugins.applyVirtualPatches}
              onChange={(v) => setPlugins("applyVirtualPatches", v)}
            />
          </PolicyGroup>
          <PolicyGroup title="Themes">
            <PolicySwitch
              label="Update vulnerable themes"
              checked={local.themes.updateVulnerable}
              onChange={(v) => setThemes("updateVulnerable", v)}
            />
            <PolicySwitch
              label="Apply virtual patches (themes)"
              checked={local.themes.applyVirtualPatches}
              onChange={(v) => setThemes("applyVirtualPatches", v)}
            />
          </PolicyGroup>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ installationId, ...local })}
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save policies
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={patchMutation.isPending}
          onClick={async () => {
            const ok = await confirmEnablePatching();
            if (!ok) return;
            patchMutation.mutate({ installationId, status: true });
          }}
        >
          Enable virtual patching
        </Button>
      </div>
    </div>
  );

  if (shell === "none") return content;
  if (shell === "panel") {
    return (
      <WpPanel title="Automated policies" description="Responses when issues are detected">
        {content}
      </WpPanel>
    );
  }

  return (
    <WpFeatureCard
      title="Vulnerability policies"
      description="Automated responses when vulnerabilities are detected on this site."
      icon={Shield}
    >
      {content}
    </WpFeatureCard>
  );
}

function PolicyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="space-y-2 rounded-lg border border-border/60 p-3">{children}</div>
    </div>
  );
}

function PolicySwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
