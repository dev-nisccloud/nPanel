"use client";

import * as React from "react";
import { CheckCircle, XCircle, HardDrive, Wifi, Database as DatabaseIcon, Globe, ExternalLink, Copy, Eye, EyeOff, Edit, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

import { hostingDetailSchema } from "./hosting-detail-schema";
import { PageSpeedInsightsCard } from "./pagespeed-insights-card";

// ServiceSubscription status enum (UI layer - independent schema)
const serviceSubscriptionStatusSchema = z.enum([
	"ACTIVE",
	"PENDING",
	"SUSPENDED",
	"CANCELLED",
	"EXPIRED",
	"PROCESSING",
	"FAILED",
]);

// BillingCycle enum (UI layer - independent schema)
const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);

// ServiceSubscription schema (UI layer - dates as ISO strings from API)
const serviceSubscriptionSchema = z.object({
	id: z.string(),
	subscriptionDate: z.string().nullable(), // ISO date string from API
	billingCycle: billingCycleSchema,
	nextRenewalDate: z.string().nullable(), // ISO date string from API
	status: serviceSubscriptionStatusSchema,
	autoRenew: z.boolean(),
});

interface HostingOverviewProps {
  hostingData: z.infer<typeof hostingDetailSchema>;
  subscriptionData?: {
    id: string;
    billingCycle?: string;
    nextRenewalDate?: string | null; // ISO date string
    autoRenew?: boolean;
  } | null;
  serviceSubscriptionData?: z.infer<typeof serviceSubscriptionSchema> | null;
}

