"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock,
  Shield,
  XCircle,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewQuickActions } from "@/components/wordpress/overview-quick-actions";
import { WordPressSiteCredentials } from "@/components/wordpress/wordpress-site-credentials";
import { WpInstallationStatusBadge } from "@/components/wordpress/wp-installation-status-badge";
import { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";

interface WordPressOverviewProps {
  wpData: z.infer<typeof wordpressInstallationSchema>;
  onNavigateToTab?: (tab: string) => void;
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0 text-sm font-medium text-primary">{value}</div>
    </div>
  );
}

function YesNoBadge({
  on,
  onLabel = "Yes",
  offLabel = "No",
  destructiveOff = false,
}: {
  on: boolean | undefined;
  onLabel?: string;
  offLabel?: string;
  destructiveOff?: boolean;
}) {
  if (on) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      >
        <CheckCircle className="h-3 w-3" />
        {onLabel}
      </Badge>
    );
  }
  return (
    <Badge variant={destructiveOff ? "destructive" : "secondary"} className="gap-1">
      <XCircle className="h-3 w-3" />
      {offLabel}
    </Badge>
  );
}

export function WordPressOverview({ wpData, onNavigateToTab }: WordPressOverviewProps) {
  const pluginUpdates = wpData.features?.updates?.amountOfPluginsWithUpdates || 0;
  const themeUpdates = wpData.features?.updates?.amountOfThemesWithUpdates || 0;
  const updatesCount = pluginUpdates + themeUpdates;

  const phpVersion = wpData.features?.php?.handler?.version || "Not available";
  const phpStatus = wpData.features?.php?.eoled
    ? "End of life"
    : wpData.features?.php?.unsupported
      ? "Unsupported"
      : "Supported";
  const backupsAvailable = Boolean(wpData.features?.backups?.panelBackupsAvailable);
  const securityOk = wpData.features?.security?.status === "secureRecommended";
  const sslEnabled = Boolean(wpData.domain?.ssl?.enabled);
  const certInstalled = Boolean(wpData.domain?.ssl?.certificate?.installed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Site
            </CardTitle>
            <CardDescription className="text-xs">Installation basics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell label="Site title" value={wpData.title || "Not available"} />
                <InfoCell label="Domain" value={wpData.domain?.name || "Not available"} />
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="WordPress"
                  value={
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{wpData.version || "Unknown"}</span>
                      {wpData.features?.updates?.autoUpdatesAvailable ? (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          Auto-updates
                        </Badge>
                      ) : null}
                    </span>
                  }
                />
                <InfoCell label="PHP version" value={phpVersion} />
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="PHP status"
                  value={
                    <Badge
                      variant={
                        wpData.features?.php?.eoled
                          ? "destructive"
                          : wpData.features?.php?.unsupported
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        !wpData.features?.php?.eoled && !wpData.features?.php?.unsupported
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : undefined
                      }
                    >
                      {phpStatus}
                    </Badge>
                  }
                />
                <InfoCell
                  label="Backups"
                  value={
                    backupsAvailable ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Unavailable
                      </Badge>
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Status & security
            </CardTitle>
            <CardDescription className="text-xs">Health and protection</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="Status"
                  value={<WpInstallationStatusBadge status={wpData.status} />}
                />
                <InfoCell
                  label="Security"
                  value={
                    securityOk ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        <Shield className="h-3 w-3" />
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
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="SSL"
                  value={
                    sslEnabled ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </Badge>
                    )
                  }
                />
                <InfoCell
                  label="Vulnerabilities"
                  value={
                    wpData.features?.vulnerability?.vulnerable ? (
                      <Badge variant="destructive" className="gap-1">
                        Found
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        None
                      </Badge>
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="Multisite"
                  value={<YesNoBadge on={wpData.status?.multisite} />}
                />
                <InfoCell
                  label="Infected"
                  value={
                    wpData.status?.infected ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        <CheckCircle className="h-3 w-3" />
                        No
                      </Badge>
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {wpData.id != null ? (
        <WordPressSiteCredentials installationId={String(wpData.id)} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-muted-foreground" />
              SSL certificate
            </CardTitle>
            <CardDescription className="text-xs">HTTPS and certificate details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="SSL enabled"
                  value={<YesNoBadge on={sslEnabled} destructiveOff />}
                />
                <InfoCell
                  label="Certificate installed"
                  value={<YesNoBadge on={certInstalled} destructiveOff />}
                />
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="HTTPS redirect"
                  value={
                    <YesNoBadge
                      on={wpData.domain?.ssl?.redirectToHttpsEnabled}
                      onLabel="Enabled"
                      offLabel="Disabled"
                    />
                  }
                />
                <InfoCell
                  label="Issuer"
                  value={wpData.domain?.ssl?.certificate?.issuerName || "Not available"}
                />
              </div>
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <InfoCell
                  label="Self-signed"
                  value={<YesNoBadge on={wpData.domain?.ssl?.certificate?.selfSigned} />}
                />
                <InfoCell
                  label="Suitable for domain"
                  value={
                    <YesNoBadge
                      on={wpData.domain?.ssl?.certificate?.suitableForDomain}
                      destructiveOff
                    />
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <OverviewQuickActions
          onNavigateToTab={onNavigateToTab}
          highlights={{
            vulnerable: wpData.features?.vulnerability?.vulnerable,
            maintenance: wpData.features?.maintenance?.status,
            debug: wpData.features?.debug?.status,
            updatesCount,
            pluginUpdates,
            themeUpdates,
          }}
        />
      </div>
    </div>
  );
}
