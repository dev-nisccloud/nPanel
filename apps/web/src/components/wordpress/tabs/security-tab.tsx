"use client";

import * as React from "react";
import { AlertTriangle, Link2, Lock, Shield, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-6">
        {/* 1. Access */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Access protection
            </CardTitle>
            <CardDescription className="text-xs">
              Hotlink blocking and HTTP basic authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="flex flex-col justify-between gap-3 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Hotlink protection
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Block external embedding of media
                    </p>
                  </div>
                  <Badge
                    variant={features?.hotlinkProtection?.status ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {features?.hotlinkProtection?.status ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                    <Switch
                      checked={features?.hotlinkProtection?.status ?? false}
                      disabled={!hotlinkAvailable || toggleHotlink.isPending}
                      onCheckedChange={(val) =>
                        toggleHotlink.mutate({ installationId: id, status: val })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    disabled={!hotlinkAvailable}
                    onClick={() => setHotlinkOpen(true)}
                  >
                    Allowed domains
                  </Button>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary">Password protection</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Restrict site access with credentials
                    </p>
                  </div>
                  <Badge
                    variant={features?.passwordProtection?.status ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {features?.passwordProtection?.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setPasswordOpen(true)}
                  >
                    Configure credentials
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Integrity  full width */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Integrity & hardening
            </CardTitle>
            <CardDescription className="text-xs">
              Core file integrity and recommended security fixes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="space-y-3 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  WordPress integrity
                </p>
                {integrityLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : hasIntegrityContent ? (
                  <div className="space-y-3">
                    {integrity?.status ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <WpStatusBadge label={String(integrity.status)} />
                      </div>
                    ) : null}
                    {integrity?.message ? (
                      <p className="text-sm text-muted-foreground">{integrity.message}</p>
                    ) : null}
                    {integrityTasks.length > 0 ? (
                      <ul className="divide-y divide-border rounded-md border text-sm">
                        {integrityTasks.map((task) => (
                          <li
                            key={task.code}
                            className="flex items-center justify-between gap-3 px-3 py-2"
                          >
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
              </div>
              <div className="px-4 py-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Security measures
                </p>
                <SecurityMeasuresCard installationId={id} shell="none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Vulnerabilities  own section */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Vulnerabilities
            </CardTitle>
            <CardDescription className="text-xs">
              Scan WordPress core, plugins, and themes for known security issues
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <VulnerabilitiesCard installationId={id} shell="none" />
          </CardContent>
        </Card>

        {/* 4. Policies  separate section */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Security policies
            </CardTitle>
            <CardDescription className="text-xs">
              Choose what happens automatically when a vulnerability is detected
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SecurityPoliciesCard installationId={id} shell="none" />
          </CardContent>
        </Card>
      </div>

      <HotlinkProtectionSheet open={hotlinkOpen} onOpenChange={setHotlinkOpen} installationId={id} />
      <PasswordProtectionDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        installationId={id}
      />
    </>
  );
}