export function HostingOverview({ hostingData, subscriptionData, serviceSubscriptionData }: HostingOverviewProps) {
  const copyToClipboard = React.useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);
  const [showPassword, setShowPassword] = React.useState(false);

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

  const domainName = hostingData.gen_info?.name || "Not Available";
  const ipAddress = hostingData.hosting?.vrt_hst?.ip_address || "Not Available";
  const sslEnabled = getPropertyValue("ssl");
  const certificateName = getPropertyValue("certificate_name") || "Not Available";
  const ftpLogin = getPropertyValue("ftp_login") || "Not Available";
  const ftpPassword = getPropertyValue("ftp_password") || "Not Available";
  const ftpHost = `ftp://${ipAddress}`;
  const ftpPort = 21;

  return (
    <div className="space-y-6">
      {/* General Information & FTP Account - Two Cards (match agency layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Information Card - with ScrollArea and Subscription Date, Billing Cycle, Next Renewal Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Information
            </CardTitle>
            <CardDescription>Basic hosting account details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Domain Name</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-primary flex-1">{domainName}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`https://${domainName}`, "_blank", "noopener,noreferrer")}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Open in new tab</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open in new tab</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(domainName, "Domain name")}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy domain name</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy domain name</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-primary flex-1">{ipAddress}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(ipAddress, "IP address")}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy IP address</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy IP address</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">SSL Certificate</p>
                  <div>
                    {sslEnabled ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Enabled
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Disabled
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Certificate Name</p>
                  <p className="text-sm text-muted-foreground">{certificateName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Subscription Date</p>
                  <p className="text-base font-semibold">
                    {serviceSubscriptionData?.subscriptionDate ? new Date(serviceSubscriptionData.subscriptionDate).toLocaleDateString() : "Not Available"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
                  <p className="text-base font-semibold">
                    {serviceSubscriptionData?.billingCycle || subscriptionData?.billingCycle || "Not Available"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Next Renewal Date</p>
                  <p className="text-base font-semibold">
                    {serviceSubscriptionData?.nextRenewalDate ? new Date(serviceSubscriptionData.nextRenewalDate).toLocaleDateString() : subscriptionData?.nextRenewalDate ? new Date(subscriptionData.nextRenewalDate).toLocaleDateString() : "Not Available"}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* FTP Account Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  FTP Account
                </CardTitle>
                <CardDescription>FTP connection details</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Edit FTP password functionality coming soon")}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit FTP password</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit your FTP account password</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">FTP IP (Hostname)</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-primary flex-1">{ftpHost}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(ftpHost, "FTP hostname")}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy FTP hostname</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy FTP hostname</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">FTP Username</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-primary flex-1">{ftpLogin}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(String(ftpLogin), "FTP username")}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy FTP username</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy FTP username</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">FTP Port</p>
              <p className="text-base font-bold text-primary">{ftpPort}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Password</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-primary flex-1">{showPassword ? String(ftpPassword) : "••••••••"}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? "Hide" : "Show"} password</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showPassword ? "Hide" : "Show"} password</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(String(ftpPassword), "FTP password")}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy FTP password</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy FTP password</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage & Plan Limits - Side by side (match agency) */}
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
            {(() => {
              const used = hostingData.gen_info?.["real_size"] ?? 0;
              const hardLimit = getLimitValue("disk_space") || 1;
              const softLimit = getLimitValue("disk_space_soft");
              const percentage = Math.min(Math.round((used / hardLimit) * 100), 100);
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (percentage / 100) * circumference;
              let circleColor = "rgb(34 197 94)";
              let bgColor = "rgb(220 252 231)";
              let iconColor = "text-green-600";
              if (softLimit && softLimit > 0 && used >= softLimit) {
                if (percentage >= 95) { circleColor = "rgb(239 68 68)"; bgColor = "rgb(254 226 226)"; iconColor = "text-destructive"; }
                else { circleColor = "rgb(234 179 8)"; bgColor = "rgb(254 249 195)"; iconColor = "text-yellow-600"; }
              }
              return (
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="30" fill="none" stroke={bgColor} strokeWidth="6" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke={circleColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><HardDrive className={`h-4 w-4 ${iconColor}`} /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Disk Space</p>
                    <p className="text-sm font-semibold">{formatBytes(used)} / {formatBytes(hardLimit)}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% used{softLimit && softLimit > 0 && used >= softLimit && <span className="ml-1 text-yellow-600">(Warning threshold reached)</span>}</p>
                  </div>
                </div>
              );
            })()}
            {/* Traffic */}
            {(() => {
              const used = hostingData.stat?.traffic ?? 0;
              const hardLimit = getLimitValue("max_traffic") || 1;
              const softLimit = getLimitValue("max_traffic_soft");
              const percentage = Math.min(Math.round((used / hardLimit) * 100), 100);
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (percentage / 100) * circumference;
              let circleColor = "rgb(34 197 94)";
              let bgColor = "rgb(220 252 231)";
              let iconColor = "text-green-600";
              if (softLimit && softLimit > 0 && used >= softLimit) {
                if (percentage >= 95) { circleColor = "rgb(239 68 68)"; bgColor = "rgb(254 226 226)"; iconColor = "text-destructive"; }
                else { circleColor = "rgb(234 179 8)"; bgColor = "rgb(254 249 195)"; iconColor = "text-yellow-600"; }
              }
              return (
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="30" fill="none" stroke={bgColor} strokeWidth="6" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke={circleColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><Wifi className={`h-4 w-4 ${iconColor}`} /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Monthly Traffic</p>
                    <p className="text-sm font-semibold">{formatTraffic(used)} / {formatTraffic(hardLimit)}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% used{softLimit && softLimit > 0 && used >= softLimit && <span className="ml-1 text-yellow-600">(Warning threshold reached)</span>}</p>
                  </div>
                </div>
              );
            })()}
            {/* Mailboxes */}
            {(() => {
              const used = hostingData.stat?.box ?? 0;
              const limit = getLimitValue("max_box") || 1;
              const percentage = Math.min(Math.round((used / limit) * 100), 100);
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (percentage / 100) * circumference;
              const isHighUsage = percentage >= 80;
              return (
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="30" fill="none" stroke={isHighUsage ? "rgb(254 226 226)" : "rgb(220 252 231)"} strokeWidth="6" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke={isHighUsage ? "rgb(239 68 68)" : "rgb(34 197 94)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><Mail className={`h-4 w-4 ${isHighUsage ? "text-destructive" : "text-green-600"}`} /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Mailboxes</p>
                    <p className="text-sm font-semibold">{used} / {limit}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% used</p>
                  </div>
                </div>
              );
            })()}
            {/* Databases */}
            {(() => {
              const used = hostingData.stat?.db ?? 0;
              const limit = getLimitValue("max_db") || 1;
              const percentage = Math.min(Math.round((used / limit) * 100), 100);
              const radius = 30;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (percentage / 100) * circumference;
              const isHighUsage = percentage >= 80;
              return (
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="30" fill="none" stroke={isHighUsage ? "rgb(254 226 226)" : "rgb(220 252 231)"} strokeWidth="6" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke={isHighUsage ? "rgb(239 68 68)" : "rgb(34 197 94)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><DatabaseIcon className={`h-4 w-4 ${isHighUsage ? "text-destructive" : "text-green-600"}`} /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Databases</p>
                    <p className="text-sm font-semibold">{used} / {limit}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% used</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Plan Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Plan Limits
            </CardTitle>
            <CardDescription>Maximum allowed resources for this hosting plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm font-medium text-muted-foreground">Max Sites</p><p className="text-lg font-semibold">{getLimitValue("max_site") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Max Subdomains</p><p className="text-lg font-semibold">{getLimitValue("max_subdom") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Max Domain Aliases</p><p className="text-lg font-semibold">{getLimitValue("max_dom_aliases") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Max FTP Users</p><p className="text-lg font-semibold">{getLimitValue("max_subftp_users") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Max Web Users</p><p className="text-lg font-semibold">{getLimitValue("max_wu") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Max Mail Lists</p><p className="text-lg font-semibold">{getLimitValue("max_maillists") || 0}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Mailbox Quota</p><p className="text-lg font-semibold">{formatBytes(getLimitValue("mbox_quota") || 0)}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Overuse Policy</p><p className="text-lg font-semibold capitalize">{hostingData.limits?.overuse === "block" ? "Blocked" : hostingData.limits?.overuse === "normal" ? "Allowed" : "Not Set"}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PageSpeed Insights */}
      {domainName && domainName !== "Not Available" && (
        <PageSpeedInsightsCard domainName={domainName} />
      )}
    </div>
  );
}
