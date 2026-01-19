"use client";

import * as React from "react";
import { ArrowLeft, ExternalLink, Info, QrCode, Monitor, LayoutDashboard, Network, Server, Globe, ChevronRight, Code2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { QrCodeDialog } from "./qr-code-dialog";
import { HostingPlanDialog } from "./hosting-plan-dialog";
import { ProtectBrandTab } from "./protect-brand-tab";
import { DnsTab } from "./dns-tab";
import { NameserversTab } from "./nameservers-tab";
import { WebDesignContactDialog } from "./web-design-contact-dialog";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DomainDetailPageProps {
  domainId: string;
}

export function DomainDetailPage({ domainId }: DomainDetailPageProps) {
  const router = useRouter();
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  const [hostingDialogOpen, setHostingDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [hostingPlanType, setHostingPlanType] = React.useState<"web" | "email" | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [webDesignDialogOpen, setWebDesignDialogOpen] = React.useState(false);
  
  // Fetch domains list to find the specific domain
  const { data: domainsData, isLoading } = trpc.openProvider.domains.list.useQuery(
    {
      limit: 1000,
      offset: 0,
      with_customer_info: false,
    }
  );

  const domain = React.useMemo(() => {
    if (!domainsData?.data) return null;
    return (domainsData.data as DomainPortfolio[]).find((d) => d.id === domainId);
  }, [domainsData, domainId]);

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

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
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
    );
  }

  if (!domain) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">Domain not found</p>
          <Button onClick={() => router.push("/agency/domains-portfolio")} variant="outline">
            Back to Portfolio
          </Button>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agency/domains-portfolio">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Domain Details</h1>
          <p className="text-muted-foreground">Manage and monitor your domain</p>
        </div>
      </div>

      {/* Tabs */}
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
              {/* Domain Checklist / Upsell Section */}
              <DomainUpsellSection 
                domain={domain} 
                onHostingClick={handleHostingClick}
              />

              {/* Connected Services Section */}
              <ConnectedServicesSection />

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

              {/* DNS/Nameservers Card */}
              <DnsNameserversCard 
                domain={domain}
                onEditClick={() => setActiveTab("nameservers")}
              />

              {/* Contact Information Card */}
              <ContactInformationCard domain={domain} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="dns" className="mt-6">
          <DnsTab domain={domain} />
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

      {/* Dialogs */}
      <QrCodeDialog 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen}
        domain={domain.domain}
      />
      <WebDesignContactDialog
        open={webDesignDialogOpen}
        onOpenChange={setWebDesignDialogOpen}
      />
      <HostingPlanDialog
        open={hostingDialogOpen}
        onOpenChange={setHostingDialogOpen}
        planType="web"
      />
      <HostingPlanDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        planType="email"
      />
    </div>
  );
}

// Domain Upsell Section Component
function DomainUpsellSection({ 
  domain,
  onHostingClick
}: { 
  domain: DomainPortfolio;
  onHostingClick: (type: "web" | "email") => void;
}) {
  // Check if domain has hosting
  const hasHosting = false; // TODO: Check if domain is linked to hosting
  
  // Check if domain has email
  const hasEmail = false; // TODO: Check if domain has email accounts

  const upsellItems = [
    {
      id: "hosting",
      title: "Get web hosting for your domain",
      description: "Launch your website with our reliable hosting plans starting from KES 2,000/month",
      buttonText: "View Hosting Plans",
      completed: hasHosting,
      onClick: () => onHostingClick("web"),
    },
    {
      id: "email",
      title: "Get professional email accounts",
      description: "Create business email addresses with your domain name",
      buttonText: "View Email Plans",
      completed: hasEmail,
      onClick: () => onHostingClick("email"),
    },
  ];

  const completedCount = upsellItems.filter(item => item.completed).length;
  const totalCount = upsellItems.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recommended for your domain</h2>
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} completed
            </div>
          )}
        </div>
        {totalCount > 0 && (
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
        <div className="space-y-3">
          {upsellItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {item.completed ? (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                {!item.completed && (
                  <Button size="sm" onClick={item.onClick}>
                    {item.buttonText}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Connected Services Section Component
function ConnectedServicesSection() {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Connected services</h2>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Manage your website</h3>
              <p className="text-sm text-muted-foreground">
                Edit and manage the site that's accessible via your domain.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/agency/hosting")}
          >
            Manage site
          </Button>
        </div>
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
  const formattedDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

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
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">Expiration date</span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">{formattedDate}</div>
            {shouldShowRenew && (
              <Button variant="link" className="p-0 h-auto text-primary text-sm mt-1">
                Renew
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// DNS/Nameservers Card Component
function DnsNameserversCard({ 
  domain,
  onEditClick
}: { 
  domain: DomainPortfolio;
  onEditClick: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">DNS/Nameservers</h3>
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary text-sm"
            onClick={onEditClick}
          >
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          {domain.nameservers.length > 0 ? (
            domain.nameservers.map((ns, index) => (
              <div key={index} className="text-sm font-mono">
                {ns}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No nameservers configured</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Contact Information Card Component
function ContactInformationCard({ domain }: { domain: DomainPortfolio }) {
  const [showAll, setShowAll] = React.useState(false);

  // Extract name parts if available
  const fullName = domain.ownerFullName || domain.clientName || "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Contact information</h3>
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary text-sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Hide" : "View all"}
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Email: </span>
            <span className="font-mono">
              {showAll ? (domain.clientEmail || "N/A") : "**********"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">First name: </span>
            <span className="font-mono">
              {showAll ? (firstName || "N/A") : "******"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Last name: </span>
            <span className="font-mono">
              {showAll ? (lastName || "N/A") : "*****"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Phone number: </span>
            <span className="font-mono">
              {showAll ? "N/A" : "**********"}
            </span>
          </div>
          {showAll && domain.ownerHandle && (
            <div>
              <span className="text-muted-foreground">Owner Handle: </span>
              <span className="font-mono">{domain.ownerHandle}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
