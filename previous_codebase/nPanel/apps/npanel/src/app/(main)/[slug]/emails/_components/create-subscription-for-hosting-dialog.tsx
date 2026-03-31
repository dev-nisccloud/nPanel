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
import { ComboboxDropdown, type ComboboxItem } from "@nPanel/ui/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

interface CreateSubscriptionForHostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Plesk subscription id – when set, the created NiscClientSubscription is linked via serviceRefs */
  pleskSubscriptionId?: string | number;
  /** Pre-fill subscription name (e.g. Plesk subscription name) */
  subscriptionName?: string;
}

type LinkType = "user" | "team";

export function CreateSubscriptionForHostingDialog({
  open,
  onOpenChange,
  onSuccess,
  pleskSubscriptionId,
  subscriptionName: subscriptionNameProp,
}: CreateSubscriptionForHostingDialogProps) {
  const [linkType, setLinkType] = React.useState<LinkType>("team");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [name, setName] = React.useState("");
  const [providerCost, setProviderCost] = React.useState("");
  const [providerCostCurrency, setProviderCostCurrency] = React.useState("KES");
  const [agreedPrice, setAgreedPrice] = React.useState("");
  const [agreedCurrency, setAgreedCurrency] = React.useState("KES");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: products = [], isLoading: isLoadingProducts } =
    trpc.products.getAll.useQuery({ isActive: true }, { enabled: open });

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
      utils.clientSubscriptions.listForAgency.invalidate();
      utils.clientSubscriptions.getPleskSubscriptionIdsWithLinkedSubscription.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  function resetForm() {
    setSelectedUserId("");
    setSelectedTeamId("");
    setSelectedProductId("");
    setName("");
    setProviderCost("");
    setProviderCostCurrency("KES");
    setAgreedPrice("");
    setAgreedCurrency("KES");
    setSubmitError(null);
  }

  React.useEffect(() => {
    if (!open) resetForm();
    else if (subscriptionNameProp) setName(subscriptionNameProp);
  }, [open, subscriptionNameProp]);

  const productItems: ComboboxItem[] = React.useMemo(
    () => products.map((p) => ({ id: p.id, label: p.name })),
    [products]
  );
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

  const selectedProduct = productItems.find((p) => p.id === selectedProductId);
  const selectedTeam = teamItems.find((t) => t.id === selectedTeamId);
  const selectedUser = userItems.find((u) => u.id === selectedUserId);

  const subscriptionDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const handleSubmit = () => {
    setSubmitError(null);

    if (!selectedProductId) {
      toast.error("Please select a product");
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
      productId: selectedProductId,
      name: name.trim() || undefined,
      userId: linkType === "user" ? selectedUserId : undefined,
      teamId: linkType === "team" ? selectedTeamId : undefined,
      status: "ACTIVE",
      subscriptionDate,
      expiryDate,
      billingCycle: "YEARLY",
      autoRenew: false,
      pricingModel: "FIXED",
      agreedPrice: agreedPrice || undefined,
      agreedCurrency: agreedCurrency || "KES",
      agreedCost: agreedPrice || undefined,
      agreedCostCurrency: agreedCurrency || undefined,
      providerCost: providerCost || undefined,
      providerCostCurrency: providerCostCurrency || undefined,
      serviceRefs:
        pleskSubscriptionId != null
          ? { pleskSubscriptionId: String(pleskSubscriptionId) }
          : undefined,
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
            Create a Nisc subscription for hosting and link it to a user or team. Choose the product type and assign ownership.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : productItems.length === 0 ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No active products found. Add products in Service Plans first.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="hosting-product">Product *</Label>
                <ComboboxDropdown
                  items={productItems}
                  selectedItem={selectedProduct}
                  onSelect={(item) => setSelectedProductId(item.id)}
                  placeholder="Select a product..."
                  searchPlaceholder="Search products..."
                  emptyResults="No products found"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription-name">Subscription name (optional)</Label>
                <Input
                  id="subscription-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp Web Hosting"
                  disabled={isSubmitting}
                />
              </div>

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
                {expiryDate.toLocaleDateString()} · Billing: Annual · Auto-renew: Off
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground">Pricing (optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="hosting-provider-cost" className="text-xs">
                      Provider price
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="hosting-provider-cost"
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
                    <Label htmlFor="hosting-agreed-price" className="text-xs">
                      Agreed price
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="hosting-agreed-price"
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

        {productItems.length > 0 && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedProductId || !hasSelection}
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
