"use client";

import * as React from "react";
import { User, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface CreateSubscriptionFromDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio;
  onSuccess?: () => void;
}

type LinkType = "user" | "team";

export function CreateSubscriptionFromDomainDialog({
  open,
  onOpenChange,
  domain,
  onSuccess,
}: CreateSubscriptionFromDomainDialogProps) {
  const [linkType, setLinkType] = React.useState<LinkType>("team");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [providerCost, setProviderCost] = React.useState("");
  const [providerCostCurrency, setProviderCostCurrency] = React.useState("KES");
  const [agreedPrice, setAgreedPrice] = React.useState("");
  const [agreedCurrency, setAgreedCurrency] = React.useState("KES");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: domainsProductId, isLoading: isLoadingProduct } =
    trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: open });

  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(
    undefined,
    { enabled: open && linkType === "team" }
  );

  const { data: users = [], isLoading: isLoadingUsers } =
    trpc.creativeBriefs.listUsersForApprover.useQuery(undefined, {
      enabled: open && linkType === "user",
    });

  const createMutation = trpc.clientSubscriptions.create.useMutation({
    onSuccess: () => {
      toast.success("Subscription created");
      onOpenChange(false);
      resetForm();
      utils.clientSubscriptions.getAll.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  function resetForm() {
    setSelectedUserId("");
    setSelectedTeamId("");
    setProviderCost("");
    setProviderCostCurrency("KES");
    setAgreedPrice("");
    setAgreedCurrency("KES");
    setSubmitError(null);
  }

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const teamItems: ComboboxItem[] = React.useMemo(
    () => teams.map((t) => ({ id: t.id, label: t.name })),
    [teams]
  );
  const userItems: ComboboxItem[] = React.useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        label: u.name ? `${u.name} (${u.email})` : u.email,
      })),
    [users]
  );

  const selectedTeam = teamItems.find((t) => t.id === selectedTeamId);
  const selectedUser = userItems.find((u) => u.id === selectedUserId);

  const subscriptionDate = domain.orderDate
    ? new Date(domain.orderDate)
    : new Date();
  const expiryDate = domain.registryExpirationDate
    ? new Date(domain.registryExpirationDate)
    : new Date(domain.expiryDate);
  const nextRenewalDate = domain.renewalDate
    ? new Date(domain.renewalDate)
    : expiryDate;

  const openProviderId =
    typeof domain.id === "string" ? Number.parseInt(domain.id, 10) : domain.id;

  const billingCycle =
    domain.unit === "m"
      ? "MONTHLY"
      : domain.unit === "y"
        ? "YEARLY"
        : "YEARLY";

  const handleSubmit = () => {
    setSubmitError(null);

    if (!domainsProductId) {
      setSubmitError("Domains product not found. Please add a product named Domains first.");
      return;
    }

    if (linkType === "team" && !selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    if (linkType === "user" && !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    createMutation.mutate({
      productId: domainsProductId,
      name: domain.domain,
      userId: linkType === "user" ? selectedUserId : undefined,
      teamId: linkType === "team" ? selectedTeamId : undefined,
      status: "ACTIVE",
      subscriptionDate,
      nextRenewalDate,
      expiryDate,
      billingCycle,
      autoRenew: domain.autoRenewal ?? false,
      pricingModel: "FIXED",
      primaryDomain: domain.domain,
      openProviderId: Number.isNaN(openProviderId) ? undefined : openProviderId,
      domainAuthCode: domain.authCode ?? undefined,
      agreedPrice: agreedPrice || undefined,
      agreedCurrency: agreedCurrency || "KES",
      agreedCost: agreedPrice || undefined,
      agreedCostCurrency: agreedCurrency || undefined,
      providerCost: providerCost || undefined,
      providerCostCurrency: providerCostCurrency || undefined,
    });
  };

  const isLoadingOptions = linkType === "team" ? isLoadingTeams : isLoadingUsers;
  const hasSelection = linkType === "team" ? !!selectedTeamId : !!selectedUserId;
  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create subscription</DialogTitle>
          <DialogDescription>
            Create a NISC subscription for {domain.domain} and link it to a user or team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingProduct ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : !domainsProductId ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Domains product not found. Add a product whose name contains &quot;domain&quot; (e.g. Domains).
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Link to</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={linkType === "team" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLinkType("team")}
                    disabled={isSubmitting}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Team
                  </Button>
                  <Button
                    type="button"
                    variant={linkType === "user" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLinkType("user")}
                    disabled={isSubmitting}
                  >
                    <User className="mr-2 h-4 w-4" />
                    User
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{linkType === "team" ? "Team" : "User"} *</Label>
                {isLoadingOptions ? (
                  <div className="flex h-10 items-center justify-center rounded-md border">
                    <Spinner size={18} />
                  </div>
                ) : linkType === "team" ? (
                  <ComboboxDropdown
                    items={teamItems}
                    selectedItem={selectedTeam}
                    onSelect={(item) => setSelectedTeamId(item.id)}
                    placeholder="Select a team..."
                    searchPlaceholder="Search teams..."
                    emptyResults="No teams found"
                    disabled={isSubmitting}
                  />
                ) : (
                  <ComboboxDropdown
                    items={userItems}
                    selectedItem={selectedUser}
                    onSelect={(item) => setSelectedUserId(item.id)}
                    placeholder="Select a user..."
                    searchPlaceholder="Search users..."
                    emptyResults="No users found"
                    disabled={isSubmitting}
                  />
                )}
              </div>

              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Subscription date: {subscriptionDate.toLocaleDateString()} · Expiry:{" "}
                {expiryDate.toLocaleDateString()} · Next renewal: {nextRenewalDate.toLocaleDateString()} · Billing: {billingCycle} · Auto-renew: {domain.autoRenewal ? "On" : "Off"}
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground">Pricing (optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="provider-cost" className="text-xs">
                      Provider price
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="provider-cost"
                        type="text"
                        inputMode="decimal"
                        value={providerCost}
                        onChange={(e) => setProviderCost(e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <Input
                        value={providerCostCurrency}
                        onChange={(e) => setProviderCostCurrency(e.target.value)}
                        placeholder="KES"
                        disabled={isSubmitting}
                        className="w-16"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agreed-price" className="text-xs">
                      Agreed price
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="agreed-price"
                        type="text"
                        inputMode="decimal"
                        value={agreedPrice}
                        onChange={(e) => setAgreedPrice(e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <Input
                        value={agreedCurrency}
                        onChange={(e) => setAgreedCurrency(e.target.value)}
                        placeholder="KES"
                        disabled={isSubmitting}
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {domainsProductId && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasSelection}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create subscription"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

