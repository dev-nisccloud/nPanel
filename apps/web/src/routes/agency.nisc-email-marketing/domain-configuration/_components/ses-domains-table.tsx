"use client";

import * as React from "react";
import { Globe, EllipsisVertical, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { SesViewDomainSheet, type SesDomainLive } from "./ses-view-domain-sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NiscEmOrganizationSelect } from "@/components/nisc-email-marketing/nisc-em-organization-select";
import {
  NiscEmLinkOrganizationDialog,
  NiscEmLinkOrganizationMenuItem,
} from "@/components/nisc-email-marketing/nisc-em-link-organization";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <AlertCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
  }
};

function SesDomainRowActions(props: { domain: SesDomainLive; onVerified?: () => void }) {
  const { domain, onVerified } = props;
  const { showAdminFeatures } = useNiscEmailMarketingRoute();
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [disconnectOpen, setDisconnectOpen] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const utils = trpc.useUtils();
  const alreadyLinked = Boolean(domain.connectedTeamId);
  const connectedDomainId = domain.connectedDomainId ?? null;

  const verifyMutation = trpc.niscEmailMarketing.sesUsage.verifyDomainLive.useMutation({
    onSuccess: () => {
      toast.success("Domain verification checked", {
        description: `Verification status for ${domain.domainName} has been updated.`,
      });
      setIsVerifying(false);
      onVerified?.();
    },
    onError: (e) => {
      toast.error("Failed to verify domain", { description: e.message });
      setIsVerifying(false);
    },
  });

  const connectMutation = trpc.niscEmailMarketing.sesUsage.connectToNPanel.useMutation({
    onSuccess: async () => {
      toast.success("Connected to nPanel", {
        description: `${domain.domainName} is now available in the nPanel database.`,
      });
      setConnectOpen(false);
      await utils.niscEmailMarketing.sesUsage.listDomainsLive.invalidate();
      onVerified?.();
    },
    onError: (e) => {
      toast.error("Failed to connect", { description: e.message });
    },
  });

  const disconnectMutation = trpc.niscEmailMarketing.sesUsage.disconnectFromNPanel.useMutation({
    onSuccess: async () => {
      toast.success("Disconnected from nPanel", {
        description: `${domain.domainName} is no longer linked in the nPanel database.`,
      });
      setDisconnectOpen(false);
      await utils.niscEmailMarketing.sesUsage.listDomainsLive.invalidate();
      onVerified?.();
    },
    onError: (e) => {
      toast.error("Failed to disconnect", { description: e.message });
    },
  });

  const linkMutation = trpc.niscEmailMarketing.domains.linkOrganization.useMutation({
    onSuccess: async () => {
      toast.success("Organization linked", {
        description: `${domain.domainName} is now linked to the selected organization.`,
      });
      setLinkOpen(false);
      await utils.niscEmailMarketing.sesUsage.listDomainsLive.invalidate();
      await utils.niscEmailMarketing.domains.listLegacy.invalidate();
      onVerified?.();
    },
    onError: (e) => {
      toast.error("Failed to link organization", { description: e.message });
    },
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyMutation.mutateAsync({ domainName: domain.domainName });
    } catch {
      // handled
    }
  };

  const handleConnect = async () => {
    const teamId = selectedTeamId ? selectedTeamId : null;
    await connectMutation.mutateAsync({ domainName: domain.domainName, teamId });
  };

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync({ domainName: domain.domainName });
  };

  const menuBusy =
    isVerifying ||
    connectMutation.isPending ||
    disconnectMutation.isPending ||
    linkMutation.isPending;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={menuBusy}>
                  <EllipsisVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleVerify} disabled={menuBusy}>
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <Spinner size={14} className="shrink-0" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify Domain"
                  )}
                </DropdownMenuItem>

                {!domain.connected ? (
                  <DropdownMenuItem onClick={() => setConnectOpen(true)} disabled={menuBusy}>
                    {connectMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner size={14} className="shrink-0" />
                        Connecting...
                      </span>
                    ) : (
                      "Connect to nPanel"
                    )}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setDisconnectOpen(true)}
                    disabled={menuBusy}
                    className="text-destructive focus:text-destructive"
                  >
                    {disconnectMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner size={14} className="shrink-0" />
                        Disconnecting...
                      </span>
                    ) : (
                      "Disconnect from nPanel"
                    )}
                  </DropdownMenuItem>
                )}
                {showAdminFeatures && domain.connected ? (
                  <NiscEmLinkOrganizationMenuItem
                    alreadyLinked={alreadyLinked}
                    disabled={menuBusy || !connectedDomainId}
                    onSelect={() => setLinkOpen(true)}
                  />
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>Actions</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to nPanel</DialogTitle>
            <DialogDescription>
              Link this SES identity to the nPanel database so it can be selected in campaigns and domain configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Domain</span>
              <div className="font-medium">{domain.domainName}</div>
            </div>

            <NiscEmOrganizationSelect
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              disabled={connectMutation.isPending || alreadyLinked}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)} disabled={connectMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size={14} className="shrink-0" />
                  Connecting...
                </span>
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={disconnectOpen} onOpenChange={(open) => !disconnectMutation.isPending && setDisconnectOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect from nPanel</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{domain.domainName}</strong> from the nPanel database so it can no longer be selected in campaigns. It will <strong>not</strong> delete the identity from AWS SES.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size={14} className="shrink-0" />
                  Disconnecting...
                </span>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAdminFeatures && connectedDomainId ? (
        <NiscEmLinkOrganizationDialog
          open={linkOpen}
          onOpenChange={setLinkOpen}
          alreadyLinked={alreadyLinked}
          isPending={linkMutation.isPending}
          resourceLabel={domain.domainName}
          onConfirm={async (teamId) => {
            await linkMutation.mutateAsync({ id: connectedDomainId, teamId });
          }}
        />
      ) : null}
    </>
  );
}

export function SesDomainsTable(props: { domains: SesDomainLive[]; onRefetch?: () => void | Promise<unknown> }) {
  const { domains, onRefetch } = props;
  const [selected, setSelected] = React.useState<SesDomainLive | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Domain Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow
                key={domain.domainName}
                className="cursor-pointer"
                onClick={() => setSelected(domain)}
              >
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{domain.domainName}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(domain.status)}</TableCell>
                <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                  <SesDomainRowActions domain={domain} onVerified={() => onRefetch?.()} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SesViewDomainSheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        domain={selected}
        onVerified={onRefetch}
      />
    </>
  );
}

