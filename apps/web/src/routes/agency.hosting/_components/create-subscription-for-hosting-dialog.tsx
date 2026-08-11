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
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useHostingSubscriptionById } from "./use-hosting-subscription-by-id";
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

  const [subscriptionDate, setSubscriptionDate] = React.useState<Date>(() => new Date());
  const [expiryDate, setExpiryDate] = React.useState<Date>(() =>
    addBillingPeriod(new Date(), "YEARLY")
  );
  const [billingCycle, setBillingCycle] = React.useState<"YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM">("YEARLY");
  const [hostingType, setHostingType] = React.useState<"WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING">("WEB_HOSTING");
  const [primaryDomain, setPrimaryDomain] = React.useState("");
  const [pleskFilterId, setPleskFilterId] = React.useState("");
  const [pleskOwnerId, setPleskOwnerId] = React.useState("");
  const [pleskFtpLogin, setPleskFtpLogin] = React.useState("");
  const [pleskFtpPassword, setPleskFtpPassword] = React.useState("");

  const pleskIdStr = pleskSubscriptionId != null ? String(pleskSubscriptionId) : "";
  const { data: pleskDetail } = useHostingSubscriptionById(pleskIdStr);
  const pleskAppliedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    pleskAppliedRef.current = null;
  }, [pleskIdStr]);

  const utils = trpc.useUtils();

  const { data: products = [], isLoading: isLoadingProducts } =
    trpc.products.getAll.useQuery({ isActive: true }, { enabled: open });

  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(
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
    const today = new Date();
    setSubscriptionDate(today);
    setExpiryDate(addBillingPeriod(today, "YEARLY"));
    setBillingCycle("YEARLY");
    setHostingType("WEB_HOSTING");
    setPrimaryDomain("");
    setPleskFilterId("");
    setPleskOwnerId("");
    setPleskFtpLogin("");
    setPleskFtpPassword("");
  }

  React.useEffect(() => {
    if (!open) {
      resetForm();
      pleskAppliedRef.current = null;
    } else if (subscriptionNameProp) {
      setName(subscriptionNameProp);
    }
  }, [open, subscriptionNameProp]);

  // Prefill from Plesk when detail loads. Run only once per pleskDetail.id to avoid infinite loop (pleskDetail may be new ref each render).
  React.useEffect(() => {
    if (!open || !pleskDetail) return;
    const detailId = String(pleskDetail.id ?? "");
    if (pleskAppliedRef.current === detailId) return;
    pleskAppliedRef.current = detailId;

    setName(pleskDetail.gen_info?.name ?? subscriptionNameProp ?? "");
    setPrimaryDomain(pleskDetail.gen_info?.name ?? "");
    setPleskFilterId(detailId);
    setPleskOwnerId(pleskDetail.gen_info?.["owner-login"] ?? "");
    const props = pleskDetail.hosting?.vrt_hst?.property ?? [];
    const arr = Array.isArray(props) ? props : [props];
    const ftpLogin = arr.find((p: { name?: string }) => p?.name === "ftp_login");
    const ftpPassword = arr.find((p: { name?: string }) => p?.name === "ftp_password");
    setPleskFtpLogin(ftpLogin && "value" in ftpLogin ? String(ftpLogin.value) : "");
    setPleskFtpPassword(ftpPassword && "value" in ftpPassword ? String(ftpPassword.value) : "");
    if (pleskDetail.gen_info?.["cr_date"]) {
      const subDate = new Date(pleskDetail.gen_info["cr_date"]);
      setSubscriptionDate(subDate);
      setExpiryDate(addBillingPeriod(subDate, billingCycle));
    }
  }, [open, pleskDetail, subscriptionNameProp, billingCycle]);

  // When subscription date or billing cycle changes, update expiry date from subscription date + billing period
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
    () => products.map((p) => ({ id: p.id, label: p.name })),
    [products]
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

    createMutation.mutate({
      productId: selectedProductId,
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
      pleskOwnerId: pleskOwnerId || undefined,
      pleskFtpLogin: pleskFtpLogin || undefined,
      pleskFtpPassword: pleskFtpPassword || undefined,
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

