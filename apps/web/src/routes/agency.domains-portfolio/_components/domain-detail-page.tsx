"use client";

import * as React from "react";
import { ArrowLeft, ExternalLink, Info, QrCode, Monitor, LayoutDashboard, Network, Server, Globe, Code2, AlertCircle, Calendar, MoreVertical, RefreshCw, FilePlus2, Link2 } from "lucide-react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { DetailCardTabsTrigger } from "@/components/ui/detail-card-tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/sonner";
import { QrCodeDialog } from "./qr-code-dialog";
import { HostingPlanDialog } from "./hosting-plan-dialog";
import { ProtectBrandTab } from "./protect-brand-tab";
import { DnsTab } from "./dns-tab";
import { NameserversTab } from "./nameservers-tab";
import { WebDesignContactDialog } from "./web-design-contact-dialog";
import { CreateSubscriptionFromDomainDialog } from "./create-subscription-from-domain-dialog";
import { LinkKenicDomainToTeamDialog } from "./link-kenic-domain-to-team-dialog";
import { DomainPortfolioContactInfo, type KenicRegistrantInfo } from "./domain-portfolio-contact-info";
import { DomainTransferSecuritySection } from "@/components/domain-transfer-security-section";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DomainDetailPageProps {
  domainId: string;
}

