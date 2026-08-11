"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
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
import { captureEvent } from "@/lib/posthog";

interface CreateSubscriptionForHostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Plesk subscription id – when set, the created NiscClientSubscription is linked via serviceRefs */
  pleskSubscriptionId?: string | number;
  /** Pre-fill subscription name (e.g. Plesk subscription name) */
  subscriptionName?: string;
}

export function CreateSubscriptionForHostingDialog({
  open,
  onOpenChange,
  onSuccess,
  pleskSubscriptionId,
  subscriptionName: subscriptionNameProp,
}: CreateSubscriptionForHostingDialogProps) {
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
    { enabled: open }
  );

  const createMutation = trpc.clientSubscriptions.create.useMutation({
    onSuccess: () => {
      captureEvent("hosting_subscription_created", {
      plan: selectedProductId || "unknown",
      price: agreedPrice ? Number(agreedPrice) : 0,
      currency: agreedCurrency,
      hosting_type: hostingType,
    });

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

  const selectedProduct = productItems.find((p) => p.id === selectedProductId);
  const selectedTeam = teamItems.find((t) => t.id === selectedTeamId);

  const subscriptionDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const handleSubmit = () => {
    setSubmitError(null);

    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    if (!selectedTeamId) {
      toast.error("Please select an organization");
      return;
    }

    createMutation.mutate({
      productId: selectedProductId,
      name: name.trim() || undefined,
      teamId: selectedTeamId,
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

  const isLoadingOptions = isLoadingTeams;
  const hasSelection = !!selectedTeamId;
  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create subscription</DialogTitle>
          <DialogDescription>
            Create a Nisc subscription for hosting and link it to an organization. Choose the product type and assign ownership.
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
                <Label>Organization *</Label>
                {isLoadingOptions ? (
                  <div className="flex h-10 items-center justify-center rounded-md border">
                    <Spinner size={18} />
                  </div>
                ) : (
                  <ComboboxDropdown
                    items={teamItems}
                    selectedItem={selectedTeam}
                    onSelect={(item) => setSelectedTeamId(item.id)}
                    placeholder="Select an organization..."
                    searchPlaceholder="Search organizations..."
                    emptyResults="No organizations found"
                    disabled={isSubmitting}
                  />
                )}
              </div>

              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Subscription date: {subscriptionDate.toLocaleDateString()}  · Expiry:{" "}
                {expiryDate.toLocaleDateString()}  · Billing: Annual  · Auto-renew: Off
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

