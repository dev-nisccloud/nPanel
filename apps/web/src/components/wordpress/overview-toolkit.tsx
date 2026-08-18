"use client";

import * as React from "react";
import {
  Gauge,
  RefreshCw,
  Shield,
  Wrench,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoUpdateSettingsSheet } from "@/components/wordpress/auto-update-settings-sheet";
import { WordPressBackupsSheet } from "@/components/wordpress/backups-sheet";
import { DebugSettingsSheet } from "@/components/wordpress/debug-settings-sheet";
import { HotlinkProtectionSheet } from "@/components/wordpress/hotlink-protection-sheet";
import { IntegrityHardeningSheet } from "@/components/wordpress/integrity-hardening-sheet";
import { OverviewFeatureRow } from "@/components/wordpress/overview-feature-row";
import { PasswordProtectionDialog } from "@/components/wordpress/password-protection-dialog";
import { PhpDetailsSheet } from "@/components/wordpress/php-details-sheet";
import { SecurityPoliciesSheet } from "@/components/wordpress/security-policies-sheet";
import { SmartUpdatesSheet } from "@/components/wordpress/smart-updates-sheet";
import { VulnerabilitiesSheet } from "@/components/wordpress/vulnerabilities-sheet";
import { WpCronSettingsDialog } from "@/components/wordpress/wp-cron-settings-dialog";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { MaintenanceModeDialog } from "@/routes/$slug.wordpress/_components/maintenance-mode-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";
import type { z } from "zod";
import type { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";

function ToolkitCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">{children}</CardContent>
    </Card>
  );
}

