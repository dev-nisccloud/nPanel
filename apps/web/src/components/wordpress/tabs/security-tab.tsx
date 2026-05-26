"use client";

import * as React from "react";
import { Link2, Lock, Shield, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  WpInnerGrid,
  WpPanel,
  WpSection,
} from "@/components/wordpress/wp-detail-primitives";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import { HotlinkProtectionSheet } from "@/components/wordpress/hotlink-protection-sheet";
import { PasswordProtectionDialog } from "@/components/wordpress/password-protection-dialog";
import { SecurityMeasuresCard } from "@/components/wordpress/security-measures-card";
import { VulnerabilitiesCard } from "@/components/wordpress/vulnerabilities-card";
import { SecurityPoliciesCard } from "@/components/wordpress/security-policies-card";
import { WpStatusBadge } from "@/components/wordpress/wp-status-badge";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { trpc } from "@/utils/trpc";

export function WordPressSecurityTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const [hotlinkOpen, setHotlinkOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const utils = trpc.useUtils();

  const { data: integrity, isLoading: integrityLoading } =
    trpc.plesk.wpFeatures.getIntegrityInfo.useQuery({ installationId: id });

  const toggleHotlink = trpc.plesk.wpFeatures.updateHotlinkProtectionStatus.useMutation({
    onSuccess: () => {
      toast.success("Hotlink protection updated");
      utils.plesk.wordpress.getById.invalidate({ id });
    },
    onError: (e) => toast.error(e.message),
  });

  const hotlinkAvailable = features?.hotlinkProtection?.available !== false;
  const integrityTasks = integrity?.tasks ?? [];
  const hasIntegrityContent =
    Boolean(integrity?.status) ||
    Boolean(integrity?.message) ||
    integrityTasks.length > 0;

  return (
    <>
      <div className={wpDetailLayout.sectionStack}>
        <WpSection
          title="Access protection"
          description="Hotlink and HTTP basic authentication"
          icon={Lock}
        >
          <WpInnerGrid>
            <WpPanel
              title="Hotlink protection"
              description="Block external embedding of media"
              badge={
                <Badge
                  variant={features?.hotlinkProtection?.status ? "default" : "secondary"}
                  className="text-xs"
                >
                  {features?.hotlinkProtection?.status ? "On" : "Off"}
                </Badge>
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-sm">Enabled</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={features?.hotlinkProtection?.status ?? false}
                    disabled={!hotlinkAvailable || toggleHotlink.isPending}
                    onCheckedChange={(val) =>
                      toggleHotlink.mutate({ installationId: id, status: val })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hotlinkAvailable}
                    onClick={() => setHotlinkOpen(true)}
                  >
                    Allowed domains
                  </Button>
                </div>
              </div>
            </WpPanel>

            <WpPanel
              title="Password protection"
              description="Restrict site access"
              badge={
                <Badge
                  variant={features?.passwordProtection?.status ? "default" : "secondary"}
                  className="text-xs"
                >
                  {features?.passwordProtection?.status ? "Active" : "Inactive"}
                </Badge>
              }
            >
              <Button type="button" variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                Configure credentials
              </Button>
            </WpPanel>
          </WpInnerGrid>
        </WpSection>

        <WpSection
          title="Vulnerabilities"
          description="Scan results and automated response policies"
          icon={Shield}
        >
          <WpInnerGrid>
            <VulnerabilitiesCard installationId={id} shell="panel" />
            <SecurityPoliciesCard installationId={id} shell="panel" />
          </WpInnerGrid>
        </WpSection>

        <WpSection
          title="Integrity & hardening"
          description="Core file integrity and recommended security fixes"
          icon={ShieldCheck}
        >
          <div className="space-y-4">
            <WpPanel title="WordPress integrity" description="Core file integrity status">
              {integrityLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : hasIntegrityContent ? (
                <div className="space-y-3">
                  {integrity?.status ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <WpStatusBadge label={String(integrity.status)} />
                    </div>
                  ) : null}
                  {integrity?.message ? (
                    <p className="text-sm text-muted-foreground">{integrity.message}</p>
                  ) : null}
                  {integrityTasks.length > 0 ? (
                    <ul className="divide-y divide-border/60 rounded-md border border-border/60 text-sm">
                      {integrityTasks.map((task) => (
                        <li key={task.code} className="flex justify-between gap-3 px-3 py-2">
                          <span className="truncate text-muted-foreground">
                            {task.title ?? task.code}
                          </span>
                          <WpStatusBadge label={task.status ?? "pending"} />
                        </li>
                      ))}
                    </ul>
                  ) : integrity?.status ? (
                    <p className="text-sm text-muted-foreground">No active integrity tasks.</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Integrity check data is not available for this installation.
                </p>
              )}
            </WpPanel>

            <WpPanel title="Security measures" description="Recommended fixes from WP Toolkit">
              <SecurityMeasuresCard installationId={id} shell="none" />
            </WpPanel>
          </div>
        </WpSection>
      </div>

      <HotlinkProtectionSheet open={hotlinkOpen} onOpenChange={setHotlinkOpen} installationId={id} />
      <PasswordProtectionDialog open={passwordOpen} onOpenChange={setPasswordOpen} installationId={id} />
    </>
  );
}
