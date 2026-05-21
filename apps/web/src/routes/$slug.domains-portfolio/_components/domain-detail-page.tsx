"use client";

import * as React from "react";
import { ArrowLeft, ExternalLink, Info, QrCode, Monitor, LayoutDashboard, Network, Server, Globe, ChevronRight, Code2, AlertCircle, Calendar, MoreVertical, RefreshCw, FilePlus2 } from "lucide-react";
import { Link } from "react-router";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { QrCodeDialog } from "./qr-code-dialog";
import { HostingPlanDialog } from "./hosting-plan-dialog";
import { ProtectBrandTab } from "./protect-brand-tab";
import { DnsTab } from "./dns-tab";
import { NameserversTab } from "./nameservers-tab";
import { WebDesignContactDialog } from "./web-design-contact-dialog";
import { CreateSubscriptionFromDomainDialog } from "./create-subscription-from-domain-dialog";
import { DomainPortfolioContactInfo } from "@/routes/agency.domains-portfolio/_components/domain-portfolio-contact-info";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DomainDetailPageProps {
  domainId: string;
}

const isAgencyRoute = (pathname: string) => pathname.startsWith("/agency/");

export function DomainDetailPage({ domainId }: DomainDetailPageProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  const isAgency = isAgencyRoute(pathname);

  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  const [hostingDialogOpen, setHostingDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [hostingPlanType, setHostingPlanType] = React.useState<"web" | "email" | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [webDesignDialogOpen, setWebDesignDialogOpen] = React.useState(false);
  const [createSubscriptionDialogOpen, setCreateSubscriptionDialogOpen] = React.useState(false);

  // Customer view: load subscription by id; teamSlug enforces access (subscription must belong to this team and user must be member)
  const { data: subscriptionById, isLoading: isLoadingSub } = trpc.clientSubscriptions.getById.useQuery(
    { id: domainId, teamSlug: !isAgency ? teamSlug : undefined },
    { enabled: !isAgency && !!teamSlug }
  );

  // Customer view with openProviderId: fetch that domain from OpenProvider to show full detail (DNS, nameservers, etc.)
  const domainNamePattern = React.useMemo(() => {
    if (isAgency || !subscriptionById?.primaryDomain) return undefined;
    const name = subscriptionById.primaryDomain;
    const parts = name.split(".");
    return parts.length > 1 ? parts[0] : name;
  }, [isAgency, subscriptionById?.primaryDomain]);

  const { data: customerDomainsData, isLoading: isLoadingCustomerDomain } = trpc.openProvider.domains.list.useQuery(
    {
      domain_name_pattern: domainNamePattern,
      limit: 100,
      offset: 0,
      with_customer_info: false,
    },
    { enabled: !isAgency && !!subscriptionById?.openProviderId && !!domainNamePattern }
  );

  const domainFromOpenProvider = React.useMemo(() => {
    if (isAgency || !subscriptionById?.openProviderId || !customerDomainsData?.data) return null;
    const idStr = String(subscriptionById.openProviderId);
    return (customerDomainsData.data as DomainPortfolio[]).find((d) => d.id === idStr) ?? null;
  }, [isAgency, subscriptionById?.openProviderId, customerDomainsData?.data]);

  // Agency view: fetch domains list from OpenProvider
  const { data: domainsData, isLoading: isLoadingDomains } = trpc.openProvider.domains.list.useQuery(
    {
      limit: 1000,
      offset: 0,
      with_customer_info: false,
    },
    { enabled: isAgency }
  );

  const domain = React.useMemo(() => {
    if (isAgency) {
      if (!domainsData?.data) return null;
      return (domainsData.data as DomainPortfolio[]).find((d) => d.id === domainId) ?? null;
    }
    return domainFromOpenProvider;
  }, [isAgency, domainsData?.data, domainId, domainFromOpenProvider]);

  const openProviderId = domain
    ? typeof domain.id === "string"
      ? Number.parseInt(domain.id, 10)
      : domain.id
    : null;
  const { data: existingSubscription } = trpc.clientSubscriptions.getByOpenProviderId.useQuery(
    { openProviderId: openProviderId! },
    { enabled: isAgency && openProviderId != null && !Number.isNaN(openProviderId) }
  );
  const hasExistingSubscription = !!existingSubscription;

  const domainNameWithoutTld = React.useMemo(() => {
    if (!domain?.domain) return "";
    // Extract domain name without TLD (e.g., "example.com" -> "example")
    const parts = domain.domain.split(".");
    if (parts.length > 1) {
      // Remove the last part (TLD) and join the rest
      return parts.slice(0, -1).join(".");
    }
    return domain.domain;
  }, [domain]);

  // Check if renew button should be shown (30 days before expiry)
  const shouldShowRenew = React.useMemo(() => {
    if (!domain) return false;
    const expiryDate = new Date(domain.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  }, [domain]);

  const handleHostingClick = (type: "web" | "email") => {
    setHostingPlanType(type);
    if (type === "web") {
      setHostingDialogOpen(true);
    } else {
      setEmailDialogOpen(true);
    }
  };

  const portfolioHref = isAgency ? "/agency/domains-portfolio" : `/${teamSlug}/domains-portfolio`;
  const domainsHref = isAgency ? "/agency/domains" : `/${teamSlug}/domains`;

  // Customer view: either full page (when domain from OpenProvider is available) or not found/unavailable. No subscription card.
  if (!isAgency) {
    if (isLoadingSub) {
      return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32" />
          </div>
        </div>
      );
    }
    if (!subscriptionById) {
      return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive mb-4">Subscription not found</p>
              <Button asChild variant="outline">
                <Link to={portfolioHref}>Back to My Domains</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    // Subscription has openProviderId and we're still fetching OpenProvider domain: show loading (no flash of card)
    const needsOpenProvider = !!subscriptionById.openProviderId && !!domainNamePattern;
    if (needsOpenProvider && isLoadingCustomerDomain) {
      return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32" />
          </div>
        </div>
      );
    }
    // No domain data: show unavailable (subscription exists but no OpenProvider link or domain not found)
    if (!domain) {
      return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button asChild variant="ghost" size="sm">
                <Link to={portfolioHref}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Domain details are unavailable for this subscription.</p>
              <Button asChild variant="outline">
                <Link to={portfolioHref}>Back to My Domains</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (isLoadingDomains) {
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
            <Button asChild variant="outline">
              <Link to={portfolioHref}>Back to Portfolio</Link>
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
        variant={variants[domain.status] || "secondary"}
        className={`text-xs ${statusColors[domain.status] || ""}`}
      >
        {domain.status}
      </Badge>
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={portfolioHref}>
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
          {isAgency && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                        : "Create a Nisc subscription for this domain and link it to a user or company."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-4 h-auto p-0 bg-transparent">
              <TabsTrigger
                value="overview"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Overview</span>
                  <span className="text-xs text-muted-foreground">Details</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="dns"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Network className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">DNS</span>
                  <span className="text-xs text-muted-foreground">Records</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="nameservers"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Server className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Nameservers</span>
                  <span className="text-xs text-muted-foreground">Configuration</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="protect-brand"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Globe className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Protect Brand</span>
                  <span className="text-xs text-muted-foreground">Extensions</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Connected Services: Plesk lookup + "Manage your website" or upsell cards */}
                  <ConnectedServicesSection
                    domainName={domain.domain}
                    onHostingClick={handleHostingClick}
                    isAgency={isAgency}
                    teamSlug={teamSlug}
                    customerTeamId={subscriptionById?.teamId ?? null}
                  />

                  {/* Tools Section */}
                  <ToolsSection
                    domain={domain.domain}
                    onQrCodeClick={() => setQrDialogOpen(true)}
                    onWebDesignClick={() => setWebDesignDialogOpen(true)}
                  />
                </div>

                {/* Right Column - Domain Info */}
                <div className="space-y-6">
                  {/* Domain Header Card */}
                  <DomainHeaderCard
                    domain={domain}
                    getStatusBadge={getStatusBadge}
                    shouldShowRenew={shouldShowRenew}
                  />

                  {/* Contact Information Card */}
                  <DomainPortfolioContactInfo domain={domain} source="openprovider" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dns" className="mt-6">
              <DnsTab domain={domain} onHostingClick={handleHostingClick} />
            </TabsContent>

            <TabsContent value="nameservers" className="mt-6">
              <NameserversTab domain={domain} />
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
        domain={domain.domain}
      />
      <WebDesignContactDialog
        open={webDesignDialogOpen}
        onOpenChange={setWebDesignDialogOpen}
        domainName={domain.domain}
        supportPhoneNumber={import.meta.env.VITE_PUBLIC_SUPPORT_PHONE}
      />
      <HostingPlanDialog
        open={hostingDialogOpen}
        onOpenChange={setHostingDialogOpen}
        planType="web"
        domainName={domain.domain}
        teamId={!isAgency ? subscriptionById?.teamId ?? null : null}
        buyDomainHref={
          isAgency ? "/agency/domains" : teamSlug ? `/${teamSlug}/domains` : undefined
        }
      />
      <HostingPlanDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        planType="email"
        domainName={domain.domain}
        teamId={!isAgency ? subscriptionById?.teamId ?? null : null}
        buyDomainHref={
          isAgency ? "/agency/domains" : teamSlug ? `/${teamSlug}/domains` : undefined
        }
      />
      <CreateSubscriptionFromDomainDialog
        open={createSubscriptionDialogOpen}
        onOpenChange={setCreateSubscriptionDialogOpen}
        domain={domain}
      />
    </div>
  );
}

// Connected Services Section: Plesk lookup by domain name, then "Manage your website" or upsell cards (tools-style layout, primary buttons)
function ConnectedServicesSection({
  domainName,
  onHostingClick,
  isAgency,
  teamSlug,
  customerTeamId,
}: {
  domainName: string;
  onHostingClick: (type: "web" | "email") => void;
  isAgency: boolean;
  teamSlug: string;
  /** Required for customer view: server scopes Plesk match to subscriptions linked to this team */
  customerTeamId: string | null;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.hosting.getHostingByDomainName.useQuery(
    isAgency
      ? { domainName }
      : { domainName, teamId: customerTeamId ?? undefined },
    { enabled: !!domainName && (isAgency || !!customerTeamId) }
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
              onClick={() => navigate(isAgency ? `/agency/hosting/${subscriptionId}` : `/${teamSlug}/hosting/${subscriptionId}`)}
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
                <h3 className="font-medium">Get professional web design and development</h3>
                <p className="text-sm text-muted-foreground">
                  Transform your domain into a powerful online presence. Our expert team delivers custom websites, modern designs, and seamless user experiences that drive results.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onWebDesignClick}
            >
              Learn More
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
  shouldShowRenew
}: {
  domain: DomainPortfolio;
  getStatusBadge: () => React.ReactNode;
  shouldShowRenew: boolean;
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
        </div>
      </CardContent>
    </Card>
  );
}