export function WordPressOverviewToolkit({
  wpData,
  onNavigateToTab,
}: {
  wpData: z.infer<typeof wordpressInstallationSchema>;
  onNavigateToTab?: (tab: string) => void;
}) {
  const installationId = Number(wpData.id);
  const { features } = useWpInstallationSummary(String(wpData.id));
  const f = features ?? wpData.features;
  const utils = trpc.useUtils();

  const [autoUpdatesOpen, setAutoUpdatesOpen] = React.useState(false);
  const [smartOpen, setSmartOpen] = React.useState(false);
  const [phpOpen, setPhpOpen] = React.useState(false);
  const [debugOpen, setDebugOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);
  const [backupsOpen, setBackupsOpen] = React.useState(false);
  const [vulnsOpen, setVulnsOpen] = React.useState(false);
  const [integrityOpen, setIntegrityOpen] = React.useState(false);
  const [policiesOpen, setPoliciesOpen] = React.useState(false);
  const [hotlinkOpen, setHotlinkOpen] = React.useState(false);
  const [cronOpen, setCronOpen] = React.useState(false);

  const { data: cronMeta } = trpc.plesk.wpFeatures.getWpCronTakeoverMeta.useQuery({
    installationId,
  });
  const cron = cronMeta?.data;

  const invalidate = () => utils.plesk.wordpress.getById.invalidate({ id: installationId });

  const toggleHotlink = trpc.plesk.wpFeatures.updateHotlinkProtectionStatus.useMutation({
    onSuccess: () => {
      toast.success("Hotlink protection updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const togglePassword = trpc.plesk.wpFeatures.updatePasswordProtection.useMutation({
    onSuccess: () => {
      toast.success("Password protection updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggleMaintenance = trpc.plesk.wpFeatures.toggleMaintenanceMode.useMutation({
    onSuccess: () => {
      toast.success("Maintenance mode updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggleDebug = trpc.plesk.wpFeatures.updateDebugStatus.useMutation({
    onSuccess: () => {
      toast.success("Debug mode updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggleSmart = trpc.plesk.wpFeatures.toggleSmartUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart Update setting saved");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
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
      utils.plesk.wpFeatures.getWpCronTakeoverMeta.invalidate({ installationId });
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const togglePatches = trpc.plesk.wpFeatures.applyVirtualPatches.useMutation({
    onSuccess: () => {
      toast.success("Vulnerability protection updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [EnableMaintenanceDialog, confirmEnableMaintenance] = useConfirm(
    "Enable maintenance mode?",
    "Visitors will see a maintenance page instead of your site until you turn this off.",
  );
  const [EnableDebugDialog, confirmEnableDebug] = useConfirm(
    "Enable debug mode?",
    "Debug mode can expose sensitive errors and data to visitors. Only enable this temporarily while troubleshooting.",
  );
  const [DisablePasswordDialog, confirmDisablePassword] = useConfirm(
    "Disable password protection?",
    "Visitors will no longer need a username and password to access this site.",
  );

  const pluginUpdates = f?.updates?.amountOfPluginsWithUpdates || 0;
  const themeUpdates = f?.updates?.amountOfThemesWithUpdates || 0;
  const phpVersion = f?.php?.handler?.version || "Not available";
  const phpStatus = f?.php?.eoled
    ? "End of life"
    : f?.php?.unsupported
      ? "Unsupported"
      : "Supported";
  const securityOk = f?.security?.status === "secureRecommended";
  const hasVulnerabilities = Boolean(f?.vulnerability?.vulnerable);
  const sslEnabled = Boolean(wpData.domain?.ssl?.enabled);
  const patchesOn = f?.virtualPatches?.status === true;
  const patchesAvailable = f?.virtualPatches?.available !== false;
  const smart = f?.updates?.smart;
  const backupsAvailable = Boolean(
    f?.backups?.wptBackupsAvailable ?? f?.backups?.panelBackupsAvailable,
  );

  if (!installationId || Number.isNaN(installationId)) return null;

  return (
    <>
      <EnableMaintenanceDialog />
      <EnableDebugDialog />
      <DisablePasswordDialog />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ToolkitCard title="Updates" icon={RefreshCw}>
          <OverviewFeatureRow
            label="WordPress"
            hint="Installed WordPress core version"
            value={wpData.version || "Unknown"}
            onConfigure={() => setAutoUpdatesOpen(true)}
          />
          <OverviewFeatureRow
            label="Plugins"
            hint="Install available plugin updates from the Plugins tab"
            warning={pluginUpdates > 0}
            value={pluginUpdates > 0 ? undefined : "Up to date"}
            action={
              pluginUpdates > 0
                ? {
                    label: `Install plugin updates (${pluginUpdates})`,
                    onClick: () => onNavigateToTab?.("plugins"),
                  }
                : undefined
            }
          />
          <OverviewFeatureRow
            label="Themes"
            hint="Install available theme updates from the Themes tab"
            warning={themeUpdates > 0}
            value={themeUpdates > 0 ? undefined : "Up to date"}
            action={
              themeUpdates > 0
                ? {
                    label: `Install theme updates (${themeUpdates})`,
                    onClick: () => onNavigateToTab?.("themes"),
                  }
                : undefined
            }
          />
          <OverviewFeatureRow
            label="Smart Update"
            hint="Test updates on a clone before applying them to the live site"
            toggle={{
              checked: Boolean(smart?.status),
              disabled: toggleSmart.isPending || smart?.available === false,
              onCheckedChange: (val) =>
                toggleSmart.mutate({ installationId, status: val }),
            }}
            onConfigure={() => setSmartOpen(true)}
          />
        </ToolkitCard>

        <ToolkitCard title="Tools" icon={Wrench}>
          <OverviewFeatureRow
            label="PHP"
            hint={`Runtime status: ${phpStatus}`}
            warning={Boolean(f?.php?.eoled || f?.php?.unsupported)}
            action={{ label: phpVersion, onClick: () => setPhpOpen(true) }}
            onConfigure={() => setPhpOpen(true)}
          />
          <OverviewFeatureRow
            label="Debugging"
            hint="WP_DEBUG and related developer constants"
            warning={Boolean(f?.debug?.status)}
            toggle={{
              checked: Boolean(f?.debug?.status),
              disabled: toggleDebug.isPending,
              onCheckedChange: async (val) => {
                if (val) {
                  const ok = await confirmEnableDebug();
                  if (!ok) return;
                }
                toggleDebug.mutate({ installationId, status: val });
              },
            }}
            onConfigure={() => setDebugOpen(true)}
          />
          <OverviewFeatureRow
            label="Password protection"
            hint="Restrict site access with HTTP basic authentication"
            toggle={{
              checked: Boolean(f?.passwordProtection?.status),
              disabled: togglePassword.isPending,
              onCheckedChange: async (val) => {
                if (val) {
                  setPasswordOpen(true);
                  return;
                }
                const ok = await confirmDisablePassword();
                if (!ok) return;
                togglePassword.mutate({ installationId, status: false });
              },
            }}
            onConfigure={() => setPasswordOpen(true)}
          />
          <OverviewFeatureRow
            label="Maintenance mode"
            hint="Show a maintenance page to visitors while you work"
            warning={Boolean(f?.maintenance?.status)}
            toggle={{
              checked: Boolean(f?.maintenance?.status),
              disabled: toggleMaintenance.isPending,
              onCheckedChange: async (val) => {
                if (val) {
                  const ok = await confirmEnableMaintenance();
                  if (!ok) return;
                }
                toggleMaintenance.mutate({ installationId, status: val });
              },
            }}
            onConfigure={() => setMaintenanceOpen(true)}
          />
          <OverviewFeatureRow
            label="Backups"
            hint="Create and restore WP Toolkit backups"
            action={{
              label: backupsAvailable ? "Manage" : "Unavailable",
              onClick: () => setBackupsOpen(true),
            }}
            onConfigure={() => setBackupsOpen(true)}
          />
        </ToolkitCard>

        <ToolkitCard title="Security" icon={Shield}>
          <OverviewFeatureRow
            label="SSL"
            hint={
              wpData.domain?.ssl?.certificate?.issuerName
                ? `Issuer: ${wpData.domain.ssl.certificate.issuerName}`
                : "HTTPS certificate status"
            }
            warning={!sslEnabled}
            value={sslEnabled ? "Enabled" : "Disabled"}
          />
          <OverviewFeatureRow
            label="Vulnerabilities"
            hint="Scan core, plugins, and themes for known issues"
            danger={hasVulnerabilities}
            action={{
              label: hasVulnerabilities ? "Mitigate vulnerabilities" : "Scan",
              onClick: () => setVulnsOpen(true),
            }}
          />
          <OverviewFeatureRow
            label="Critical measures"
            hint="Apply recommended hardening changes"
            danger={!securityOk}
            action={{
              label: securityOk ? "View" : "Apply critical security measures",
              onClick: () => setIntegrityOpen(true),
            }}
          />
          <OverviewFeatureRow
            label="Vulnerability protection"
            hint="Virtual patches and automated responses when issues are found"
            toggle={{
              checked: patchesOn,
              disabled: togglePatches.isPending || !patchesAvailable,
              onCheckedChange: (val) =>
                togglePatches.mutate({ installationId, status: val }),
            }}
            onConfigure={() => setPoliciesOpen(true)}
          />
          <OverviewFeatureRow
            label="Hotlink protection"
            hint="Block external sites from embedding your media"
            toggle={{
              checked: Boolean(f?.hotlinkProtection?.status),
              disabled:
                toggleHotlink.isPending || f?.hotlinkProtection?.available === false,
              onCheckedChange: (val) =>
                toggleHotlink.mutate({ installationId, status: val }),
            }}
            onConfigure={() => setHotlinkOpen(true)}
          />
          <OverviewFeatureRow
            label="Security policies"
            hint="Choose what happens automatically when a vulnerability is detected"
            action={{ label: "Configure", onClick: () => setPoliciesOpen(true) }}
            onConfigure={() => setPoliciesOpen(true)}
          />
        </ToolkitCard>

        <ToolkitCard title="Performance" icon={Gauge}>
          <OverviewFeatureRow
            label="Search engine indexing"
            hint="When disabled, search engines are discouraged from indexing the site"
            toggle={{
              checked: Boolean(f?.indexing?.status),
              disabled: toggleIndexing.isPending,
              onCheckedChange: (val) =>
                toggleIndexing.mutate({ installationId, status: val }),
            }}
          />
          <OverviewFeatureRow
            label="Caching (nginx)"
            hint="Enable nginx-level caching when available on the server"
            toggle={{
              checked: Boolean(f?.nginxCaching?.status),
              disabled:
                toggleNginx.isPending || f?.nginxCaching?.available === false,
              onCheckedChange: (val) =>
                toggleNginx.mutate({ installationId, status: val }),
            }}
          />
          <OverviewFeatureRow
            label="Take over wp-cron.php"
            hint="Run WordPress cron via the server task scheduler"
            toggle={{
              checked: Boolean(cron?.status),
              disabled: updateCron.isPending || cron?.available === false,
              onCheckedChange: (val) =>
                updateCron.mutate({ installationId, status: val }),
            }}
            onConfigure={() => setCronOpen(true)}
          />
        </ToolkitCard>
      </div>

      <AutoUpdateSettingsSheet
        open={autoUpdatesOpen}
        onOpenChange={setAutoUpdatesOpen}
        installationId={installationId}
      />
      <SmartUpdatesSheet
        open={smartOpen}
        onOpenChange={setSmartOpen}
        installationId={installationId}
        smartEnabled={smart?.status}
        smartAvailable={smart?.available}
        phpAvailable={f?.updates?.php?.available}
      />
      <PhpDetailsSheet
        open={phpOpen}
        onOpenChange={setPhpOpen}
        installationId={installationId}
        version={phpVersion}
        status={phpStatus}
        eoled={f?.php?.eoled}
        unsupported={f?.php?.unsupported}
        phpSmartAvailable={f?.updates?.php?.available}
      />
      <DebugSettingsSheet
        open={debugOpen}
        onOpenChange={setDebugOpen}
        installationId={installationId}
      />
      <PasswordProtectionDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        installationId={installationId}
      />
      <MaintenanceModeDialog
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
        installationId={installationId}
      />
      <WordPressBackupsSheet
        open={backupsOpen}
        onOpenChange={setBackupsOpen}
        installationId={installationId}
      />
      <VulnerabilitiesSheet
        open={vulnsOpen}
        onOpenChange={setVulnsOpen}
        installationId={installationId}
      />
      <IntegrityHardeningSheet
        open={integrityOpen}
        onOpenChange={setIntegrityOpen}
        installationId={installationId}
      />
      <SecurityPoliciesSheet
        open={policiesOpen}
        onOpenChange={setPoliciesOpen}
        installationId={installationId}
      />
      <HotlinkProtectionSheet
        open={hotlinkOpen}
        onOpenChange={setHotlinkOpen}
        installationId={installationId}
      />
      <WpCronSettingsDialog
        open={cronOpen}
        onOpenChange={setCronOpen}
        takeoverEnabled={Boolean(cron?.status)}
        replacementEnabled={Boolean(cron?.taskReplacementStatus)}
        disabled={updateCron.isPending || cron?.available === false}
        onTakeoverChange={(val) => updateCron.mutate({ installationId, status: val })}
        onReplacementChange={(val) =>
          updateCron.mutate({ installationId, taskReplacementStatus: val })
        }
      />
    </>
  );
}
