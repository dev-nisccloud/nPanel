"use client";

import * as React from "react";
import { CheckCircle, XCircle, HardDrive, Wifi, Database as DatabaseIcon, Globe, ExternalLink, Copy, Eye, EyeOff, Mail, Layers, Users, List, Network, Folder, Zap, Shield, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { trpc } from "@/utils/trpc";

import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { PageSpeedInsightsCard } from "@/components/hosting/pagespeed-insights-card";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";
import {
  finitePositiveCap,
  formatPleskBytesLimit,
  formatPleskCountLimit,
  formatStatCount,
  parseStatCount,
  siteUsageFromStat,
  usagePercent,
} from "@/lib/plesk-limits-display";

export type HostingDetailTab =
  | "overview"
  | "dns"
  | "mail"
  | "file-manager"
  | "subdomains"
  | "databases"
  | "wordpress"
  | "backup-restore";

export interface HostingOverviewProps {
  hostingData: z.infer<typeof hostingDetailSchema>;
  /** Agency-only: show overuse policy. Customer sees disk quota instead. */
  showOverusePolicy?: boolean;
  /** Customer team slug, used to scope the linked billing subscription. */
  teamSlug?: string;
  /** Switch the parent detail page to another tab; optionally open that tab's create sheet */
  onNavigateTab?: (tab: HostingDetailTab, options?: { openCreate?: boolean }) => void;
}

const QUICK_ACTIONS: Array<{
  tab: HostingDetailTab;
  label: string;
  description: string;
  createLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  hasCreate: boolean;
}> = [
  {
    tab: "dns",
    label: "DNS",
    description: "DNS records",
    createLabel: "Create",
    icon: Network,
    hasCreate: true,
  },
  {
    tab: "mail",
    label: "Email",
    description: "Mailboxes",
    createLabel: "Create",
    icon: Mail,
    hasCreate: true,
  },
  {
    tab: "file-manager",
    label: "Files",
    description: "File manager",
    createLabel: "Upload",
    icon: Folder,
    hasCreate: true,
  },
  {
    tab: "databases",
    label: "Databases",
    description: "MySQL / PostgreSQL",
    createLabel: "Create",
    icon: DatabaseIcon,
    hasCreate: true,
  },
  {
    tab: "subdomains",
    label: "Subdomains",
    description: "Add-on domains",
    createLabel: "Create",
    icon: Layers,
    hasCreate: true,
  },
  {
    tab: "wordpress",
    label: "WordPress",
    description: "Installations",
    createLabel: "Install",
    icon: Icons.Wordpress,
    hasCreate: true,
  },
];

type UsageTone = "ok" | "warn" | "critical" | "neutral";

/** Disk/traffic: red near/at hard cap; amber on soft cap or high usage. */
function softCapUsageTone(percentage: number | null, softReached: boolean): UsageTone {
  if (percentage === null) return "neutral";
  if (percentage >= 95) return "critical";
  if (softReached || percentage >= 80) return "warn";
  return "ok";
}

/** Count quotas: green under 80%, amber 80–94%, red at ≥95%. */
function countUsageTone(percentage: number | null): UsageTone {
  if (percentage === null) return "neutral";
  if (percentage >= 95) return "critical";
  if (percentage >= 80) return "warn";
  return "ok";
}

function usageStroke(tone: UsageTone) {
  switch (tone) {
    case "critical":
      return "stroke-red-500";
    case "warn":
      return "stroke-amber-500";
    case "ok":
      return "stroke-emerald-500";
    default:
      return "stroke-muted-foreground/30";
  }
}

function usageText(tone: UsageTone) {
  switch (tone) {
    case "critical":
      return "text-red-600 dark:text-red-400";
    case "warn":
      return "text-amber-600 dark:text-amber-400";
    case "ok":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-muted-foreground";
  }
}

function UsageRing({
  percentage,
  tone,
  icon,
}: {
  percentage: number | null;
  tone: UsageTone;
  icon: React.ReactNode;
}) {
  const size = 56;
  const stroke = 9;
  const view = 100;
  const center = 50;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = percentage ?? 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${view} ${view}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={usageStroke(tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={percentage === null ? circumference : offset}
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center", usageText(tone))}>
        {icon}
      </div>
    </div>
  );
}

function UsageCell({
  label,
  value,
  hint,
  percentage,
  tone,
  icon,
  warnNote,
}: {
  label: string;
  value: string;
  hint: string;
  percentage: number | null;
  tone: UsageTone;
  icon: React.ReactNode;
  warnNote?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <UsageRing percentage={percentage} tone={tone} icon={icon} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-primary">{value}</p>
        <p className="text-xs text-muted-foreground">
          {hint}
          {warnNote ? (
            <span className="ml-1 text-amber-600 dark:text-amber-400">{warnNote}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  BIENNIALLY: "Every 2 years",
  CUSTOM: "Custom",
  ONE_TIME: "One-time",
};

const SUBSCRIPTION_STATUS_BADGE_CLASS: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
  SUSPENDED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200 dark:border-orange-800",
  CANCELLED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
  EXPIRED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
  PROCESSING:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  FAILED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatOverviewDate(value: string | Date | null | undefined) {
  if (!value) return "Not available";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AssuranceBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function HostingAccountStatusBadge({ status }: { status?: number | null }) {
  const isActive = status === 0;
  return (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={
        isActive
          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
          : undefined
      }
    >
      {isActive ? "Active" : "Suspended"}
    </Badge>
  );
}

function LimitCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-primary">{value}</p>
    </div>
  );
}

function CopyButton({
  value,
  label,
  onCopy,
}: {
  value: string;
  label: string;
  onCopy: (text: string, label: string) => void | Promise<void>;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void onCopy(value, label);
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}

export function HostingOverview({
  hostingData,
  showOverusePolicy = true,
  teamSlug,
  onNavigateTab,
}: HostingOverviewProps) {
  const billingQuery = trpc.clientSubscriptions.getHostingOverviewBilling.useQuery(
    {
      pleskSubscriptionId: hostingData.id,
      domain: hostingData.gen_info?.name,
      ...(teamSlug ? { teamSlug } : {}),
    },
    { enabled: Number.isFinite(hostingData.id) },
  );
  const linkedSubscription = billingQuery.data?.subscription ?? null;
  const planName = billingQuery.data?.planName?.trim() || null;
  const renewalDate = linkedSubscription?.expiryDate ?? linkedSubscription?.nextRenewalDate ?? null;
  const renewalLabel = linkedSubscription?.expiryDate ? "Expires" : "Next renewal";

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes < 0) return "-";
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

  // Copy to clipboard helper (Clipboard API + textarea fallback)
  const copyToClipboard = React.useCallback(async (text: string, label: string) => {
    const value = String(text ?? "").trim();
    if (!value || value === "Not Available") {
      toast.error(`No ${label.toLowerCase()} to copy`);
      return;
    }
    const ok = await copyTextToClipboard(value);
    if (ok) {
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error("Could not copy. Try selecting the value and copying manually.");
    }
  }, []);

  // Password visibility state
  const [showPassword, setShowPassword] = React.useState(false);

  // Get values
  const domainName = hostingData.gen_info?.name || "Not Available";
  const ipAddress = hostingData.hosting?.vrt_hst?.ip_address || "Not Available";
  const createdAtRaw = hostingData.gen_info?.["cr_date"];
  const createdAt = (() => {
    if (!createdAtRaw) return "Not Available";
    const date = new Date(createdAtRaw);
    if (Number.isNaN(date.getTime())) return String(createdAtRaw);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();
  const sslEnabled = getPropertyValue("ssl");
  const ftpLogin = getPropertyValue("ftp_login") || "Not Available";
  const ftpPassword = getPropertyValue("ftp_password") || "Not Available";
  const ftpHost = `ftp://${ipAddress}`;
  const ftpPort = 21;

  return (
    <div className="space-y-6">
      {/* General Information & Security & Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* General Information */}
        <Card className="flex h-full flex-col overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4 text-muted-foreground" />
              General Information
            </CardTitle>
            <CardDescription className="text-xs">
              Basic hosting account details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex h-full flex-1 flex-col divide-y divide-border">
              {/* Domain + Created */}
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Domain Name</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-medium text-primary flex-1">
                      {domainName}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Open in new tab"
                      aria-label="Open in new tab"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          `https://${domainName}`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <CopyButton
                      value={domainName}
                      label="Domain name"
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="truncate text-sm font-medium text-primary">
                    {createdAt}
                  </p>
                </div>
              </div>

              {/* Status + SSL */}
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <HostingAccountStatusBadge status={hostingData.gen_info?.status} />
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">SSL Certificate</p>
                  <div>
                    {sslEnabled ? (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Plan, and billing details when a subscription is linked */}
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div
                  className={cn(
                    "space-y-1 px-4 py-3",
                    !billingQuery.isLoading && !linkedSubscription && "sm:col-span-2",
                  )}
                >
                  <p className="text-xs text-muted-foreground">Plan</p>
                  {billingQuery.isLoading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : (
                    <p className="truncate text-sm font-medium text-primary">
                      {planName || "Not available"}
                    </p>
                  )}
                </div>
                {linkedSubscription ? (
                  <div className="space-y-1 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Subscription</p>
                    <Badge
                      variant="outline"
                      className={SUBSCRIPTION_STATUS_BADGE_CLASS[linkedSubscription.status]}
                    >
                      {formatEnumLabel(linkedSubscription.status)}
                    </Badge>
                  </div>
                ) : billingQuery.isLoading ? (
                  <div className="space-y-1 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Subscription</p>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : null}
              </div>

              {linkedSubscription ? (
                <>
                  <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="space-y-1 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Billing cycle</p>
                      <p className="truncate text-sm font-medium text-primary">
                        {linkedSubscription.billingCycle
                          ? BILLING_CYCLE_LABELS[linkedSubscription.billingCycle] ??
                            formatEnumLabel(linkedSubscription.billingCycle)
                          : "Not available"}
                      </p>
                    </div>
                    <div className="space-y-1 px-4 py-3">
                      <p className="text-xs text-muted-foreground">{renewalLabel}</p>
                      <p className="truncate text-sm font-medium text-primary">
                        {formatOverviewDate(renewalDate)}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Security & Access */}
        <Card className="flex h-full flex-col overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Security & Access
            </CardTitle>
            <CardDescription className="text-xs">
              Protection and connection details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex h-full flex-1 flex-col divide-y divide-border">
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Malware protection</p>
                  <AssuranceBadge
                    icon={ShieldCheck}
                    label="Malware protected"
                    className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200"
                  />
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Security</p>
                  <AssuranceBadge
                    icon={Shield}
                    label="Security protected"
                    className="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                  />
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">FTP Hostname</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-medium text-primary flex-1">
                      {ftpHost}
                    </p>
                    <CopyButton
                      value={ftpHost}
                      label="FTP hostname"
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">FTP Username</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-medium text-primary flex-1">
                      {String(ftpLogin)}
                    </p>
                    <CopyButton
                      value={String(ftpLogin)}
                      label="FTP username"
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">FTP Port</p>
                  <p className="text-sm font-medium text-primary">{ftpPort}</p>
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Password</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate font-mono text-sm font-medium text-primary flex-1">
                      {showPassword ? String(ftpPassword) : "••••••••"}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword((prev) => !prev);
                      }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <CopyButton
                      value={String(ftpPassword)}
                      label="FTP password"
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="space-y-1 px-4 py-3">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-medium text-primary flex-1">
                      {ipAddress}
                    </p>
                    <CopyButton
                      value={ipAddress}
                      label="IP address"
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
                <div className="px-4 py-3" aria-hidden />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage & Plan Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage */}
        {(() => {
          const diskUsed = hostingData.gen_info?.["real_size"] ?? 0;
          const diskRaw = getLimitValue("disk_space");
          const diskHard = finitePositiveCap(diskRaw);
          const diskSoft = finitePositiveCap(getLimitValue("disk_space_soft"));
          const diskPct = usagePercent(diskUsed, diskHard);
          const diskSoftReached =
            diskHard !== null && diskSoft !== null && diskSoft > 0 && diskUsed >= diskSoft;
          const diskTone = softCapUsageTone(diskPct, diskSoftReached);

          const trafficUsed = hostingData.stat?.traffic ?? 0;
          const trafficRaw = getLimitValue("max_traffic");
          const trafficHard = finitePositiveCap(trafficRaw);
          const trafficSoft = finitePositiveCap(getLimitValue("max_traffic_soft"));
          const trafficPct = usagePercent(trafficUsed, trafficHard);
          const trafficSoftReached =
            trafficHard !== null &&
            trafficSoft !== null &&
            trafficSoft > 0 &&
            trafficUsed >= trafficSoft;
          const trafficTone = softCapUsageTone(trafficPct, trafficSoftReached);

          const boxUsed = parseStatCount(hostingData.stat?.box);
          const boxRaw = getLimitValue("max_box");
          const boxPct = usagePercent(boxUsed ?? 0, finitePositiveCap(boxRaw));
          const boxTone = countUsageTone(boxUsed === null ? null : boxPct);

          const dbUsed = parseStatCount(hostingData.stat?.db);
          const dbRaw = getLimitValue("max_db");
          const dbPct = usagePercent(dbUsed ?? 0, finitePositiveCap(dbRaw));
          const dbTone = countUsageTone(dbUsed === null ? null : dbPct);

          const sitesUsed = siteUsageFromStat(hostingData.stat);
          const sitesRaw = getLimitValue("max_site");
          const sitesPct = usagePercent(sitesUsed ?? 0, finitePositiveCap(sitesRaw));
          const sitesTone = countUsageTone(sitesUsed === null ? null : sitesPct);

          const subdomUsed = parseStatCount(hostingData.stat?.subdom);
          const subdomRaw = getLimitValue("max_subdom");
          const subdomPct = usagePercent(subdomUsed ?? 0, finitePositiveCap(subdomRaw));
          const subdomTone = countUsageTone(subdomUsed === null ? null : subdomPct);

          const wuUsed = parseStatCount(hostingData.stat?.wu);
          const wuRaw = getLimitValue("max_wu");
          const wuPct = usagePercent(wuUsed ?? 0, finitePositiveCap(wuRaw));
          const wuTone = countUsageTone(wuUsed === null ? null : wuPct);

          const maillistsUsed = parseStatCount(hostingData.stat?.maillists);
          const maillistsRaw = getLimitValue("max_maillists");
          const maillistsPct = usagePercent(maillistsUsed ?? 0, finitePositiveCap(maillistsRaw));
          const maillistsTone = countUsageTone(maillistsUsed === null ? null : maillistsPct);

          return (
            <Card className="overflow-hidden py-0 gap-0">
              <CardHeader className="border-b bg-muted/30 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Resource Usage
                </CardTitle>
                <CardDescription className="text-xs">
                  Current usage against plan quotas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <UsageCell
                      label="Disk Space"
                      value={`${formatBytes(diskUsed)} / ${formatPleskBytesLimit(diskRaw, formatBytes)}`}
                      hint={diskPct !== null ? `${diskPct}% used` : "Unlimited quota"}
                      percentage={diskPct}
                      tone={diskTone}
                      icon={<HardDrive className="h-4 w-4" />}
                      warnNote={diskSoftReached ? "(Warning threshold reached)" : undefined}
                    />
                    <UsageCell
                      label="Monthly Traffic"
                      value={`${formatTraffic(trafficUsed)} / ${formatPleskBytesLimit(trafficRaw, formatTraffic)}`}
                      hint={trafficPct !== null ? `${trafficPct}% used` : "Unlimited quota"}
                      percentage={trafficPct}
                      tone={trafficTone}
                      icon={<Wifi className="h-4 w-4" />}
                      warnNote={trafficSoftReached ? "(Warning threshold reached)" : undefined}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <UsageCell
                      label="Mailboxes"
                      value={`${formatStatCount(boxUsed)} / ${formatPleskCountLimit(boxRaw)}`}
                      hint={
                        boxUsed === null
                          ? "Usage unavailable"
                          : boxPct !== null
                            ? `${boxPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={boxUsed === null ? null : boxPct}
                      tone={boxTone}
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <UsageCell
                      label="Databases"
                      value={`${formatStatCount(dbUsed)} / ${formatPleskCountLimit(dbRaw)}`}
                      hint={
                        dbUsed === null
                          ? "Usage unavailable"
                          : dbPct !== null
                            ? `${dbPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={dbUsed === null ? null : dbPct}
                      tone={dbTone}
                      icon={<DatabaseIcon className="h-4 w-4" />}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <UsageCell
                      label="Sites"
                      value={`${formatStatCount(sitesUsed)} / ${formatPleskCountLimit(sitesRaw)}`}
                      hint={
                        sitesUsed === null
                          ? "Usage unavailable"
                          : sitesPct !== null
                            ? `${sitesPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={sitesUsed === null ? null : sitesPct}
                      tone={sitesTone}
                      icon={<Globe className="h-4 w-4" />}
                    />
                    <UsageCell
                      label="Subdomains"
                      value={`${formatStatCount(subdomUsed)} / ${formatPleskCountLimit(subdomRaw)}`}
                      hint={
                        subdomUsed === null
                          ? "Usage unavailable"
                          : subdomPct !== null
                            ? `${subdomPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={subdomUsed === null ? null : subdomPct}
                      tone={subdomTone}
                      icon={<Layers className="h-4 w-4" />}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <UsageCell
                      label="Web Users"
                      value={`${formatStatCount(wuUsed)} / ${formatPleskCountLimit(wuRaw)}`}
                      hint={
                        wuUsed === null
                          ? "Usage unavailable"
                          : wuPct !== null
                            ? `${wuPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={wuUsed === null ? null : wuPct}
                      tone={wuTone}
                      icon={<Users className="h-4 w-4" />}
                    />
                    <UsageCell
                      label="Mail Lists"
                      value={`${formatStatCount(maillistsUsed)} / ${formatPleskCountLimit(maillistsRaw)}`}
                      hint={
                        maillistsUsed === null
                          ? "Usage unavailable"
                          : maillistsPct !== null
                            ? `${maillistsPct}% used`
                            : "Unlimited quota"
                      }
                      percentage={maillistsUsed === null ? null : maillistsPct}
                      tone={maillistsTone}
                      icon={<List className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Plan Limits */}
        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
              Plan Limits
            </CardTitle>
            <CardDescription className="text-xs">
              Maximum allowed resources for this hosting plan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <LimitCell label="Max Sites" value={formatPleskCountLimit(getLimitValue("max_site"))} />
                <LimitCell
                  label="Max Subdomains"
                  value={formatPleskCountLimit(getLimitValue("max_subdom"))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <LimitCell
                  label="Max Domain Aliases"
                  value={formatPleskCountLimit(getLimitValue("max_dom_aliases"))}
                />
                <LimitCell
                  label="Max FTP Users"
                  value={formatPleskCountLimit(getLimitValue("max_subftp_users"))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <LimitCell label="Max Web Users" value={formatPleskCountLimit(getLimitValue("max_wu"))} />
                <LimitCell
                  label="Max Mail Lists"
                  value={formatPleskCountLimit(getLimitValue("max_maillists"))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <LimitCell
                  label="Max Mailboxes"
                  value={formatPleskCountLimit(getLimitValue("max_box"))}
                />
                <LimitCell
                  label="Max Databases"
                  value={formatPleskCountLimit(getLimitValue("max_db"))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <LimitCell
                  label="Mailbox Quota"
                  value={formatPleskBytesLimit(getLimitValue("mbox_quota"), formatBytes)}
                />
                {showOverusePolicy ? (
                  <LimitCell
                    label="Overuse Policy"
                    value={
                      hostingData.limits?.overuse === "block"
                        ? "Blocked"
                        : hostingData.limits?.overuse === "normal"
                          ? "Allowed"
                          : "Not Set"
                    }
                  />
                ) : (
                  <LimitCell
                    label="Disk Quota"
                    value={formatPleskBytesLimit(getLimitValue("disk_space"), formatBytes)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {domainName && domainName !== "Not Available" ? (
          <PageSpeedInsightsCard domainName={domainName} />
        ) : (
          <Card className="overflow-hidden py-0 gap-0">
            <CardHeader className="border-b bg-muted/30 px-4 py-3">
              <CardTitle className="text-sm font-semibold">Performance</CardTitle>
              <CardDescription className="text-xs">
                Domain required to run a speed test
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-8">
              <p className="text-sm text-muted-foreground">
                No domain is available for PageSpeed Insights on this subscription.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden py-0 gap-0">
          <CardHeader className="border-b bg-muted/30 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs">
              Jump to common management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.tab}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium text-primary">
                        {action.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={!onNavigateTab}
                        onClick={() => onNavigateTab?.(action.tab)}
                      >
                        View
                      </Button>
                      {action.hasCreate ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          disabled={!onNavigateTab}
                          onClick={() =>
                            onNavigateTab?.(action.tab, { openCreate: true })
                          }
                        >
                          {action.createLabel}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
