"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OverviewQuickActions } from "@/components/wordpress/overview-quick-actions";
import { WpInstallationStatusBadge } from "@/components/wordpress/wp-installation-status-badge";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import {
  WpInfoGrid,
  WpInfoItem,
  WpKeyValueRow,
  WpSection,
  WpStatTile,
} from "@/components/wordpress/wp-detail-primitives";
import { wordpressInstallationSchema } from "./schema";

interface WordPressOverviewProps {
  wpData: z.infer<typeof wordpressInstallationSchema>;
  onNavigateToTab?: (tab: string) => void;
}

export function WordPressOverview({ wpData, onNavigateToTab }: WordPressOverviewProps) {
  const getSecurityBadge = () => {
    if (wpData.features?.security?.status === "secureRecommended") {
      return (
        <Badge variant="default">
          <Shield className="h-3 w-3 mr-1" />
          Secure
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Needs attention
      </Badge>
    );
  };

  const getSslBadge = () => {
    if (wpData.domain?.ssl?.enabled) {
      return (
        <Badge variant="default">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enabled
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  const pluginUpdates = wpData.features?.updates?.amountOfPluginsWithUpdates || 0;
  const themeUpdates = wpData.features?.updates?.amountOfThemesWithUpdates || 0;
  const updatesCount = pluginUpdates + themeUpdates;

  const getInstallationUsagePercentage = () => {
    const used = wpData.domain?.installationsCount || 0;
    const limit = wpData.domain?.installationsLimit || 1;
    return Math.round((used / limit) * 100);
  };

  const phpStatusBadge = () => {
    if (wpData.features?.php?.eoled) return <Badge variant="destructive">End of life</Badge>;
    if (wpData.features?.php?.unsupported) return <Badge variant="secondary">Unsupported</Badge>;
    return <Badge variant="default">Supported</Badge>;
  };

  const featureFlags = [
    { label: "File manager", on: wpData.features?.fileManager?.available },
    { label: "Backups", on: wpData.features?.backups?.panelBackupsAvailable },
    { label: "WP-CLI", on: wpData.features?.wpCli?.available },
    { label: "Clone", on: wpData.features?.clone?.available },
    { label: "Remote mgmt", on: wpData.features?.remoteManagement?.available },
    { label: "Action log", on: wpData.features?.actionLog?.available },
  ] as const;

  return (
    <div className={wpDetailLayout.sectionStack}>
      <div className={wpDetailLayout.statGrid}>
        <WpStatTile label="Status" value={<WpInstallationStatusBadge status={wpData.status} />} />
        <WpStatTile
          label="WordPress"
          value={wpData.version || "Unknown"}
          hint={
            wpData.features?.updates?.autoUpdatesAvailable ? "Auto-updates available" : undefined
          }
        />
        <WpStatTile
          label="PHP"
          value={wpData.features?.php?.handler?.version || "—"}
          hint={wpData.features?.php?.handler?.name || undefined}
        />
        <WpStatTile
          label="Updates"
          value={updatesCount}
          hint={`${pluginUpdates} plugins · ${themeUpdates} themes`}
          icon={RefreshCw}
          action={
            updatesCount > 0 ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onNavigateToTab?.("updates")}
              >
                Review
              </Button>
            ) : undefined
          }
        />
      </div>

      {updatesCount > 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {updatesCount} update{updatesCount === 1 ? "" : "s"} available — consider updating for
            security and stability.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className={wpDetailLayout.sectionGrid}>
        <WpSection title="Site" icon={Globe}>
          <WpInfoGrid>
            <WpInfoItem label="Site title">{wpData.title || "Not available"}</WpInfoItem>
            <WpInfoItem label="Display title">{wpData.displayTitle || "Not available"}</WpInfoItem>
            <WpInfoItem label="Domain">{wpData.domain?.name || "Not available"}</WpInfoItem>
            <WpInfoItem label="Owner">
              {wpData.owner?.name || wpData.owner?.login || "Not available"}
            </WpInfoItem>
          </WpInfoGrid>
        </WpSection>

        <WpSection title="Status & security" icon={Shield}>
          <div className="space-y-2">
            <WpKeyValueRow label="Runtime">
              <WpInstallationStatusBadge status={wpData.status} />
            </WpKeyValueRow>
            <WpKeyValueRow label="Security">{getSecurityBadge()}</WpKeyValueRow>
            <WpKeyValueRow label="SSL">{getSslBadge()}</WpKeyValueRow>
            <WpKeyValueRow label="Multisite">
              <Badge variant={wpData.status?.multisite ? "default" : "secondary"}>
                {wpData.status?.multisite ? "Yes" : "No"}
              </Badge>
            </WpKeyValueRow>
            <WpKeyValueRow label="Infected">
              <Badge variant={wpData.status?.infected ? "destructive" : "default"}>
                {wpData.status?.infected ? "Yes" : "No"}
              </Badge>
            </WpKeyValueRow>
            <WpKeyValueRow label="Vulnerabilities">
              <Badge variant={wpData.features?.vulnerability?.vulnerable ? "destructive" : "default"}>
                {wpData.features?.vulnerability?.vulnerable ? "Found" : "None"}
              </Badge>
            </WpKeyValueRow>
          </div>
        </WpSection>

        <WpSection title="PHP & server" icon={Zap}>
          <div className="space-y-2">
            <WpInfoGrid>
              <WpInfoItem label="PHP version">
                {wpData.features?.php?.handler?.version || "Not available"}
              </WpInfoItem>
              <WpInfoItem label="Handler">
                {wpData.features?.php?.handler?.name || "Not available"}
              </WpInfoItem>
            </WpInfoGrid>
            <WpKeyValueRow label="PHP status">{phpStatusBadge()}</WpKeyValueRow>
          </div>
        </WpSection>

        <WpSection title="Updates" icon={RefreshCw}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-border/60 px-3 py-2">
              <p className="text-xs text-muted-foreground">Plugin updates</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-lg font-semibold tabular-nums">{pluginUpdates}</span>
                {pluginUpdates > 0 ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => onNavigateToTab?.("plugins")}
                  >
                    View
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Up to date
                  </Badge>
                )}
              </div>
            </div>
            <div className="rounded-md border border-border/60 px-3 py-2">
              <p className="text-xs text-muted-foreground">Theme updates</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-lg font-semibold tabular-nums">{themeUpdates}</span>
                {themeUpdates > 0 ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => onNavigateToTab?.("themes")}
                  >
                    View
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Up to date
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </WpSection>

        <WpSection title="Installation limits" icon={Globe}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">WordPress installations</span>
              <span className="tabular-nums">
                {wpData.domain?.installationsCount || 0} / {wpData.domain?.installationsLimit || 0}
              </span>
            </div>
            <Progress value={getInstallationUsagePercentage()} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{getInstallationUsagePercentage()}% used</p>
          </div>
        </WpSection>

        <WpSection title="Capabilities" icon={Zap}>
          <div className="flex flex-wrap gap-1.5">
            {featureFlags.map(({ label, on }) => (
              <Badge key={label} variant={on ? "default" : "secondary"} className="text-xs font-normal">
                {label}
              </Badge>
            ))}
          </div>
        </WpSection>
      </div>

      <OverviewQuickActions
        className={wpDetailLayout.cardFullWidth}
        onNavigateToTab={onNavigateToTab}
        highlights={{
          vulnerable: wpData.features?.vulnerability?.vulnerable,
          maintenance: wpData.features?.maintenance?.status,
          debug: wpData.features?.debug?.status,
          updatesCount,
        }}
      />

      <WpSection title="SSL certificate" icon={Lock} className={wpDetailLayout.cardFullWidth}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <WpKeyValueRow label="SSL enabled">
            <Badge variant={wpData.domain?.ssl?.enabled ? "default" : "destructive"}>
              {wpData.domain?.ssl?.enabled ? "Yes" : "No"}
            </Badge>
          </WpKeyValueRow>
          <WpKeyValueRow label="Certificate installed">
            <Badge variant={wpData.domain?.ssl?.certificate?.installed ? "default" : "destructive"}>
              {wpData.domain?.ssl?.certificate?.installed ? "Yes" : "No"}
            </Badge>
          </WpKeyValueRow>
          <WpKeyValueRow label="HTTPS redirect">
            <Badge variant={wpData.domain?.ssl?.redirectToHttpsEnabled ? "default" : "secondary"}>
              {wpData.domain?.ssl?.redirectToHttpsEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </WpKeyValueRow>
          <WpInfoItem label="Issuer">
            {wpData.domain?.ssl?.certificate?.issuerName || "Not available"}
          </WpInfoItem>
          <WpKeyValueRow label="Self-signed">
            <Badge variant={wpData.domain?.ssl?.certificate?.selfSigned ? "secondary" : "default"}>
              {wpData.domain?.ssl?.certificate?.selfSigned ? "Yes" : "No"}
            </Badge>
          </WpKeyValueRow>
          <WpKeyValueRow label="Suitable for domain">
            <Badge
              variant={wpData.domain?.ssl?.certificate?.suitableForDomain ? "default" : "destructive"}
            >
              {wpData.domain?.ssl?.certificate?.suitableForDomain ? "Yes" : "No"}
            </Badge>
          </WpKeyValueRow>
        </div>
      </WpSection>
    </div>
  );
}
