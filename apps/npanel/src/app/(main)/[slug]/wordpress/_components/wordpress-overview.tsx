"use client";

import * as React from "react";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Globe, 
  Code, 
  Database as DatabaseIcon, 
  HardDrive, 
  Cpu, 
  Lock,
  RefreshCw,
  FileText,
  Zap
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { wordpressInstallationSchema } from "./schema";

interface WordPressOverviewProps {
  wpData: z.infer<typeof wordpressInstallationSchema>;
}

export function WordPressOverview({ wpData }: WordPressOverviewProps) {
  const getStatusBadge = () => {
    if (wpData.status?.infected) {
      return <Badge variant="destructive">Infected</Badge>;
    }
    if (wpData.status?.unsupported) {
      return <Badge variant="secondary">Unsupported</Badge>;
    }
    if (wpData.status?.alive) {
      return <Badge variant="default">Online</Badge>;
    }
    return <Badge variant="secondary">Offline</Badge>;
  };

  const getSecurityBadge = () => {
    if (wpData.features?.security?.status === "secureRecommended") {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Shield className="h-3 w-3 mr-1" />
        Secure
      </Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Needs Attention
    </Badge>;
  };

  const getSslBadge = () => {
    if (wpData.domain?.ssl?.enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Enabled
      </Badge>;
    }
    return <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Disabled
    </Badge>;
  };

  const getUpdatesCount = () => {
    const pluginUpdates = wpData.features?.updates?.amountOfPluginsWithUpdates || 0;
    const themeUpdates = wpData.features?.updates?.amountOfThemesWithUpdates || 0;
    return pluginUpdates + themeUpdates;
  };

  const getInstallationUsagePercentage = () => {
    const used = wpData.domain?.installationsCount || 0;
    const limit = wpData.domain?.installationsLimit || 1;
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      {/* General Information & Status & Security - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Information
            </CardTitle>
            <CardDescription>Basic WordPress installation details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site Title</p>
              <p className="text-lg font-semibold">{wpData.title || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Display Title</p>
              <p className="text-lg font-semibold">{wpData.displayTitle || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Domain</p>
              <p className="text-lg font-semibold">{wpData.domain?.name || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Owner</p>
              <p className="text-lg font-semibold">{wpData.owner?.name || wpData.owner?.login || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Installation Type</p>
              <p className="text-lg font-semibold">{wpData.installationType || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Path</p>
              <p className="text-sm font-mono text-muted-foreground break-all">{wpData.path || "Not Available"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status & Security
            </CardTitle>
            <CardDescription>Current status and security information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Security:</span>
              {getSecurityBadge()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">SSL Certificate:</span>
              {getSslBadge()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Multisite:</span>
              <Badge variant={wpData.status?.multisite ? "default" : "secondary"}>
                {wpData.status?.multisite ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Infected:</span>
              <Badge variant={wpData.status?.infected ? "destructive" : "default"}>
                {wpData.status?.infected ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Vulnerabilities:</span>
              <Badge variant={wpData.features?.vulnerability?.vulnerable ? "destructive" : "default"}>
                {wpData.features?.vulnerability?.vulnerable ? "Found" : "None"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WordPress Version & Updates & PHP & Server Configuration - Together */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WordPress Version & Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              WordPress Version & Updates
            </CardTitle>
            <CardDescription>Current version and available updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WordPress Version */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">WordPress Version</p>
                <p className="text-2xl font-bold">{wpData.version || "Unknown"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Auto Updates</p>
                <Badge variant={wpData.features?.updates?.autoUpdatesAvailable ? "default" : "secondary"}>
                  {wpData.features?.updates?.autoUpdatesAvailable ? "Available" : "Not Available"}
                </Badge>
              </div>
            </div>

            {/* Updates Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Plugin Updates</p>
                    <p className="text-sm text-muted-foreground">Available updates</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{wpData.features?.updates?.amountOfPluginsWithUpdates || 0}</p>
                  <Badge variant={wpData.features?.updates?.amountOfPluginsWithUpdates ? "destructive" : "default"}>
                    {wpData.features?.updates?.amountOfPluginsWithUpdates ? "Updates Available" : "Up to Date"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Theme Updates</p>
                    <p className="text-sm text-muted-foreground">Available updates</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{wpData.features?.updates?.amountOfThemesWithUpdates || 0}</p>
                  <Badge variant={wpData.features?.updates?.amountOfThemesWithUpdates ? "destructive" : "default"}>
                    {wpData.features?.updates?.amountOfThemesWithUpdates ? "Updates Available" : "Up to Date"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Total Updates */}
            {getUpdatesCount() > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {getUpdatesCount()} total updates available
                  </p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Consider updating your WordPress installation, plugins, and themes for better security and performance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PHP & Server Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              PHP & Server Configuration
            </CardTitle>
            <CardDescription>Server environment and PHP settings</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">PHP Version</p>
              <p className="text-lg font-semibold">{wpData.features?.php?.handler?.version || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PHP Handler</p>
              <p className="text-lg font-semibold">{wpData.features?.php?.handler?.name || "Not Available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PHP Status</p>
              <div className="flex items-center gap-2">
                {wpData.features?.php?.eoled ? (
                  <Badge variant="destructive">End of Life</Badge>
                ) : wpData.features?.php?.unsupported ? (
                  <Badge variant="secondary">Unsupported</Badge>
                ) : (
                  <Badge variant="default">Supported</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Debug Mode:</span>
              <Badge variant={wpData.features?.debug?.status ? "destructive" : "default"}>
                {wpData.features?.debug?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Maintenance Mode:</span>
              <Badge variant={wpData.features?.maintenance?.status ? "secondary" : "default"}>
                {wpData.features?.maintenance?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Indexing:</span>
              <Badge variant={wpData.features?.indexing?.status ? "default" : "secondary"}>
                {wpData.features?.indexing?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation Limits & Features & Capabilities - Together */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Installation Limits
            </CardTitle>
            <CardDescription>Current usage and limits for WordPress installations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">WordPress Installations</span>
                <span className="text-sm text-muted-foreground">
                  {wpData.domain?.installationsCount || 0} / {wpData.domain?.installationsLimit || 0}
                </span>
              </div>
              <Progress value={getInstallationUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getInstallationUsagePercentage()}% used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features & Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Features & Capabilities
            </CardTitle>
            <CardDescription>Available WordPress features and management capabilities</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">File Manager:</span>
              <Badge variant={wpData.features?.fileManager?.available ? "default" : "secondary"}>
                {wpData.features?.fileManager?.available ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Backups:</span>
              <Badge variant={wpData.features?.backups?.panelBackupsAvailable ? "default" : "secondary"}>
                {wpData.features?.backups?.panelBackupsAvailable ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">WP CLI:</span>
              <Badge variant={wpData.features?.wpCli?.available ? "default" : "secondary"}>
                {wpData.features?.wpCli?.available ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Clone:</span>
              <Badge variant={wpData.features?.clone?.available ? "default" : "secondary"}>
                {wpData.features?.clone?.available ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Remote Management:</span>
              <Badge variant={wpData.features?.remoteManagement?.available ? "default" : "secondary"}>
                {wpData.features?.remoteManagement?.available ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Action Log:</span>
              <Badge variant={wpData.features?.actionLog?.available ? "default" : "secondary"}>
                {wpData.features?.actionLog?.available ? "Available" : "Not Available"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Hotlink Protection:</span>
              <Badge variant={wpData.features?.hotlinkProtection?.status ? "default" : "secondary"}>
                {wpData.features?.hotlinkProtection?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Password Protection:</span>
              <Badge variant={wpData.features?.passwordProtection?.status ? "default" : "secondary"}>
                {wpData.features?.passwordProtection?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Nginx Caching:</span>
              <Badge variant={wpData.features?.nginxCaching?.status ? "default" : "secondary"}>
                {wpData.features?.nginxCaching?.status ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SSL Certificate Details - On its own */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            SSL Certificate Details
          </CardTitle>
          <CardDescription>SSL certificate configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">SSL Enabled:</span>
            <Badge variant={wpData.domain?.ssl?.enabled ? "default" : "destructive"}>
              {wpData.domain?.ssl?.enabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Certificate Installed:</span>
            <Badge variant={wpData.domain?.ssl?.certificate?.installed ? "default" : "destructive"}>
              {wpData.domain?.ssl?.certificate?.installed ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">HTTPS Redirect:</span>
            <Badge variant={wpData.domain?.ssl?.redirectToHttpsEnabled ? "default" : "secondary"}>
              {wpData.domain?.ssl?.redirectToHttpsEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Certificate Issuer</p>
            <p className="text-lg font-semibold">{wpData.domain?.ssl?.certificate?.issuerName || "Not Available"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Self-Signed:</span>
            <Badge variant={wpData.domain?.ssl?.certificate?.selfSigned ? "secondary" : "default"}>
              {wpData.domain?.ssl?.certificate?.selfSigned ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Suitable for Domain:</span>
            <Badge variant={wpData.domain?.ssl?.certificate?.suitableForDomain ? "default" : "destructive"}>
              {wpData.domain?.ssl?.certificate?.suitableForDomain ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

