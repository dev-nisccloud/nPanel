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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import { PlanOptionWithFeatures } from "@/components/plan-option-with-features";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

function addBillingPeriod(
  date: Date,
  cycle: "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM"
): Date {
  const next = new Date(date);
  if (cycle === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (cycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else if (cycle === "BIENNIALLY") next.setFullYear(next.getFullYear() + 2);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

function hostingTypeFromServiceType(
  serviceType?: string | null,
): "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" {
  const value = serviceType?.trim().toLowerCase() ?? "";
  if (value === "email_hosting") return "EMAIL_HOSTING";
  if (value.includes("reseller")) return "RESELLER_HOSTING";
  if (value.includes("vps")) return "VPS_HOSTING";
  if (value.includes("dedicated")) return "DEDICATED_HOSTING";
  return "WEB_HOSTING";
}

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
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const [name, setName] = React.useState("");
  const [providerCost, setProviderCost] = React.useState("");
  const [providerCostCurrency, setProviderCostCurrency] = React.useState("KES");
  const [agreedPrice, setAgreedPrice] = React.useState("");
  const [agreedCurrency, setAgreedCurrency] = React.useState("KES");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [subscriptionDate, setSubscriptionDate] = React.useState<Date>(() => new Date());
  const [expiryDate, setExpiryDate] = React.useState<Date>(() =>
    addBillingPeriod(new Date(), "YEARLY")
  );
  const [billingCycle, setBillingCycle] = React.useState<"YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM">("YEARLY");
  const [hostingType, setHostingType] = React.useState<"WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING">("WEB_HOSTING");
  const [primaryDomain, setPrimaryDomain] = React.useState("");
  const [pleskFilterId, setPleskFilterId] = React.useState("");
  const [preparedKey, setPreparedKey] = React.useState("");

  const pleskIdStr = pleskSubscriptionId != null ? String(pleskSubscriptionId) : "";
  const utils = trpc.useUtils();

  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(
    undefined,
    { enabled: open }
  );

  const catalogPrepare = trpc.clientSubscriptions.matchCatalogPlanForPleskWebspace.useQuery(
    { pleskSubscriptionId: pleskIdStr },
    {
      enabled: open && !!pleskIdStr,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );

  const catalogProducts = catalogPrepare.data?.products ?? [];
  const matchedProductId = catalogPrepare.data?.matchedProductId ?? null;
  const matchedPlanId = catalogPrepare.data?.matchedPlanId ?? null;
  const pleskPlanName = catalogPrepare.data?.plesk?.planName ?? null;
  const selectedCatalogProduct =
    catalogProducts.find((product) => product.id === selectedProductId) ?? null;
  const catalogPlans = selectedCatalogProduct?.plans ?? [];

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
      utils.clientSubscriptions.getLinkedHostingCustomersByPleskIds.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  function resetForm() {
    setSelectedTeamId("");
    setSelectedProductId("");
    setSelectedPlanId("");
    setName("");
    setProviderCost("");
    setProviderCostCurrency("KES");
    setAgreedPrice("");
    setAgreedCurrency("KES");
    setSubmitError(null);
    const today = new Date();
    setSubscriptionDate(today);
    setExpiryDate(addBillingPeriod(today, "YEARLY"));
    setBillingCycle("YEARLY");
    setHostingType("WEB_HOSTING");
    setPrimaryDomain("");
    setPleskFilterId("");
    setPreparedKey("");
  }

  React.useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    setName(subscriptionNameProp ?? "");
    setPrimaryDomain(subscriptionNameProp ?? "");
    setPleskFilterId(pleskIdStr);
  }, [open, subscriptionNameProp, pleskIdStr]);

  React.useEffect(() => {
    if (!open || !catalogPrepare.data || catalogPrepare.isFetching) return;
    const nextKey = `${pleskIdStr}:${catalogPrepare.data.matchedProductId ?? ""}:${catalogPrepare.data.matchedPlanId ?? ""}`;
    if (preparedKey === nextKey) return;
    setPreparedKey(nextKey);

    const nextProductId =
      catalogPrepare.data.matchedProductId ??
      catalogPrepare.data.products[0]?.id ??
      "";
    const nextProduct =
      catalogPrepare.data.products.find((product) => product.id === nextProductId) ??
      catalogPrepare.data.products[0] ??
      null;
    const nextPlanId =
      (nextProduct?.plans.some((plan) => plan.id === catalogPrepare.data.matchedPlanId)
        ? catalogPrepare.data.matchedPlanId
        : null) ??
      (nextProduct?.plans.length === 1 ? nextProduct.plans[0]?.id : "") ??
      "";
    const nextPlan = nextProduct?.plans.find((plan) => plan.id === nextPlanId) ?? null;

    setSelectedProductId(nextProductId);
    setSelectedPlanId(nextPlanId);
    if (nextProduct) setHostingType(hostingTypeFromServiceType(nextProduct.serviceType));
    if (nextPlan?.price) {
      setAgreedPrice(nextPlan.price);
      setAgreedCurrency(nextPlan.currency ?? "KES");
    }
    const cycle = nextPlan?.billingCycle?.toUpperCase();
    if (cycle === "MONTHLY" || cycle === "YEARLY" || cycle === "BIENNIALLY" || cycle === "CUSTOM") {
      setBillingCycle(cycle);
      setExpiryDate(addBillingPeriod(subscriptionDate, cycle));
    }
  }, [open, catalogPrepare.data, catalogPrepare.isFetching, pleskIdStr, preparedKey, subscriptionDate]);

  const applyPlanDefaults = React.useCallback(
    (planId: string) => {
      setSelectedPlanId(planId);
      const plan = catalogPlans.find((item) => item.id === planId);
      if (plan?.price) {
        setAgreedPrice(plan.price);
        setAgreedCurrency(plan.currency ?? "KES");
      }
      const cycle = plan?.billingCycle?.toUpperCase();
      if (cycle === "MONTHLY" || cycle === "YEARLY" || cycle === "BIENNIALLY" || cycle === "CUSTOM") {
        setBillingCycle(cycle);
        setExpiryDate(addBillingPeriod(subscriptionDate, cycle));
      }
    },
    [catalogPlans, subscriptionDate],
  );

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = catalogProducts.find((item) => item.id === productId);
    if (product) setHostingType(hostingTypeFromServiceType(product.serviceType));
    const nextPlanId =
      (product?.plans.some((plan) => plan.id === matchedPlanId) ? matchedPlanId : null) ??
      (product?.plans.length === 1 ? product.plans[0]?.id : "") ??
      "";
    applyPlanDefaults(nextPlanId ?? "");
  };

  const handleSubscriptionDateChange = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      setSubscriptionDate(date);
      setExpiryDate(addBillingPeriod(date, billingCycle));
    },
    [billingCycle]
  );
  const handleBillingCycleChange = React.useCallback(
    (value: "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM") => {
      setBillingCycle(value);
      setExpiryDate(addBillingPeriod(subscriptionDate, value));
    },
    [subscriptionDate]
  );

  const productItems: ComboboxItem[] = React.useMemo(
    () => catalogProducts.map((product) => ({ id: product.id, label: product.name })),
    [catalogProducts]
  );
  const teamItems: ComboboxItem[] = React.useMemo(
    () => teams.map((t) => ({ id: t.id, label: t.name })),
    [teams]
  );

  const selectedProduct = productItems.find((p) => p.id === selectedProductId);
  const selectedTeam = teamItems.find((t) => t.id === selectedTeamId);

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

    if (catalogPlans.length > 0 && !selectedPlanId) {
      toast.error("Please select a plan");
      return;
    }

    createMutation.mutate({
      productId: selectedProductId,
      productPlanId: selectedPlanId || undefined,
      name: name.trim() || undefined,
      teamId: selectedTeamId,
      status: "ACTIVE",
      subscriptionDate,
      expiryDate,
      billingCycle,
      autoRenew: false,
      pricingModel: "FIXED",
      agreedPrice: agreedPrice || undefined,
      agreedCurrency: agreedCurrency || "KES",
      agreedCost: agreedPrice || undefined,
      agreedCostCurrency: agreedCurrency || undefined,
      providerCost: providerCost || undefined,
      providerCostCurrency: providerCostCurrency || undefined,
      hostingType,
      primaryDomain: primaryDomain || undefined,
      pleskFilterId: pleskFilterId || undefined,
      serviceRefs:
        pleskSubscriptionId != null
          ? { pleskSubscriptionId: String(pleskSubscriptionId) }
          : undefined,
    });
  };

  const isPreparing =
    open &&
    (isLoadingTeams ||
      (!!pleskIdStr && (catalogPrepare.isPending || catalogPrepare.isFetching) && !catalogPrepare.data));
  const prepareFailed = !!pleskIdStr && catalogPrepare.isError && !catalogPrepare.data;
  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create subscription</DialogTitle>
          <DialogDescription>
            Create a Nisc subscription for hosting and link it to an organization. Choose the product type and assign ownership.
          </DialogDescription>
        </DialogHeader>

        {isPreparing ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Spinner size={28} />
            <p className="text-sm text-muted-foreground">Loading products, plans, and features…</p>
          </div>
        ) : prepareFailed ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {catalogPrepare.error?.message ?? "Unable to load catalog plans for this hosting subscription."}
          </div>
        ) : catalogProducts.length === 0 ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No active hosting products found. Add products in Service Plans first.
          </div>
        ) : (
          <>
        <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hosting-product">Product *</Label>
                <ComboboxDropdown
                  items={productItems}
                  selectedItem={selectedProduct}
                  onSelect={(item) => handleProductChange(item.id)}
                  placeholder="Select a product..."
                  searchPlaceholder="Search products..."
                  emptyResults="No products found"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Plan *</Label>
                {catalogPlans.length === 0 ? (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    No active plans found for this product.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catalogPlans.map((plan) => (
                      <PlanOptionWithFeatures
                        key={plan.id}
                        plan={{
                          id: plan.id,
                          name: plan.name,
                          features: plan.features,
                          badge: matchedPlanId === plan.id ? "Plesk match" : null,
                        }}
                        selected={selectedPlanId === plan.id}
                        onSelect={applyPlanDefaults}
                        disabled={isSubmitting}
                        priceLabel={
                          plan.price
                            ? `${plan.currency ?? "KES"} ${plan.price}`
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
                {pleskPlanName ? (
                  <p className="text-xs text-muted-foreground">
                    {matchedPlanId
                      ? `Matched Plesk plan: ${pleskPlanName}`
                      : `Plesk plan “${pleskPlanName}” is not linked in the catalog. Choose the closest plan.`}
                  </p>
                ) : null}
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
                <ComboboxDropdown
                  items={teamItems}
                  selectedItem={selectedTeam}
                  onSelect={(item) => setSelectedTeamId(item.id)}
                  placeholder="Select an organization..."
                  searchPlaceholder="Search organizations..."
                  emptyResults="No organizations found"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Subscription date</Label>
                  <DatePicker
                    value={subscriptionDate}
                    onChange={handleSubscriptionDateChange}
                    placeholder="Pick a date"
                    disabled={isSubmitting}
                    formatString="PP"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expiry date</Label>
                  <DatePicker
                    value={expiryDate}
                    onChange={(date) => date && setExpiryDate(date)}
                    placeholder="Pick a date"
                    disabled={isSubmitting}
                    formatString="PP"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Billing cycle</Label>
                  <Select value={billingCycle} onValueChange={handleBillingCycleChange} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                      <SelectItem value="BIENNIALLY">Biennially</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hosting type</Label>
                  <Select value={hostingType} onValueChange={(v: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING") => setHostingType(v)} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB_HOSTING">Web hosting</SelectItem>
                      <SelectItem value="EMAIL_HOSTING">Email hosting</SelectItem>
                      <SelectItem value="RESELLER_HOSTING">Reseller</SelectItem>
                      <SelectItem value="VPS_HOSTING">VPS</SelectItem>
                      <SelectItem value="DEDICATED_HOSTING">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {primaryDomain && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Primary domain: {primaryDomain}
                  {pleskFilterId && `  · Plesk ID: ${pleskFilterId}`}
                </div>
              )}

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
        </div>

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
              disabled={
                isSubmitting ||
                !selectedProductId ||
                !selectedTeamId ||
                (catalogPlans.length > 0 && !selectedPlanId)
              }
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