export function DomainDetailPage({ domainId }: DomainDetailPageProps) {
  const navigate = useNavigate();
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  const [hostingDialogOpen, setHostingDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [hostingPlanType, setHostingPlanType] = React.useState<"web" | "email" | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [webDesignDialogOpen, setWebDesignDialogOpen] = React.useState(false);
  const [createSubscriptionDialogOpen, setCreateSubscriptionDialogOpen] = React.useState(false);
  const [linkToTeamDialogOpen, setLinkToTeamDialogOpen] = React.useState(false);

  // 1. Fetch OpenProvider domains
  const { data: session } = authClient.useSession();
  const canEditContacts =
    (session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";

  const { data: opDomainsData, isLoading: isOpLoading, refetch: refetchOpDomains } = trpc.openProvider.domains.list.useQuery(
    {
      limit: 1000,
      offset: 0,
      with_customer_info: false,
    }
  );

  // 2. Fetch KENIC domains (ledger from DB)
  const { data: kenicDomainsData, isLoading: isKenicLoading } = trpc.kenic.domainList.list.useQuery({});

  // 3. Find the specific domain in either list
  const domain = React.useMemo(() => {
    const opDomains = (opDomainsData?.data ?? []) as DomainPortfolio[];
    const kenicDomains = (kenicDomainsData?.data ?? []) as DomainPortfolio[];
    
    // Check OpenProvider domains
    const opMatch = opDomains.find((d) => d.id === domainId);
    if (opMatch) return { ...opMatch, source: "openprovider" as const };
    
    // Check KENIC domains
    const kenicMatch = kenicDomains.find((d) => d.id === domainId);
    if (kenicMatch) return { ...kenicMatch, source: "kenic" as const };
    
    return null;
  }, [opDomainsData, kenicDomainsData, domainId]);

  // 4. Fetch live KENIC info if applicable
  const {
    data: kenicLiveInfo,
    isLoading: isKenicLiveLoading,
    refetch: refetchKenicLiveInfo,
  } = trpc.kenic.domainList.info.useQuery(
    { domain: domain?.domain ?? "" },
    { enabled: !!domain && (domain as any)?.source === "kenic" }
  );

  // 5. Merge live info
  const mergedDomain = React.useMemo(() => {
    if (!domain) return null;
    if ((domain as any).source === "kenic" && kenicLiveInfo?.data) {
      return {
        ...domain,
        nameservers: kenicLiveInfo.data.nameservers,
        status: (kenicLiveInfo.data.status as DomainPortfolio["status"]) ?? domain.status,
        expiryDate: kenicLiveInfo.data.exDate || domain.expiryDate,
        registrationDate: kenicLiveInfo.data.crDate || domain.registrationDate,
        registrantInfo: kenicLiveInfo.data.registrantInfo,
        isLocked: kenicLiveInfo.data.isTransferLocked ?? domain.isLocked,
      };
    }
    return domain;
  }, [domain, kenicLiveInfo]);

  const isLoading = isOpLoading || isKenicLoading || isKenicLiveLoading;

  const isKenic = (mergedDomain as any)?.source === "kenic";

  const openProviderId = mergedDomain && !isKenic
    ? typeof mergedDomain.id === "string"
      ? Number.parseInt(mergedDomain.id, 10)
      : mergedDomain.id
    : null;

  const { data: opSubscription } = trpc.clientSubscriptions.getByOpenProviderId.useQuery(
    { openProviderId: openProviderId! },
    { enabled: openProviderId != null && !Number.isNaN(openProviderId) }
  );

  // For KENIC, the domain.id is `kenic-${subscriptionId}`
  const kenicSubscriptionId = isKenic && mergedDomain ? mergedDomain.id.replace("kenic-", "") : null;
  const { data: kenicSubscription } = trpc.clientSubscriptions.getById.useQuery(
    { id: kenicSubscriptionId! },
    { enabled: !!kenicSubscriptionId }
  );

  const existingSubscription = isKenic ? kenicSubscription : opSubscription;
  const hasExistingSubscription = !!existingSubscription;
  const kenicNeedsTeamLink = isKenic && !!kenicSubscription && !kenicSubscription.teamId;

  const kenicStatuses = kenicLiveInfo?.data?.allStatuses ?? [];
  const kenicIsLocked =
    kenicLiveInfo?.data?.isTransferLocked ??
    kenicStatuses.some(
      (s: { status?: string }) => s.status?.toLowerCase() === "clienttransferprohibited"
    );
  const kenicServerTransferLocked =
    kenicLiveInfo?.data?.isServerTransferLocked ??
    kenicStatuses.some(
      (s: { status?: string }) => s.status?.toLowerCase() === "servertransferprohibited"
    );

  const domainNameWithoutTld = React.useMemo(() => {
    if (!mergedDomain?.domain) return "";
    const parts = mergedDomain.domain.split(".");
    if (parts.length > 1) {
      return parts.slice(0, -1).join(".");
    }
    return mergedDomain.domain;
  }, [mergedDomain]);

  const shouldShowRenew = React.useMemo(() => {
    if (!mergedDomain) return false;
    const expiryDate = new Date(mergedDomain.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  }, [mergedDomain]);

  const handleHostingClick = (type: "web" | "email") => {
    setHostingPlanType(type);
    if (type === "web") {
      setHostingDialogOpen(true);
    } else {
      setEmailDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">Domain not found</p>
            <Button onClick={() => navigate("/agency/domains-portfolio")} variant="outline">
              Back to Portfolio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
    };

    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    };

    return (
      <Badge
        variant={variants[mergedDomain!.status] || "secondary"}
        className={`text-xs ${statusColors[mergedDomain!.status] || ""}`}
      >
        {mergedDomain!.status}
      </Badge>
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/agency/domains-portfolio">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Domain Details</h1>
              <p className="text-xs text-muted-foreground">Manage and monitor your domain</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isKenic && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <DropdownMenuItem
                          onClick={() => !hasExistingSubscription && setCreateSubscriptionDialogOpen(true)}
                          disabled={hasExistingSubscription}
                        >
                          <FilePlus2 className="h-4 w-4 mr-2" />
                          Create subscription
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      {hasExistingSubscription
                        ? "This domain already has a connected subscription. To connect you need to first suspend the existing to connect it."
                        : "Create a Nisc subscription for this domain and link it to a user or organization."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {kenicNeedsTeamLink && (
                <DropdownMenuItem onClick={() => setLinkToTeamDialogOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to organization
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-4 h-auto p-0 bg-transparent">
              <DetailCardTabsTrigger layout="fluid" value="overview" icon={LayoutDashboard} title="Overview" subtitle="Details" />
              <DetailCardTabsTrigger layout="fluid" value="dns" icon={Network} title="DNS" subtitle="Records" />
              <DetailCardTabsTrigger layout="fluid" value="nameservers" icon={Server} title="Nameservers" subtitle="Configuration" />
              <DetailCardTabsTrigger layout="fluid" value="protect-brand" icon={Globe} title="Protect Brand" subtitle="Extensions" />
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Connected Services: Plesk lookup + "Manage your website" or upsell cards */}
                  <ConnectedServicesSection
                    domainName={mergedDomain.domain}
                    onHostingClick={handleHostingClick}
                  />

                  {/* Tools Section */}
                  <ToolsSection
                    domain={mergedDomain.domain}
                    onQrCodeClick={() => setQrDialogOpen(true)}
                    onWebDesignClick={() => setWebDesignDialogOpen(true)}
                  />
                </div>

                {/* Right Column - Domain Info */}
                <div className="space-y-6">
                  {/* Domain Header Card */}
                  <DomainHeaderCard
                    domain={mergedDomain as DomainPortfolio}
                    getStatusBadge={getStatusBadge}
                    shouldShowRenew={shouldShowRenew}
                    source={(mergedDomain as { source?: "kenic" | "openprovider" }).source ?? "openprovider"}
                    openProviderId={openProviderId}
                    kenicIsLocked={kenicIsLocked}
                    kenicServerTransferLocked={kenicServerTransferLocked}
                    onKenicAuthCodeUpdated={() => void refetchKenicLiveInfo()}
                    onKenicLockUpdated={() => void refetchKenicLiveInfo()}
                  />

                  {/* Contact Information Card */}
                  <DomainPortfolioContactInfo
                    domain={mergedDomain as DomainPortfolio}
                    source={(mergedDomain as { source?: "kenic" | "openprovider" }).source}
                    registrantInfo={(mergedDomain as { registrantInfo?: KenicRegistrantInfo }).registrantInfo}
                    canEdit={canEditContacts}
                    onContactUpdated={async () => {
                      if ((mergedDomain as { source?: string }).source === "kenic") {
                        await refetchKenicLiveInfo();
                      } else {
                        await refetchOpDomains();
                      }
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dns" className="mt-6">
              <DnsTab domain={mergedDomain as DomainPortfolio} onHostingClick={handleHostingClick} />
            </TabsContent>

            <TabsContent value="nameservers" className="mt-6">
              <NameserversTab domain={mergedDomain as DomainPortfolio} />
            </TabsContent>

            <TabsContent value="protect-brand" className="mt-6">
              <ProtectBrandTab
                domainNameWithoutTld={domainNameWithoutTld}
                isActive={activeTab === "protect-brand"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <QrCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        domain={mergedDomain.domain}
      />
      <WebDesignContactDialog
        open={webDesignDialogOpen}
        onOpenChange={setWebDesignDialogOpen}
        domainName={mergedDomain.domain}
        supportPhoneNumber={import.meta.env.VITE_PUBLIC_SUPPORT_PHONE}
      />
      <HostingPlanDialog
        open={hostingDialogOpen}
        onOpenChange={setHostingDialogOpen}
        planType="web"
        domainName={mergedDomain.domain}
        buyDomainHref="/agency/domains"
      />
      <HostingPlanDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        planType="email"
        domainName={mergedDomain.domain}
        buyDomainHref="/agency/domains"
      />
      <CreateSubscriptionFromDomainDialog
        open={createSubscriptionDialogOpen}
        onOpenChange={setCreateSubscriptionDialogOpen}
        domain={mergedDomain as DomainPortfolio}
      />
      <LinkKenicDomainToTeamDialog
        open={linkToTeamDialogOpen}
        onOpenChange={setLinkToTeamDialogOpen}
        domain={
          mergedDomain
            ? { id: mergedDomain.id, domain: mergedDomain.domain }
            : null
        }
      />
    </div>
  );
}

// Connected Services Section: Plesk lookup by domain name, then "Manage your website" or upsell cards (tools-style layout, primary buttons)
function ConnectedServicesSection({
  domainName,
  onHostingClick,
}: {
  domainName: string;
  onHostingClick: (type: "web" | "email") => void;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.hosting.getHostingByDomainName.useQuery(
    { domainName },
    { enabled: !!domainName }
  );

  const hasHosting = data?.hasHosting ?? false;
  const subscriptionId = data?.subscriptionId ?? null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Connected Services</h2>
        {isLoading ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Checking for hosting linked to this domain…
            </p>
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-24 shrink-0" />
            </div>
          </div>
        ) : hasHosting && subscriptionId ? (
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <h3 className="font-medium">Manage your website</h3>
                <p className="text-sm text-muted-foreground">
                  Edit and manage the site that&apos;s accessible via your domain.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/agency/hosting/${subscriptionId}`)}
            >
              Manage site
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h3 className="font-medium">Get web hosting for your domain</h3>
                  <p className="text-sm text-muted-foreground">
                    Launch your website with our reliable hosting plans starting from KES 189/month
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => onHostingClick("web")}>
                View Hosting Plans
              </Button>
            </div>
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h3 className="font-medium">Get professional email accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Create business email addresses with your domain name
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => onHostingClick("email")}>
                View Email Plans
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Tools Section Component
function ToolsSection({
  domain,
  onQrCodeClick,
  onWebDesignClick
}: {
  domain: string;
  onQrCodeClick: () => void;
  onWebDesignClick: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tools</h2>
        <div className="space-y-4">
          {/* Professional Web Design & Development */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Code2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <h3 className="font-medium">Get a website built</h3>
                <p className="text-sm text-muted-foreground">
                  Ask for a quote. We design and build websites for your domain.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onWebDesignClick}
            >
              Get quote
            </Button>
          </div>

          {/* QR Code Generator */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Share your domain as a QR code</h3>
                <p className="text-sm text-muted-foreground">
                  Share a link to your domain in a scannable format.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onQrCodeClick}>
              Generate QR code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Domain Header Card Component
function DomainHeaderCard({
  domain,
  getStatusBadge,
  shouldShowRenew,
  source,
  openProviderId,
  kenicIsLocked,
  kenicServerTransferLocked,
  onKenicAuthCodeUpdated,
  onKenicLockUpdated,
}: {
  domain: DomainPortfolio;
  getStatusBadge: () => React.ReactNode;
  shouldShowRenew: boolean;
  source: "openprovider" | "kenic";
  openProviderId: number | null;
  kenicIsLocked?: boolean;
  kenicServerTransferLocked?: boolean;
  onKenicAuthCodeUpdated?: () => void;
  onKenicLockUpdated?: () => void;
}) {
  const expiryDate = new Date(domain.expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNearExpiry = daysUntilExpiry <= 30;

  const formattedDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Calculate progress percentage for circular indicator (~75-80% filled)
  const progressPercentage = 75; // Show 75% of the circle filled
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercentage / 100) * circumference;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lg hover:text-primary transition-colors flex items-center gap-2"
            >
              {domain.domain}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
          {getStatusBadge()}
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Circular Progress Indicator */}
            <div className="relative flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle (lighter shade - unfilled part) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isNearExpiry ? "rgb(254 226 226)" : "rgb(220 252 231)"}
                  strokeWidth="8"
                />
                {/* Progress circle (prominent color - filled part) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isNearExpiry ? "rgb(239 68 68)" : "rgb(34 197 94)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              {/* Calendar icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className={`h-6 w-6 ${isNearExpiry ? "text-destructive" : "text-green-600"}`} />
              </div>
            </div>
            {/* Expiration Date Section */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Expiration date</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>To avoid service interruptions it is recommended to renew your domain 30 days before expiry</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-base font-semibold">{formattedDate}</div>
              {shouldShowRenew && (
                <Button variant="link" className="p-0 h-auto text-primary text-sm mt-1">
                  Renew
                </Button>
              )}
            </div>
          </div>

          <DomainTransferSecuritySection
            source={source}
            domainName={domain.domain}
            openProviderId={openProviderId}
            isLocked={source === "kenic" ? kenicIsLocked : domain.isLocked}
            isLockable={source === "kenic" ? !kenicServerTransferLocked : domain.isLockable}
            isPrivateWhois={domain.isPrivateWhois}
            kenicServerTransferLocked={kenicServerTransferLocked}
            onKenicAuthCodeUpdated={onKenicAuthCodeUpdated}
            onKenicLockUpdated={onKenicLockUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
}
