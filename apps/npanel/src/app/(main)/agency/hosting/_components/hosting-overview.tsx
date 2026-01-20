"use client";

import * as React from "react";
import { CheckCircle, XCircle, HardDrive, Wifi, Cpu, Database as DatabaseIcon, Globe } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { hostingDetailSchema } from "./hosting-detail-schema";
import { Database } from "./databases-schema";
import { useDatabasesBySiteId } from "./use-databases-by-site-id";
import { Skeleton } from "@/components/ui/skeleton";

interface HostingOverviewProps {
  hostingData: z.infer<typeof hostingDetailSchema>;
}

export function HostingOverview({ hostingData }: HostingOverviewProps) {
  // Fetch databases for this hosting subscription
  const { data: databasesData, isLoading: databasesLoading, isError: databasesError } = useDatabasesBySiteId(hostingData.id);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTraffic = (bytes: number) => {
    return formatBytes(bytes);
  };

  const getPropertyValue = (name: string) => {
    const property = hostingData.hosting?.vrt_hst?.property?.find((p: any) => p.name === name);
    return property?.value;
  };

  const getLimitValue = (name: string) => {
    const limit = hostingData.limits?.limit?.find((l: any) => l.name === name);
    return limit?.value;
  };

  const getDiskUsagePercentage = () => {
    const used = hostingData.gen_info?.["real_size"] ?? 0;
    const limit = getLimitValue("disk_space") || 1;
    return Math.round((used / limit) * 100);
  };

  const getTrafficUsagePercentage = () => {
    const used = hostingData.stat?.traffic ?? 0;
    const limit = getLimitValue("max_traffic") || 1;
    return Math.round((used / limit) * 100);
  };

  const getMailboxUsagePercentage = () => {
    const used = hostingData.stat?.box ?? 0;
    const limit = getLimitValue("max_box") || 1;
    return Math.round((used / limit) * 100);
  };

  const getDatabaseUsagePercentage = () => {
    const used = hostingData.stat?.db ?? 0;
    const limit = getLimitValue("max_db") || 1;
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      {/* General Information & Hosting Configuration - Combined */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Information & Configuration
          </CardTitle>
          <CardDescription>Basic hosting account details and server settings</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Domain Name</p>
            <p className="text-lg font-semibold">{hostingData.gen_info?.name || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Owner</p>
            <p className="text-lg font-semibold">{hostingData.gen_info?.["owner-login"] || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created Date</p>
            <p className="text-lg font-semibold">
              {hostingData.gen_info?.["cr_date"] ? new Date(hostingData.gen_info["cr_date"]).toLocaleDateString() : "Not Available"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Server IP</p>
            <p className="text-lg font-semibold">{hostingData.hosting?.vrt_hst?.ip_address || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">DNS IP</p>
            <p className="text-lg font-semibold">{hostingData.gen_info?.["dns_ip_address"] || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hosting Type</p>
            <p className="text-lg font-semibold">{hostingData.gen_info?.htype || "Not Available"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">SSL Certificate:</span>
            {getPropertyValue("ssl") ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Disabled
              </Badge>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">PHP Version</p>
            <p className="text-lg font-semibold">{getPropertyValue("php_handler_id") || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Document Root</p>
            <p className="text-sm font-mono text-muted-foreground break-all">{getPropertyValue("www_root") || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Certificate Name</p>
            <p className="text-sm text-muted-foreground">{getPropertyValue("certificate_name") || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">FTP Login</p>
            <p className="text-sm font-mono text-muted-foreground">{getPropertyValue("ftp_login") || "Not Available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">FTP Quota</p>
            <p className="text-sm text-muted-foreground">{formatBytes(Number(getPropertyValue("ftp_quota")) || 0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage & Resource Limits - Side by side in flexgrid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Resource Usage
            </CardTitle>
            <CardDescription>Current usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Disk Space */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Disk Space</span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(hostingData.gen_info?.["real_size"] ?? 0)} / {formatBytes(getLimitValue("disk_space") || 0)}
                </span>
              </div>
              <Progress value={getDiskUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getDiskUsagePercentage()}% used
              </p>
            </div>

            {/* Traffic */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Traffic</span>
                <span className="text-sm text-muted-foreground">
                  {formatTraffic(hostingData.stat?.traffic ?? 0)} / {formatTraffic(getLimitValue("max_traffic") || 0)}
                </span>
              </div>
              <Progress value={getTrafficUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getTrafficUsagePercentage()}% used
              </p>
            </div>

            {/* Mailboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Mailboxes</span>
                <span className="text-sm text-muted-foreground">
                  {hostingData.stat?.box ?? 0} / {getLimitValue("max_box") || 0}
                </span>
              </div>
              <Progress value={getMailboxUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getMailboxUsagePercentage()}% used
              </p>
            </div>

            {/* Databases */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Databases</span>
                <span className="text-sm text-muted-foreground">
                  {hostingData.stat?.db ?? 0} / {getLimitValue("max_db") || 0}
                </span>
              </div>
              <Progress value={getDatabaseUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getDatabaseUsagePercentage()}% used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resource Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Resource Limits
            </CardTitle>
            <CardDescription>Maximum allowed resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Sites</p>
                <p className="text-lg font-semibold">{getLimitValue("max_site") || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Subdomains</p>
                <p className="text-lg font-semibold">{getLimitValue("max_subdom") || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Domain Aliases</p>
                <p className="text-lg font-semibold">{getLimitValue("max_dom_aliases") || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max FTP Users</p>
                <p className="text-lg font-semibold">{getLimitValue("max_subftp_users") || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Mail Lists</p>
                <p className="text-lg font-semibold">{getLimitValue("max_maillists") || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Web Users</p>
                <p className="text-lg font-semibold">{getLimitValue("max_wu") || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Databases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Databases
          </CardTitle>
          <CardDescription>Current databases on this hosting account</CardDescription>
        </CardHeader>
        <CardContent>
          {databasesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : databasesError ? (
            <div className="text-center py-8 text-muted-foreground">
              <DatabaseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load databases</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {databasesData?.map((database) => (
                <div
                  key={database.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <DatabaseIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{database.name || "Unknown Database"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {(database.type || "mysql").toUpperCase()}
                        </Badge>
                        <Badge 
                          variant={database.status === "ok" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {database.status === "ok" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!databasesData || databasesData.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <DatabaseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No databases found</p>
                  <p className="text-sm">Create your first database to get started</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Statistics
          </CardTitle>
          <CardDescription>Current usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subdomains</p>
              <p className="text-lg font-semibold">{hostingData.stat?.subdom ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Web Users</p>
              <p className="text-lg font-semibold">{hostingData.stat?.wu ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Redirects</p>
              <p className="text-lg font-semibold">{hostingData.stat?.redir ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mail Groups</p>
              <p className="text-lg font-semibold">{hostingData.stat?.mg ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Responses</p>
              <p className="text-lg font-semibold">{hostingData.stat?.resp ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mail Lists</p>
              <p className="text-lg font-semibold">{hostingData.stat?.maillists ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">MSSQL Databases</p>
              <p className="text-lg font-semibold">{hostingData.stat?.mssql_db ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Yesterday's Traffic</p>
              <p className="text-lg font-semibold">{formatTraffic(hostingData.stat?.traffic_prevday ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
