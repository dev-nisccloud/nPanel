"use client";

import * as React from "react";
import { User, Users, RefreshCw, Server } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

interface CreateSubscriptionForHivelocityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Hivelocity device id */
  deviceId: string | number;
  /** Pre-fill subscription name (e.g. Device name or hostname) */
  deviceName?: string;
  /** Service type: VPS, Dedicated, VDS */
  serviceType: "vps" | "dedicated" | "vds";
}

type LinkType = "user" | "team";

export function CreateSubscriptionForHivelocityDialog({
  open,
  onOpenChange,
  onSuccess,
  deviceId,
  deviceName,
  serviceType,
}: CreateSubscriptionForHivelocityDialogProps) {
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

  const [subscriptionDate, setSubscriptionDate] = React.useState<Date>(() => new Date());
  const [expiryDate, setExpiryDate] = React.useState<Date>(() =>
    addBillingPeriod(new Date(), "YEARLY")
  );
  const [billingCycle, setBillingCycle] = React.useState<"YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM">("YEARLY");
  
  // Default hosting type based on serviceType
  const defaultHostingType = serviceType === "dedicated" ? "DEDICATED_HOSTING" : "VPS_HOSTING";
  const [hostingType, setHostingType] = React.useState<"WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING">(defaultHostingType);

  const utils = trpc.useUtils();

  // Load products - we can filter by hosting products
  const { data: products = [], isLoading: isLoadingProducts } =
    trpc.products.getAll.useQuery({ isActive: true }, { enabled: open });

  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(
    undefined,
    { enabled: open && linkType === "team" }
  );

  const { data: users = [], isLoading: isLoadingUsers } =
    trpc.creativeBriefs.listUsersForApprover.useQuery(undefined, {
      enabled: open && linkType === "user",
    });

  const createMutation = trpc.clientSubscriptions.create.useMutation({
    onSuccess: () => {    const ht = String(hostingType || defaultHostingType || serviceType || "");
    if (ht.includes("VDS")) captureEvent("vds_subscription_created", { plan: selectedProductId || "unknown" });
    else if (ht.includes("DEDICATED")) captureEvent("dedicated_server_subscription_created", { plan: selectedProductId || "unknown" });
    else captureEvent("vps_subscription_created", { plan: selectedProductId || "unknown" });

      toast.success("Subscription created and linked");
      onOpenChange(false);
      resetForm();
      utils.clientSubscriptions.getAll.invalidate();
      utils.clientSubscriptions.listForAgency.invalidate();
      utils.clientSubscriptions.getHivelocityDeviceIdsWithLinkedSubscription.invalidate();
      utils.clientSubscriptions.getHasLinkedSubscriptionByHivelocityDeviceId.invalidate({ hivelocityDeviceId: deviceId });
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(
        import.meta.env.DEV && error.message?.trim()
          ? error.message.trim()
          : "A system error occurred. Please try again.",
      );
    },
  });

  function resetForm() {
    setSelectedUserId("");
    setSelectedTeamId("");
    setSelectedProductId("");
    setName(deviceName || "");
    setProviderCost("");
    setProviderCostCurrency("KES");
    setAgreedPrice("");
    setAgreedCurrency("KES");
    setSubmitError(null);
    const today = new Date();
    setSubscriptionDate(today);
    setExpiryDate(addBillingPeriod(today, "YEARLY"));
    setBillingCycle("YEARLY");
    setHostingType(defaultHostingType);
  }

  React.useEffect(() => {
    if (!open) {
      resetForm();
    } else if (deviceName) {
      setName(deviceName);
    }
  }, [open, deviceName, serviceType]);

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

  const handleSubmit = () => {
    setSubmitError(null);

    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    if (linkType === "team" && !selectedTeamId) {
      toast.error("Please select an organization");
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
      billingCycle,
      autoRenew: false,
      pricingModel: "FIXED",
      agreedPrice: agreedPrice || undefined,
      agreedCurrency: agreedCurrency || "KES",
      providerCost: providerCost || undefined,
      providerCostCurrency: providerCostCurrency || undefined,
      hostingType,
      serviceRefs: {
        hivelocityDeviceId: String(deviceId),
        hivelocityServiceType: serviceType,
      },
    });
  };

  const isLoadingOptions = linkType === "team" ? isLoadingTeams : isLoadingUsers;
  const hasSelection = linkType === "team" ? !!selectedTeamId : !!selectedUserId;
  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Link {serviceType.toUpperCase()} to Subscription
          </DialogTitle>
          <DialogDescription>
            Attach this server to a customer subscription for billing and management.
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
                <Label htmlFor="subscription-name">Subscription name</Label>
                <Input
                  id="subscription-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp VPS"
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
                    Organization
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
                <Label>{linkType === "team" ? "Organization" : "User"} *</Label>
                {isLoadingOptions ? (
                  <div className="flex h-10 items-center justify-center rounded-md border">
                    <Spinner size={18} />
                  </div>
                ) : linkType === "team" ? (
                  <ComboboxDropdown
                    items={teamItems}
                    selectedItem={selectedTeam}
                    onSelect={(item) => setSelectedTeamId(item.id)}
                    placeholder="Select an organization..."
                    searchPlaceholder="Search organizations..."
                    emptyResults="No organizations found"
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
                  <Select 
                    value={hostingType} 
                    onValueChange={(v: any) => setHostingType(v)} 
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VPS_HOSTING">VPS</SelectItem>
                      <SelectItem value="DEDICATED_HOSTING">Dedicated</SelectItem>
                      <SelectItem value="WEB_HOSTING">Web hosting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>Device ID: {deviceId}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">{serviceType}</Badge>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground">Pricing (optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="hivelocity-provider-cost" className="text-xs">
                      Provider cost
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="hivelocity-provider-cost"
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
                        className="w-16 text-xs px-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hivelocity-agreed-price" className="text-xs">
                      Customer price
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        id="hivelocity-agreed-price"
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
                        className="w-16 text-xs px-2"
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
                  Linking...
                </>
              ) : (
                "Link to Subscription"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
