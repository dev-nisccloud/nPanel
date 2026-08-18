"use client";

import * as React from "react";
import { AlertTriangle, Shield, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessProtectionCard } from "@/components/wordpress/access-protection-card";
import { IntegrityHardeningSheet } from "@/components/wordpress/integrity-hardening-sheet";
import { SecurityPoliciesSheet } from "@/components/wordpress/security-policies-sheet";
import { VulnerabilitiesSheet } from "@/components/wordpress/vulnerabilities-sheet";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";

function SecurityHubCard({
  icon: Icon,
  title,
  description,
  badge,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">{badge}</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function WordPressSecurityTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const [integrityOpen, setIntegrityOpen] = React.useState(false);
  const [vulnerabilitiesOpen, setVulnerabilitiesOpen] = React.useState(false);
  const [policiesOpen, setPoliciesOpen] = React.useState(false);

  const securityOk = features?.security?.status === "secureRecommended";
  const hasVulnerabilities = Boolean(features?.vulnerability?.vulnerable);

  return (
    <>
      <div className="space-y-6">
        <AccessProtectionCard
          installationId={id}
          hotlinkProtection={features?.hotlinkProtection}
          passwordProtection={features?.passwordProtection}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SecurityHubCard
            icon={ShieldCheck}
            title="Integrity & hardening"
            description="Core files and recommended security fixes"
            actionLabel={securityOk ? "View" : "Harden"}
            onAction={() => setIntegrityOpen(true)}
            badge={
              securityOk ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                >
                  Secure
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Needs attention
                </Badge>
              )
            }
          />

          <SecurityHubCard
            icon={AlertTriangle}
            title="Vulnerabilities"
            description="Scan core, plugins, and themes"
            actionLabel={hasVulnerabilities ? "Review" : "Scan"}
            onAction={() => setVulnerabilitiesOpen(true)}
            badge={
              hasVulnerabilities ? (
                <Badge variant="destructive" className="text-xs">
                  Found
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                >
                  None
                </Badge>
              )
            }
          />

          <SecurityHubCard
            icon={Shield}
            title="Security policies"
            description="Automatic response when issues are found"
            actionLabel="Configure"
            onAction={() => setPoliciesOpen(true)}
            badge={<Badge variant="outline">Policies</Badge>}
          />
        </div>
      </div>

      <IntegrityHardeningSheet
        open={integrityOpen}
        onOpenChange={setIntegrityOpen}
        installationId={id}
      />
      <VulnerabilitiesSheet
        open={vulnerabilitiesOpen}
        onOpenChange={setVulnerabilitiesOpen}
        installationId={id}
      />
      <SecurityPoliciesSheet
        open={policiesOpen}
        onOpenChange={setPoliciesOpen}
        installationId={id}
      />
    </>
  );
}
