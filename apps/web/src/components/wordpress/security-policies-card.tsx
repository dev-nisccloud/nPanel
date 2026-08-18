"use client";

import * as React from "react";
import { Loader2, Save, Shield } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

type PolicyState = {
  core: { updateVulnerable: boolean; applyVirtualPatches: boolean };
  plugins: {
    updateVulnerable: boolean;
    deactivateVulnerable: boolean;
    applyVirtualPatches: boolean;
  };
  themes: { updateVulnerable: boolean; applyVirtualPatches: boolean };
};

function PolicyRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function PolicySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SecurityPoliciesCard({
  installationId,
  shell = "card",
  enabled = true,
}: {
  installationId: number;
  shell?: "card" | "panel" | "none";
  enabled?: boolean;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.plesk.wpFeatures.getSecurityPolicies.useQuery(
    { installationId },
    { enabled },
  );

  const policies = data?.data ?? data;
  const [local, setLocal] = React.useState<PolicyState>({
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
    const p = policies as PolicyState;
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

  const setCore = (key: keyof PolicyState["core"], v: boolean) =>
    setLocal((s) => ({ ...s, core: { ...s.core, [key]: v } }));
  const setPlugins = (key: keyof PolicyState["plugins"], v: boolean) =>
    setLocal((s) => ({ ...s, plugins: { ...s.plugins, [key]: v } }));
  const setThemes = (key: keyof PolicyState["themes"], v: boolean) =>
    setLocal((s) => ({ ...s, themes: { ...s.themes, [key]: v } }));

  const content = (
    <>
      <EnablePatchingDialog />
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          <PolicySection title="Core" description="WordPress core vulnerability response">
            <PolicyRow
              label="Auto-update vulnerable core"
              hint="Install a safe core update when a vulnerability is detected"
              checked={local.core.updateVulnerable}
              onChange={(v) => setCore("updateVulnerable", v)}
            />
            <PolicyRow
              label="Virtual patches for core"
              hint="Apply temporary protection until an update is available"
              checked={local.core.applyVirtualPatches}
              onChange={(v) => setCore("applyVirtualPatches", v)}
            />
          </PolicySection>

          <PolicySection title="Plugins" description="Installed plugin vulnerability response">
            <PolicyRow
              label="Auto-update vulnerable plugins"
              hint="Update plugins that have a known security fix"
              checked={local.plugins.updateVulnerable}
              onChange={(v) => setPlugins("updateVulnerable", v)}
            />
            <PolicyRow
              label="Deactivate vulnerable plugins"
              hint="Turn off plugins that cannot be safely updated yet"
              checked={local.plugins.deactivateVulnerable}
              onChange={(v) => setPlugins("deactivateVulnerable", v)}
            />
            <PolicyRow
              label="Virtual patches for plugins"
              hint="Mitigate known plugin issues without removing them"
              checked={local.plugins.applyVirtualPatches}
              onChange={(v) => setPlugins("applyVirtualPatches", v)}
            />
          </PolicySection>

          <PolicySection title="Themes" description="Active and installed theme vulnerability response">
            <PolicyRow
              label="Auto-update vulnerable themes"
              hint="Update themes that have a known security fix"
              checked={local.themes.updateVulnerable}
              onChange={(v) => setThemes("updateVulnerable", v)}
            />
            <PolicyRow
              label="Virtual patches for themes"
              hint="Mitigate known theme issues until an update is applied"
              checked={local.themes.applyVirtualPatches}
              onChange={(v) => setThemes("applyVirtualPatches", v)}
            />
          </PolicySection>

          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={patchMutation.isPending}
              onClick={async () => {
                const ok = await confirmEnablePatching();
                if (!ok) return;
                patchMutation.mutate({ installationId, status: true });
              }}
            >
              {patchMutation.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Enable virtual patching
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ installationId, ...local })}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-2 h-3.5 w-3.5" />
              )}
              Save policies
            </Button>
          </div>
        </div>
      )}
    </>
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
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Security policies
        </CardTitle>
        <CardDescription className="text-xs">
          Automated responses when vulnerabilities are detected
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}
