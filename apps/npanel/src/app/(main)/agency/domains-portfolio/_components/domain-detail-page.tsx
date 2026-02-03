"use client";

import * as React from "react";
import { ArrowLeft, ExternalLink, Info, QrCode, Monitor, LayoutDashboard, Network, Server, Globe, ChevronRight, Code2, AlertCircle, Calendar, MoreVertical, Link2, Link2Off, RefreshCw } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
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
  const [linkToTeamDialogOpen, setLinkToTeamDialogOpen] = React.useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = React.useState(false);

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

  const utils = trpc.useUtils();
  const { data: ourDomain } = trpc.domains.getByDomainName.useQuery(
    { domainName: domain?.domain ?? "" },
    { enabled: !!domain?.domain }
  );
  const isLinkedToTeam = !!ourDomain?.teamId;

  const unlinkFromTeamMutation = trpc.domains.unlinkFromTeam.useMutation({
    onSuccess: () => {
      setUnlinkConfirmOpen(false);
      toast.success("Domain unlinked from team");
      utils.domains.getByDomainName.invalidate({ domainName: domain?.domain ?? "" });
    },
    onError: (error) => {
      toast.error("Failed to unlink domain from team", { description: error.message });
    },
  });

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
            <Button onClick={() => router.push("/agency/domains-portfolio")} variant="outline">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isLinkedToTeam ? (
                <DropdownMenuItem
                  onClick={() => setUnlinkConfirmOpen(true)}
                  disabled={unlinkFromTeamMutation.isPending}
                >
                  <Link2Off className="h-4 w-4 mr-2" />
                  Unlink from team
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setLinkToTeamDialogOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to team
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <ContactInformationCard domain={domain} />
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
        supportPhoneNumber={process.env.NEXT_PUBLIC_SUPPORT_PHONE}
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
      <LinkToTeamDialog
        open={linkToTeamDialogOpen}
        onOpenChange={setLinkToTeamDialogOpen}
        domain={domain}
      />
      <AlertDialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink domain from team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the domain from the team. The team will no longer have access to
              this domain for management or visibility. You can link it to another team later if
              needed. This action does not affect the domain&apos;s registration or DNS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkFromTeamMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (ourDomain && !unlinkFromTeamMutation.isPending) {
                  unlinkFromTeamMutation.mutate({ id: ourDomain.id });
                }
              }}
              disabled={unlinkFromTeamMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkFromTeamMutation.isPending ? "Unlinking…" : "Unlink from team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Link to Team dialog: updateTeam if domain exists in our DB, else linkToTeam (create)
interface LinkToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio;
}

function LinkToTeamDialog({ open, onOpenChange, domain }: LinkToTeamDialogProps) {
  const utils = trpc.useUtils();
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [openProviderPrice, setOpenProviderPrice] = React.useState("");
  const [niscPrice, setNiscPrice] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const { data: ourDomain } = trpc.domains.getByDomainName.useQuery(
    { domainName: domain.domain },
    { enabled: open && !!domain?.domain }
  );

  React.useEffect(() => {
    if (open && ourDomain) {
      setOpenProviderPrice(ourDomain.openProviderPrice ?? "");
      setNiscPrice(ourDomain.niscPrice ?? "");
      setNotes(ourDomain.notes ?? "");
    }
  }, [open, ourDomain]);

  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const updateTeamMutation = trpc.domains.updateTeam.useMutation({
    onSuccess: () => {
      toast.success("Domain linked to team successfully");
      onOpenChange(false);
      setSelectedTeamId("");
      utils.domains.getByDomainName.invalidate({ domainName: domain.domain });
    },
    onError: (error) => {
      toast.error("Failed to link domain to team", { description: error.message });
    },
  });

  const linkToTeamMutation = trpc.domains.linkToTeam.useMutation({
    onSuccess: () => {
      toast.success("Domain linked to team successfully");
      onOpenChange(false);
      setSelectedTeamId("");
      setOpenProviderPrice("");
      setNiscPrice("");
      setNotes("");
      utils.domains.getByDomainName.invalidate({ domainName: domain.domain });
    },
    onError: (error) => {
      toast.error("Failed to link domain to team", { description: error.message });
    },
  });

  const isUpdateFlow = !!ourDomain;
  const isSubmitting = updateTeamMutation.isPending || linkToTeamMutation.isPending;

  const openProviderId = typeof domain.id === "string" ? Number.parseInt(domain.id, 10) : domain.id;
  const registrationDate = domain.registrationDate
    ? new Date(domain.registrationDate)
    : new Date();
  const activationDate = domain.activeDate ? new Date(domain.activeDate) : null;
  const expirationDate = domain.expiryDate ? new Date(domain.expiryDate) : null;
  const renewalDate = domain.renewalDate ? new Date(domain.renewalDate) : null;

  const handleSubmit = () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    if (isUpdateFlow) {
      updateTeamMutation.mutate({
        id: ourDomain.id,
        teamId: selectedTeamId,
        openProviderPrice: openProviderPrice || undefined,
        niscPrice: niscPrice || undefined,
        notes: notes || undefined,
      });
    } else {
      if (Number.isNaN(openProviderId)) {
        toast.error("Invalid OpenProvider domain ID");
        return;
      }
      linkToTeamMutation.mutate({
        domainName: domain.domain,
        openProviderId,
        teamId: selectedTeamId,
        registrationDate,
        openProviderPrice: openProviderPrice || undefined,
        niscPrice: niscPrice || undefined,
        activationDate: activationDate ?? undefined,
        expirationDate: expirationDate ?? undefined,
        renewalDate: renewalDate ?? undefined,
        notes: notes || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link to team</DialogTitle>
          <DialogDescription>
            {isUpdateFlow
              ? `Link ${domain.domain} to a team. The team owner will be notified.`
              : `Add ${domain.domain} to the system and link it to a team. The team owner will be notified.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-team-select">Team *</Label>
            {isLoadingTeams ? (
              <div className="flex h-10 items-center justify-center rounded-md border">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <select
                id="link-team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a team</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link-openprovider-price">OpenProvider price (KES)</Label>
              <Input
                id="link-openprovider-price"
                type="number"
                step="0.01"
                value={openProviderPrice}
                onChange={(e) => setOpenProviderPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-nisc-price">NISC price (KES)</Label>
              <Input
                id="link-nisc-price"
                type="number"
                step="0.01"
                value={niscPrice}
                onChange={(e) => setNiscPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-notes">Notes (optional)</Label>
            <Textarea
              id="link-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedTeamId}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Link to team
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const router = useRouter();
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
              onClick={() => router.push(`/agency/hosting/${subscriptionId}`)}
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
